<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::with(['customer', 'kasir', 'items']);

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        return $query->latest('created_at')->get();
    }

    public function show(Sale $sale)
    {
        return $sale->load(['customer', 'kasir', 'items.product']);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id'                 => ['nullable', 'uuid'], // dari client (offline sync)
            'customer_id'        => ['nullable', 'exists:customers,id'],
            'tipe_harga'         => ['required', 'in:umum,mitra'],
            'diskon'             => ['nullable', 'numeric', 'min:0'],
            'bayar'              => ['required', 'numeric', 'min:0'],
            'items'              => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.qty'        => ['required', 'integer', 'min:1'],
            'created_at'         => ['nullable', 'date'], // waktu transaksi asli (offline)
        ]);

        $sale = DB::transaction(function () use ($data, $request) {
            $subtotal = 0;
            $itemsToCreate = [];

            foreach ($data['items'] as $item) {
                // Kunci baris produk supaya stok aman dari race condition
                $product = Product::lockForUpdate()->findOrFail($item['product_id']);

                if ($product->stok < $item['qty']) {
                    abort(422, "Stok '{$product->nama}' tidak cukup (sisa {$product->stok}).");
                }

                $harga = $data['tipe_harga'] === 'mitra'
                    ? $product->harga_mitra
                    : $product->harga_umum;

                $itemSubtotal = $harga * $item['qty'];
                $subtotal += $itemSubtotal;

                $itemsToCreate[] = [
                    'product'        => $product,
                    'nama_snapshot'  => $product->nama,
                    'harga_snapshot' => $harga,
                    'qty'            => $item['qty'],
                    'subtotal'       => $itemSubtotal,
                ];
            }

            $diskon = $data['diskon'] ?? 0;
            $total  = max(0, $subtotal - $diskon);
            $bayar  = $data['bayar'];

            if ($bayar < $total) {
                abort(422, "Pembayaran kurang. Total Rp" . number_format($total, 0, ',', '.'));
            }

            $sale = Sale::create([
                'id'          => $data['id'] ?? (string) Str::uuid(),
                'invoice_no'  => $this->generateInvoiceNo(),
                'customer_id' => $data['customer_id'] ?? null,
                'kasir_id'    => $request->user()->id,
                'tipe_harga'  => $data['tipe_harga'],
                'subtotal'    => $subtotal,
                'diskon'      => $diskon,
                'total'       => $total,
                'bayar'       => $bayar,
                'kembalian'   => $bayar - $total,
                'created_at'  => $data['created_at'] ?? now(),
                'updated_at'  => now(),
            ]);

            foreach ($itemsToCreate as $row) {
                $product = $row['product'];
                $stokSebelum = $product->stok;
                $stokSesudah = $stokSebelum - $row['qty'];

                SaleItem::create([
                    'sale_id'        => $sale->id,
                    'product_id'     => $product->id,
                    'nama_snapshot'  => $row['nama_snapshot'],
                    'harga_snapshot' => $row['harga_snapshot'],
                    'qty'            => $row['qty'],
                    'subtotal'       => $row['subtotal'],
                ]);

                $product->update(['stok' => $stokSesudah]);

                StockMovement::create([
                    'product_id'   => $product->id,
                    'tipe'         => 'out',
                    'qty'          => $row['qty'],
                    'stok_sebelum' => $stokSebelum,
                    'stok_sesudah' => $stokSesudah,
                    'keterangan'   => 'Penjualan ' . $sale->invoice_no,
                    'ref_sale_id'  => $sale->id,
                    'user_id'      => $request->user()->id,
                ]);
            }

            return $sale;
        });

        return response()->json($sale->load(['items', 'customer', 'kasir']), 201);
    }

    private function generateInvoiceNo(): string
    {
        $prefix = 'INV-' . now()->format('Ymd') . '-';

        $last = Sale::where('invoice_no', 'like', $prefix . '%')
            ->orderBy('invoice_no', 'desc')
            ->first();

        $next = $last
            ? ((int) substr($last->invoice_no, -4)) + 1
            : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }
}
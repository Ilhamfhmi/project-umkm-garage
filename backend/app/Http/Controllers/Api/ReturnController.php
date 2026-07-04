<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ReturnItem;
use App\Models\ReturnSale;
use App\Models\Sale;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReturnController extends Controller
{
    // Daftar retur
    public function index(Request $request)
    {
        $query = ReturnSale::with(['sale:id,invoice_no', 'user:id,name', 'items']);

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        return $query->latest('created_at')->get();
    }

    public function show(ReturnSale $return)
    {
        return $return->load(['sale', 'user:id,name', 'items.product']);
    }

    // Cari transaksi by invoice untuk diretur (menampilkan sisa qty yang bisa diretur)
    public function cariTransaksi(Request $request)
    {
        $request->validate(['invoice_no' => ['required', 'string']]);

        $sale = Sale::with(['items.product:id,nama,stok', 'customer:id,nama'])
            ->where('invoice_no', $request->invoice_no)
            ->first();

        if (! $sale) {
            return response()->json(['message' => 'Transaksi tidak ditemukan.'], 404);
        }

        // Hitung berapa yang sudah diretur per produk sebelumnya
        $sudahDiretur = ReturnItem::whereIn(
            'return_id',
            ReturnSale::where('sale_id', $sale->id)->pluck('id')
        )
            ->select('product_id', DB::raw('SUM(qty) as total'))
            ->groupBy('product_id')
            ->pluck('total', 'product_id');

        // Tambahkan info sisa yang bisa diretur ke tiap item
        $items = $sale->items->map(function ($item) use ($sudahDiretur) {
            $diretur = (int) ($sudahDiretur[$item->product_id] ?? 0);
            return [
                'product_id'     => $item->product_id,
                'nama'           => $item->nama_snapshot,
                'harga'          => (float) $item->harga_snapshot,
                'qty_beli'       => $item->qty,
                'qty_diretur'    => $diretur,
                'qty_sisa'       => $item->qty - $diretur, // yang masih bisa diretur
            ];
        });

        return response()->json([
            'sale' => [
                'id'         => $sale->id,
                'invoice_no' => $sale->invoice_no,
                'created_at' => $sale->created_at,
                'customer'   => $sale->customer?->nama,
                'total'      => $sale->total,
            ],
            'items' => $items,
        ]);
    }

    // Proses retur
    public function store(Request $request)
    {
        $data = $request->validate([
            'sale_id'            => ['required', 'exists:sales,id'],
            'tipe'               => ['required', 'in:refund,tukar'],
            'alasan'             => ['nullable', 'string'],
            'catatan'            => ['nullable', 'string'],
            'items'              => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.qty'        => ['required', 'integer', 'min:1'],
        ]);

        $return = DB::transaction(function () use ($data, $request) {
            $sale = Sale::with('items')->lockForUpdate()->findOrFail($data['sale_id']);

            // Hitung yang sudah diretur sebelumnya (buat validasi)
            $sudahDiretur = ReturnItem::whereIn(
                'return_id',
                ReturnSale::where('sale_id', $sale->id)->pluck('id')
            )
                ->select('product_id', DB::raw('SUM(qty) as total'))
                ->groupBy('product_id')
                ->pluck('total', 'product_id');

            $totalRetur = 0;
            $itemsToProcess = [];

            foreach ($data['items'] as $item) {
                // Cari item asli di transaksi
                $saleItem = $sale->items->firstWhere('product_id', $item['product_id']);
                if (! $saleItem) {
                    abort(422, "Produk tidak ada dalam transaksi ini.");
                }

                $diretur = (int) ($sudahDiretur[$item['product_id']] ?? 0);
                $sisa = $saleItem->qty - $diretur;

                if ($item['qty'] > $sisa) {
                    abort(422, "Qty retur '{$saleItem->nama_snapshot}' melebihi sisa yang bisa diretur (sisa {$sisa}).");
                }

                $subtotal = $saleItem->harga_snapshot * $item['qty'];
                $totalRetur += $subtotal;

                $itemsToProcess[] = [
                    'sale_item' => $saleItem,
                    'qty'       => $item['qty'],
                    'subtotal'  => $subtotal,
                ];
            }

            $return = ReturnSale::create([
                'id'          => (string) Str::uuid(),
                'return_no'   => $this->generateReturnNo(),
                'sale_id'     => $sale->id,
                'user_id'     => $request->user()->id,
                'tipe'        => $data['tipe'],
                'total_retur' => $totalRetur,
                'alasan'      => $data['alasan'] ?? null,
                'catatan'     => $data['catatan'] ?? null,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);

            foreach ($itemsToProcess as $row) {
                $saleItem = $row['sale_item'];

                ReturnItem::create([
                    'return_id'      => $return->id,
                    'product_id'     => $saleItem->product_id,
                    'nama_snapshot'  => $saleItem->nama_snapshot,
                    'harga_snapshot' => $saleItem->harga_snapshot,
                    'qty'            => $row['qty'],
                    'subtotal'       => $row['subtotal'],
                ]);

                // Kembalikan stok (barang balik ke gudang)
                if ($saleItem->product_id) {
                    $product = Product::lockForUpdate()->find($saleItem->product_id);
                    if ($product) {
                        $stokSebelum = $product->stok;
                        $stokSesudah = $stokSebelum + $row['qty'];
                        $product->update(['stok' => $stokSesudah]);

                        StockMovement::create([
                            'product_id'   => $product->id,
                            'tipe'         => 'in',
                            'qty'          => $row['qty'],
                            'stok_sebelum' => $stokSebelum,
                            'stok_sesudah' => $stokSesudah,
                            'keterangan'   => 'Retur ' . $return->return_no,
                            'user_id'      => $request->user()->id,
                        ]);
                    }
                }
            }

            return $return;
        });

        return response()->json($return->load(['items', 'sale:id,invoice_no']), 201);
    }

    private function generateReturnNo(): string
    {
        $prefix = 'RTR-' . now()->format('Ymd') . '-';

        $last = ReturnSale::where('return_no', 'like', $prefix . '%')
            ->orderBy('return_no', 'desc')
            ->first();

        $next = $last ? ((int) substr($last->return_no, -4)) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }
}
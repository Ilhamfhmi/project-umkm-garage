<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    // Riwayat pergerakan stok
    public function index(Request $request)
    {
        $query = StockMovement::with(['product', 'user']);

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        return $query->latest()->get();
    }

    // Barang masuk (restok) — nambah stok
    public function masuk(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'qty'        => ['required', 'integer', 'min:1'],
            'keterangan' => ['nullable', 'string', 'max:255'],
        ]);

        return $this->recordMovement($request, $data, 'in', $data['qty']);
    }

    // Penyesuaian (stok opname) — set stok ke nilai baru
    public function adjust(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'stok_baru'  => ['required', 'integer', 'min:0'],
            'keterangan' => ['nullable', 'string', 'max:255'],
        ]);

        return DB::transaction(function () use ($request, $data) {
            $product = Product::lockForUpdate()->findOrFail($data['product_id']);
            $stokSebelum = $product->stok;
            $stokSesudah = $data['stok_baru'];
            $selisih = $stokSesudah - $stokSebelum;

            $product->update(['stok' => $stokSesudah]);

            $movement = StockMovement::create([
                'product_id'   => $product->id,
                'tipe'         => 'adjust',
                'qty'          => abs($selisih),
                'stok_sebelum' => $stokSebelum,
                'stok_sesudah' => $stokSesudah,
                'keterangan'   => $data['keterangan'] ?? 'Penyesuaian stok',
                'user_id'      => $request->user()->id,
            ]);

            return response()->json($movement->load('product'), 201);
        });
    }

    private function recordMovement(Request $request, array $data, string $tipe, int $delta)
    {
        return DB::transaction(function () use ($request, $data, $tipe, $delta) {
            $product = Product::lockForUpdate()->findOrFail($data['product_id']);
            $stokSebelum = $product->stok;
            $stokSesudah = $stokSebelum + $delta;

            $product->update(['stok' => $stokSesudah]);

            $movement = StockMovement::create([
                'product_id'   => $product->id,
                'tipe'         => $tipe,
                'qty'          => $data['qty'],
                'stok_sebelum' => $stokSebelum,
                'stok_sesudah' => $stokSesudah,
                'keterangan'   => $data['keterangan'] ?? 'Barang masuk',
                'user_id'      => $request->user()->id,
            ]);

            return response()->json($movement->load('product'), 201);
        });
    }
}
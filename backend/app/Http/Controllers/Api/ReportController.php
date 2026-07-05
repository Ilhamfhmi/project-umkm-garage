<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ReturnSale;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    // Ringkasan buat dashboard
    public function dashboard()
    {
        $today = now()->toDateString();

        // Penjualan kotor
        $jualHariIni  = (float) Sale::whereDate('created_at', $today)->sum('total');
        $jualBulanIni = (float) Sale::whereMonth('created_at', now()->month)
                                    ->whereYear('created_at', now()->year)->sum('total');

        // Retur (untuk dikurangkan)
        $returHariIni  = (float) ReturnSale::whereDate('created_at', $today)->sum('total_retur');
        $returBulanIni = (float) ReturnSale::whereMonth('created_at', now()->month)
                                           ->whereYear('created_at', now()->year)->sum('total_retur');

        return response()->json([
            'penjualan_hari_ini' => [
                'jumlah_transaksi' => Sale::whereDate('created_at', $today)->count(),
                'total_omzet'      => $jualHariIni - $returHariIni, // omzet bersih
                'total_retur'      => $returHariIni,
            ],
            'penjualan_bulan_ini' => [
                'jumlah_transaksi' => Sale::whereMonth('created_at', now()->month)
                                          ->whereYear('created_at', now()->year)->count(),
                'total_omzet'      => $jualBulanIni - $returBulanIni, // omzet bersih
                'total_retur'      => $returBulanIni,
            ],
            'total_produk'   => Product::where('is_active', true)->count(),
            'stok_menipis'   => Product::whereColumn('stok', '<=', 'stok_minimum')
                                       ->where('stok_minimum', '>', 0)
                                       ->get(['id', 'nama', 'stok', 'stok_minimum']),
            'transaksi_terbaru' => Sale::with('kasir:id,name')
                                       ->latest('created_at')->take(5)->get(),
        ]);
    }

    // Laporan penjualan per rentang tanggal
    public function penjualan(Request $request)
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to'   => ['nullable', 'date'],
        ]);

        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to ?? now()->toDateString();

        $sales = Sale::with(['customer:id,nama', 'kasir:id,name'])
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->latest('created_at')
            ->get();

        // Total retur di periode yang sama
        $totalRetur = (float) ReturnSale::whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->sum('total_retur');

        $omzetKotor = (float) $sales->sum('total');

        return response()->json([
            'periode' => ['from' => $from, 'to' => $to],
            'ringkasan' => [
                'jumlah_transaksi' => $sales->count(),
                'omzet_kotor'      => $omzetKotor,
                'total_retur'      => $totalRetur,
                'total_omzet'      => $omzetKotor - $totalRetur, // omzet bersih
                'total_diskon'     => (float) $sales->sum('diskon'),
            ],
            'transaksi' => $sales,
        ]);
    }

    // Produk terlaris
    public function produkTerlaris(Request $request)
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to ?? now()->toDateString();

        $data = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->whereDate('sales.created_at', '>=', $from)
            ->whereDate('sales.created_at', '<=', $to)
            ->select(
                'sale_items.nama_snapshot as nama',
                DB::raw('SUM(sale_items.qty) as total_terjual'),
                DB::raw('SUM(sale_items.subtotal) as total_omzet')
            )
            ->groupBy('sale_items.nama_snapshot')
            ->orderByDesc('total_terjual')
            ->limit(10)
            ->get();

        return response()->json($data);
    }
}
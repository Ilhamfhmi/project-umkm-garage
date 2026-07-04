<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\StockController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Semua role boleh baca; kasir bisa transaksi
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::apiResource('customers', CustomerController::class);

    // Transaksi — admin & staff
    Route::middleware('role:admin,staff')->group(function () {
        Route::post('/sales', [SaleController::class, 'store']);
        Route::post('/stock/masuk', [StockController::class, 'masuk']);
        Route::post('/stock/adjust', [StockController::class, 'adjust']);
    });

    // Lihat transaksi & laporan — semua role
    Route::get('/sales', [SaleController::class, 'index']);
    Route::get('/sales/{sale}', [SaleController::class, 'show']);
    Route::get('/stock', [StockController::class, 'index']);
    Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
    Route::get('/reports/penjualan', [ReportController::class, 'penjualan']);
    Route::get('/reports/produk-terlaris', [ReportController::class, 'produkTerlaris']);

    // Kelola produk & kategori — admin only
    Route::middleware('role:admin')->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
    });
});
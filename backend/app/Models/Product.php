<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasUuids;

    protected $fillable = [
        'category_id', 'nama', 'sku', 'satuan', 'stok', 'stok_minimum',
        'harga_beli', 'harga_umum', 'harga_mitra', 'is_active',
    ];

    protected $casts = [
        'harga_beli'  => 'decimal:2',
        'harga_umum'  => 'decimal:2',
        'harga_mitra' => 'decimal:2',
        'stok'        => 'integer',
        'stok_minimum'=> 'integer',
        'is_active'   => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    // Helper: cek stok menipis
    public function getIsLowStockAttribute(): bool
    {
        return $this->stok <= $this->stok_minimum;
    }
}
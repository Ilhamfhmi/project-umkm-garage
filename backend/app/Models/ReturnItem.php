<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ReturnItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'id', 'return_id', 'product_id', 'nama_snapshot',
        'harga_snapshot', 'qty', 'subtotal',
    ];

    protected $casts = [
        'harga_snapshot' => 'decimal:2',
        'subtotal'       => 'decimal:2',
        'qty'            => 'integer',
    ];

    public function return()
    {
        return $this->belongsTo(ReturnSale::class, 'return_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
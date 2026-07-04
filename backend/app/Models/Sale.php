<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasUuids;

    protected $fillable = [
        'id', 'invoice_no', 'customer_id', 'kasir_id', 'tipe_harga',
        'subtotal', 'diskon', 'total', 'bayar', 'kembalian',
        'created_at', 'updated_at',
    ];

    protected $casts = [
        'subtotal'  => 'decimal:2',
        'diskon'    => 'decimal:2',
        'total'     => 'decimal:2',
        'bayar'     => 'decimal:2',
        'kembalian' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function kasir()
    {
        return $this->belongsTo(User::class, 'kasir_id');
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }
}
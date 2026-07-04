<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ReturnSale extends Model
{
    use HasUuids;

    protected $table = 'returns';

    protected $fillable = [
        'id', 'return_no', 'sale_id', 'user_id', 'tipe',
        'total_retur', 'alasan', 'catatan', 'created_at', 'updated_at',
    ];

    protected $casts = [
        'total_retur' => 'decimal:2',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function items()
    {
        return $this->hasMany(ReturnItem::class, 'return_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
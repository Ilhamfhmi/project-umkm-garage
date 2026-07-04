<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasUuids;

    protected $fillable = ['nama', 'no_hp', 'alamat', 'tipe'];

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}
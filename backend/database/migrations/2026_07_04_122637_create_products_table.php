<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('nama');
            $table->string('sku')->nullable()->unique();
            $table->string('satuan')->default('pcs'); // pcs, liter, botol, dll
            $table->integer('stok')->default(0);
            $table->integer('stok_minimum')->default(0); // buat alert stok menipis
            $table->decimal('harga_beli', 12, 2)->default(0);
            $table->decimal('harga_umum', 12, 2)->default(0);
            $table->decimal('harga_mitra', 12, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
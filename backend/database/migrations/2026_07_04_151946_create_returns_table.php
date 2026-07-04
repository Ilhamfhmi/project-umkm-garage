<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('returns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('return_no')->unique();
            $table->foreignUuid('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('tipe', ['refund', 'tukar']); // refund uang / tukar barang
            $table->decimal('total_retur', 14, 2)->default(0); // nilai barang yang diretur
            $table->text('alasan')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('returns');
    }
};
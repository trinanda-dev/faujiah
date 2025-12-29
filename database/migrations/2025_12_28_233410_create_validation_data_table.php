<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('validation_data', function (Blueprint $table) {
            $table->id();
            $table->datetime('tanggal');
            $table->decimal('tinggi_gelombang', 8, 2);
            $table->decimal('kecepatan_angin', 8, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('validation_data');
    }
};

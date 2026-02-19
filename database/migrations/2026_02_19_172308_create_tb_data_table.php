<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Membuat tabel tb_data untuk menyimpan data utama untuk prediksi.
     * Tabel ini menyimpan data asli yang diupload sebelum dibagi menjadi training, validation, dan test.
     */
    public function up(): void
    {
        Schema::create('tb_data', function (Blueprint $table) {
            $table->id('id_data'); // Primary Key dengan nama id_data (Auto Increment)
            $table->datetime('timestamp'); // Waktu pencatatan data
            $table->float('tinggi_gelombang'); // Ketinggian gelombang (m)
            $table->float('kecepatan_angin'); // Kecepatan angin (m/s)
            $table->timestamps(); // created_at dan updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_data');
    }
};

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
        Schema::create('hybrid_predictions', function (Blueprint $table) {
            $table->id();
            $table->decimal('tinggi_gelombang', 8, 2);
            $table->decimal('kecepatan_angin', 8, 2);
            $table->decimal('prediksi_arimax', 10, 4);
            $table->decimal('prediksi_lstm_residual', 10, 4);
            $table->decimal('prediksi_hybrid', 10, 4);
            $table->decimal('mape_hybrid', 8, 4)->nullable();
            $table->timestamp('timestamp_prediksi')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hybrid_predictions');
    }
};

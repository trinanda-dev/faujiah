<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('hybrid_predictions')) {
            Schema::rename('hybrid_predictions', 'hasil_prediksi');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('hasil_prediksi')) {
            Schema::rename('hasil_prediksi', 'hybrid_predictions');
        }
    }
};

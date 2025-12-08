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
        Schema::table('hybrid_predictions', function (Blueprint $table) {
            // Drop old columns if they exist
            $table->dropColumn([
                'tinggi_gelombang',
                'kecepatan_angin',
                'prediksi_arimax',
                'prediksi_lstm_residual',
                'prediksi_hybrid',
                'mape_hybrid',
                'timestamp_prediksi',
            ]);
        });

        Schema::table('hybrid_predictions', function (Blueprint $table) {
            // Add new columns for real prediction data
            $table->date('tanggal')->after('id');
            $table->decimal('tinggi_gelombang_aktual', 10, 4)->after('tanggal');
            $table->decimal('tinggi_gelombang_arimax', 10, 4)->after('tinggi_gelombang_aktual');
            $table->decimal('residual_lstm', 10, 4)->after('tinggi_gelombang_arimax');
            $table->decimal('tinggi_gelombang_hybrid', 10, 4)->after('residual_lstm');
            $table->decimal('mape', 8, 4)->nullable()->after('tinggi_gelombang_hybrid');
            $table->decimal('mae', 10, 4)->nullable()->after('mape');
            $table->decimal('rmse', 10, 4)->nullable()->after('mae');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hybrid_predictions', function (Blueprint $table) {
            $table->dropColumn([
                'tanggal',
                'tinggi_gelombang_aktual',
                'tinggi_gelombang_arimax',
                'residual_lstm',
                'tinggi_gelombang_hybrid',
                'mape',
                'mae',
                'rmse',
            ]);
        });

        Schema::table('hybrid_predictions', function (Blueprint $table) {
            $table->decimal('tinggi_gelombang', 8, 2);
            $table->decimal('kecepatan_angin', 8, 2);
            $table->decimal('prediksi_arimax', 10, 4);
            $table->decimal('prediksi_lstm_residual', 10, 4);
            $table->decimal('prediksi_hybrid', 10, 4);
            $table->decimal('mape_hybrid', 8, 4)->nullable();
            $table->timestamp('timestamp_prediksi')->useCurrent();
        });
    }
};

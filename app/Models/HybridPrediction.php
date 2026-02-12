<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model untuk Menyimpan Hasil Prediksi Hybrid ARIMAX-LSTM
 *
 * Model ini menyimpan hasil prediksi dari model Hybrid yang menggabungkan:
 * 1. Prediksi ARIMAX - prediksi tinggi gelombang dari model ARIMAX
 * 2. Prediksi Residual LSTM - prediksi error/residual dari model LSTM
 * 3. Prediksi Hybrid - kombinasi ARIMAX + LSTM (prediksi final)
 *
 * Model Hybrid bekerja dengan cara:
 * - ARIMAX memprediksi tinggi gelombang berdasarkan data historis dan kecepatan angin
 * - LSTM memprediksi residual (selisih antara aktual dan prediksi ARIMAX)
 * - Prediksi final = Prediksi ARIMAX + Prediksi Residual LSTM
 *
 * Model ini juga menyimpan metrik evaluasi (MAPE, MAE, RMSE) untuk mengukur
 * akurasi prediksi terhadap nilai aktual.
 */
class HybridPrediction extends Model
{
    protected $table = 'hasil_prediksi';
    /**
     * Field-field yang dapat diisi secara mass assignment.
     *
     * @var array<string>
     */
    protected $fillable = [
        'tanggal', // Tanggal dan waktu prediksi
        'tinggi_gelombang_aktual', // Nilai aktual tinggi gelombang (dari data uji)
        'tinggi_gelombang_arimax', // Prediksi tinggi gelombang dari model ARIMAX
        'residual_lstm', // Prediksi residual dari model LSTM
        'tinggi_gelombang_hybrid', // Prediksi final hybrid (ARIMAX + LSTM)
        'mape', // Mean Absolute Percentage Error - metrik akurasi dalam persen
    ];

    /**
     * Casting tipe data untuk setiap field.
     *
     * Casting memastikan data disimpan dan diambil dalam format yang benar:
     * - datetime: untuk tanggal dan waktu
     * - decimal:4: untuk angka desimal dengan 4 digit di belakang koma
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal' => 'datetime', // Cast sebagai datetime (mendukung waktu, bukan hanya tanggal)
            'tinggi_gelombang_aktual' => 'decimal:4', // Decimal dengan 4 digit presisi
            'tinggi_gelombang_arimax' => 'decimal:4',
            'residual_lstm' => 'decimal:4',
            'tinggi_gelombang_hybrid' => 'decimal:4',
            'mape' => 'decimal:4', // MAPE dalam persen (contoh: 5.2345%)
        ];
    }
}

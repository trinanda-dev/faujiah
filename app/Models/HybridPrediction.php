<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HybridPrediction extends Model
{
    protected $fillable = [
        'tinggi_gelombang',
        'kecepatan_angin',
        'prediksi_arimax',
        'prediksi_lstm_residual',
        'prediksi_hybrid',
        'mape_hybrid',
        'timestamp_prediksi',
    ];

    protected function casts(): array
    {
        return [
            'tinggi_gelombang' => 'decimal:2',
            'kecepatan_angin' => 'decimal:2',
            'prediksi_arimax' => 'decimal:4',
            'prediksi_lstm_residual' => 'decimal:4',
            'prediksi_hybrid' => 'decimal:4',
            'mape_hybrid' => 'decimal:4',
            'timestamp_prediksi' => 'datetime',
        ];
    }
}

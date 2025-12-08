<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HybridPrediction extends Model
{
    protected $fillable = [
        'tanggal',
        'tinggi_gelombang_aktual',
        'tinggi_gelombang_arimax',
        'residual_lstm',
        'tinggi_gelombang_hybrid',
        'mape',
        'mae',
        'rmse',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'tinggi_gelombang_aktual' => 'decimal:4',
            'tinggi_gelombang_arimax' => 'decimal:4',
            'residual_lstm' => 'decimal:4',
            'tinggi_gelombang_hybrid' => 'decimal:4',
            'mape' => 'decimal:4',
            'mae' => 'decimal:4',
            'rmse' => 'decimal:4',
        ];
    }
}

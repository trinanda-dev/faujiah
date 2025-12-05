<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingData extends Model
{
    protected $fillable = [
        'tanggal',
        'tinggi_gelombang',
        'kecepatan_angin',
        'tinggi_gelombang_normalized',
        'kecepatan_angin_normalized',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'tinggi_gelombang' => 'decimal:2',
            'kecepatan_angin' => 'decimal:2',
            'tinggi_gelombang_normalized' => 'decimal:6',
            'kecepatan_angin_normalized' => 'decimal:6',
        ];
    }
}

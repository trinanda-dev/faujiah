<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestData extends Model
{
    protected $fillable = [
        'tanggal',
        'tinggi_gelombang',
        'kecepatan_angin',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'tinggi_gelombang' => 'decimal:2',
            'kecepatan_angin' => 'decimal:2',
        ];
    }
}

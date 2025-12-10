<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model untuk Menyimpan Data Latih (Training Data)
 * 
 * Model ini menyimpan 80% dari data yang diupload oleh user.
 * Data latih digunakan untuk:
 * 1. Training model ARIMAX - melatih model ARIMAX menggunakan data historis
 * 2. Training model LSTM - melatih model LSTM untuk memprediksi residual
 * 3. Analisis statistik - uji stasioneritas, ACF/PACF, identifikasi model
 * 
 * Data dibagi dengan proporsi 80:20 (training:test) yang merupakan
 * standar dalam machine learning. Data latih digunakan untuk "belajar"
 * pola dalam data, sedangkan data uji digunakan untuk "menguji"
 * kemampuan model pada data baru.
 * 
 * Model ini juga menyimpan data yang sudah dinormalisasi (jika diperlukan)
 * untuk keperluan training model tertentu yang memerlukan normalisasi.
 */
class TrainingData extends Model
{
    use HasFactory;

    /**
     * Field-field yang dapat diisi secara mass assignment.
     * 
     * @var array<string>
     */
    protected $fillable = [
        'tanggal', // Tanggal dan waktu observasi
        'tinggi_gelombang', // Tinggi gelombang aktual (dalam meter) - data asli
        'kecepatan_angin', // Kecepatan angin (dalam m/s) - data asli
        'tinggi_gelombang_normalized', // Tinggi gelombang yang sudah dinormalisasi (0-1)
        'kecepatan_angin_normalized', // Kecepatan angin yang sudah dinormalisasi (0-1)
    ];

    /**
     * Casting tipe data untuk setiap field.
     * 
     * Casting memastikan data disimpan dan diambil dalam format yang benar:
     * - datetime: untuk tanggal dan waktu (mendukung jam, menit, detik)
     * - decimal:2: untuk data asli dengan 2 digit presisi
     * - decimal:6: untuk data normalisasi dengan 6 digit presisi (lebih presisi karena range 0-1)
     * 
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal' => 'datetime', // Cast sebagai datetime untuk mendukung waktu (bukan hanya tanggal)
            'tinggi_gelombang' => 'decimal:2', // Data asli dengan 2 digit presisi (contoh: 1.50 m)
            'kecepatan_angin' => 'decimal:2', // Data asli dengan 2 digit presisi (contoh: 4.20 m/s)
            'tinggi_gelombang_normalized' => 'decimal:6', // Data normalisasi dengan 6 digit presisi (contoh: 0.523456)
            'kecepatan_angin_normalized' => 'decimal:6', // Data normalisasi dengan 6 digit presisi (contoh: 0.654321)
        ];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model untuk Menyimpan Data Validasi (Validation Data)
 *
 * Model ini menyimpan 15% dari data yang diupload oleh user.
 * Data validasi digunakan untuk:
 * 1. Validasi model - menguji performa model selama training
 * 2. Tuning hyperparameter - memilih parameter terbaik untuk model
 * 3. Early stopping - mencegah overfitting pada model LSTM
 * 4. Analisis performa - membandingkan performa training vs validation
 *
 * Data dibagi dengan proporsi 70:15:15 (training:validation:test) yang merupakan
 * standar dalam machine learning untuk memastikan model dapat digeneralisasi
 * dengan baik dan tidak overfitting.
 *
 * Data validasi tidak digunakan saat training model, hanya untuk validasi
 * dan tuning parameter.
 */
class ValidationData extends Model
{
    use HasFactory;

    /**
     * Field-field yang dapat diisi secara mass assignment.
     *
     * @var array<string>
     */
    protected $fillable = [
        'id_data', // Foreign key ke tb_data
        'tanggal', // Tanggal dan waktu observasi
        'tinggi_gelombang', // Tinggi gelombang aktual (dalam meter)
        'kecepatan_angin', // Kecepatan angin (dalam m/s)
    ];

    /**
     * Casting tipe data untuk setiap field.
     *
     * Casting memastikan data disimpan dan diambil dalam format yang benar:
     * - datetime: untuk tanggal dan waktu (mendukung jam, menit, detik)
     * - decimal:2: untuk angka desimal dengan 2 digit di belakang koma
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal' => 'datetime', // Cast sebagai datetime untuk mendukung waktu (bukan hanya tanggal)
            'tinggi_gelombang' => 'decimal:2', // Decimal dengan 2 digit presisi (contoh: 1.50 m)
            'kecepatan_angin' => 'decimal:2', // Decimal dengan 2 digit presisi (contoh: 4.20 m/s)
        ];
    }

    /**
     * Relasi ke Data (tb_data).
     * Validation data memiliki satu data master.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function data()
    {
        return $this->belongsTo(Data::class, 'id_data', 'id_data');
    }
}

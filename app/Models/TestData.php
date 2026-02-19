<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model untuk Menyimpan Data Uji (Test Data)
 *
 * Model ini menyimpan 15% dari data yang diupload oleh user.
 * Data uji digunakan untuk:
 * 1. Evaluasi model - menguji akurasi model yang sudah dilatih
 * 2. Prediksi hybrid - menghasilkan prediksi pada data uji
 * 3. Perbandingan - membandingkan prediksi dengan nilai aktual
 *
 * Data dibagi dengan proporsi 70:15:15 (training:validation:test) yang merupakan
 * standar dalam machine learning untuk memastikan model dapat
 * digeneralisasi dengan baik pada data baru.
 *
 * Data uji tidak digunakan saat training model, hanya untuk evaluasi.
 */
class TestData extends Model
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
     * Test data memiliki satu data master.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function data()
    {
        return $this->belongsTo(Data::class, 'id_data', 'id_data');
    }
}

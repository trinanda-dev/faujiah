<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model untuk Menyimpan Data Utama (tb_data)
 *
 * Model ini menyimpan data utama untuk prediksi yang meliputi timestamp,
 * ketinggian gelombang, dan kecepatan angin.
 * 
 * Tabel ini adalah tabel master yang menyimpan semua data asli sebelum
 * dibagi menjadi training, validation, dan test data.
 */
class Data extends Model
{
    use HasFactory;

    /**
     * Nama tabel yang digunakan oleh model.
     *
     * @var string
     */
    protected $table = 'tb_data';

    /**
     * Nama primary key yang digunakan oleh model.
     *
     * @var string
     */
    protected $primaryKey = 'id_data';

    /**
     * Field-field yang dapat diisi secara mass assignment.
     *
     * @var array<string>
     */
    protected $fillable = [
        'timestamp', // Waktu pencatatan data
        'tinggi_gelombang', // Ketinggian gelombang (m)
        'kecepatan_angin', // Kecepatan angin (m/s)
    ];

    /**
     * Casting tipe data untuk setiap field.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'timestamp' => 'datetime', // Cast sebagai datetime
            'tinggi_gelombang' => 'float', // Cast sebagai float
            'kecepatan_angin' => 'float', // Cast sebagai float
        ];
    }

    /**
     * Relasi ke TrainingData.
     * Satu data dapat memiliki banyak training data (jika data digunakan untuk training).
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function trainingData()
    {
        return $this->hasMany(TrainingData::class, 'id_data', 'id_data');
    }

    /**
     * Relasi ke ValidationData.
     * Satu data dapat memiliki banyak validation data (jika data digunakan untuk validation).
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function validationData()
    {
        return $this->hasMany(ValidationData::class, 'id_data', 'id_data');
    }

    /**
     * Relasi ke TestData.
     * Satu data dapat memiliki banyak test data (jika data digunakan untuk test).
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function testData()
    {
        return $this->hasMany(TestData::class, 'id_data', 'id_data');
    }
}

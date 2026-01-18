<?php

namespace Database\Factories;

use App\Models\TrainingData;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TrainingData>
 */
class TrainingDataFactory extends Factory
{
    protected $model = TrainingData::class;

    /**
     * Tentukan status default model.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // Tanggal pengukuran data historis
            'tanggal' => fake()->dateTimeBetween('-1 year', 'now'),
            // Tinggi gelombang laut dalam meter
            'tinggi_gelombang' => fake()->randomFloat(2, 0.5, 3.0),
            // Kecepatan angin
            'kecepatan_angin' => fake()->randomFloat(2, 5.0, 15.0),
            // Tinggi gelombang yang dinormalisasi (akan dihitung nanti)
            'tinggi_gelombang_normalized' => null,
            // Kecepatan angin yang dinormalisasi (akan dihitung nanti)
            'kecepatan_angin_normalized' => null,
        ];
    }
}

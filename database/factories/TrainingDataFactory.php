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
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tanggal' => fake()->dateTimeBetween('-1 year', 'now'),
            'tinggi_gelombang' => fake()->randomFloat(2, 0.5, 3.0),
            'kecepatan_angin' => fake()->randomFloat(2, 5.0, 15.0),
            'tinggi_gelombang_normalized' => null,
            'kecepatan_angin_normalized' => null,
        ];
    }
}

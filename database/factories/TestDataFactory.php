<?php

namespace Database\Factories;

use App\Models\TestData;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TestData>
 */
class TestDataFactory extends Factory
{
    protected $model = TestData::class;

    /**
     * Tentukan status default model.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tanggal' => fake()->dateTimeBetween('now', '+1 month'),
            'tinggi_gelombang' => fake()->randomFloat(2, 0.5, 3.0),
            'kecepatan_angin' => fake()->randomFloat(2, 5.0, 15.0),
        ];
    }
}

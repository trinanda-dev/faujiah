<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * Kata sandi saat ini yang digunakan oleh factory.
     */
    protected static ?string $password;

    /**
     * Tentukan status default model.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // Nama lengkap pengguna
            'name' => fake()->name(),
            // Alamat email unik dan aman
            'email' => fake()->unique()->safeEmail(),
            // Waktu verifikasi email
            'email_verified_at' => now(),
            // Kata sandi yang di-hash
            'password' => static::$password ??= Hash::make('password'),
            // Token untuk fitur remember me
            'remember_token' => Str::random(10),
            // Rahasia untuk autentikasi dua faktor
            'two_factor_secret' => Str::random(10),
            // Kode pemulihan untuk autentikasi dua faktor
            'two_factor_recovery_codes' => Str::random(10),
            // Waktu konfirmasi autentikasi dua faktor
            'two_factor_confirmed_at' => now(),
        ];
    }

    /**
     * Menunjukkan bahwa alamat email model harus tidak diverifikasi.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Menunjukkan bahwa model tidak memiliki autentikasi dua faktor yang dikonfigurasi.
     */
    public function withoutTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);
    }
}

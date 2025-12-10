<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * Model untuk User (Pengguna)
 * 
 * Model ini menyimpan informasi pengguna yang dapat login ke aplikasi.
 * Menggunakan Laravel Fortify untuk autentikasi dan mendukung:
 * 1. Login/Register - autentikasi dasar
 * 2. Two Factor Authentication (2FA) - autentikasi dua faktor untuk keamanan tambahan
 * 3. Email Verification - verifikasi email (opsional)
 * 
 * Model ini mewarisi dari Authenticatable yang menyediakan fungsi-fungsi
 * autentikasi seperti login, logout, dan manajemen session.
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * Field-field yang dapat diisi secara mass assignment.
     * 
     * Mass assignment memungkinkan pengisian beberapa field sekaligus
     * saat membuat atau update user (dengan validasi yang tepat).
     * 
     * @var list<string>
     */
    protected $fillable = [
        'name', // Nama pengguna
        'email', // Email pengguna (digunakan untuk login)
        'password', // Password pengguna (akan di-hash otomatis)
    ];

    /**
     * Field-field yang disembunyikan saat serialisasi (JSON).
     * 
     * Field-field ini tidak akan muncul saat model di-convert ke JSON
     * untuk mencegah kebocoran informasi sensitif seperti password.
     * 
     * @var list<string>
     */
    protected $hidden = [
        'password', // Password tidak boleh ditampilkan
        'two_factor_secret', // Secret untuk 2FA tidak boleh ditampilkan
        'two_factor_recovery_codes', // Recovery codes untuk 2FA tidak boleh ditampilkan
        'remember_token', // Token untuk "remember me" tidak boleh ditampilkan
    ];

    /**
     * Casting tipe data untuk setiap field.
     * 
     * Casting memastikan data disimpan dan diambil dalam format yang benar:
     * - datetime: untuk timestamp
     * - hashed: untuk password (otomatis di-hash saat disimpan)
     * 
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime', // Timestamp kapan email diverifikasi
            'password' => 'hashed', // Password otomatis di-hash menggunakan bcrypt
            'two_factor_confirmed_at' => 'datetime', // Timestamp kapan 2FA dikonfirmasi
        ];
    }
}

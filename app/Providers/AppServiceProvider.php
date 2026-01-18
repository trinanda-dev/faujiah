<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/**
 * AppServiceProvider
 *
 * Service Provider utama aplikasi Laravel ini. Digunakan untuk
 * mendaftarkan dan menginisialisasi layanan aplikasi, binding,
 * event listener, dan konfigurasi lainnya.
 *
 * Penjelasan fungsi/penanganan utama:
 * - register(): Mendaftarkan layanan ke container IoC.
 * - boot(): Menginisialisasi layanan setelah semua provider terdaftar.
 *
 * Catatan: ini adalah tempat yang tepat untuk menambahkan binding
 * kustom, event listener, atau konfigurasi aplikasi.
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Daftarkan layanan aplikasi apa pun.
     */
    public function register(): void
    {
        // Tempat untuk mendaftarkan binding, singleton, atau layanan
        // ke container IoC Laravel. Method ini dipanggil sebelum boot().
        //
    }

    /**
     * Inisialisasi layanan aplikasi apa pun.
     */
    public function boot(): void
    {
        // Tempat untuk menginisialisasi layanan, mendaftarkan event listener,
        // menambahkan view composer, atau melakukan setup lainnya setelah
        // semua service provider terdaftar.
        //
    }
}

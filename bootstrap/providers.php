<?php

/**
 * File daftar service provider aplikasi.
 *
 * File ini berisi array dari service provider yang akan didaftarkan dalam aplikasi Laravel.
 * Provider ini akan dimuat secara otomatis saat aplikasi boot.
 */

return [
    // Service provider utama aplikasi untuk registrasi layanan umum.
    App\Providers\AppServiceProvider::class,
    // Service provider untuk konfigurasi Laravel Fortify (autentikasi).
    App\Providers\FortifyServiceProvider::class,
];

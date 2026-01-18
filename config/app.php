<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Nama Aplikasi
    |--------------------------------------------------------------------------
    |
    | Nilai ini adalah nama aplikasi Anda, yang akan digunakan ketika
    | framework perlu menampilkan nama aplikasi dalam notifikasi atau
    | elemen UI lainnya di mana nama aplikasi perlu ditampilkan.
    |
    */

    'name' => env('APP_NAME', 'Laravel'),

    /*
    |--------------------------------------------------------------------------
    | Environment Aplikasi
    |--------------------------------------------------------------------------
    |
    | Nilai ini menentukan "environment" di mana aplikasi Anda sedang
    | berjalan. Ini mungkin menentukan bagaimana Anda memilih untuk
    | mengkonfigurasi berbagai layanan yang digunakan aplikasi. Set ini
    | dalam file ".env" Anda.
    |
    */

    'env' => env('APP_ENV', 'production'),

    /*
    |--------------------------------------------------------------------------
    | Mode Debug Aplikasi
    |--------------------------------------------------------------------------
    |
    | Ketika aplikasi Anda dalam mode debug, pesan error detail dengan
    | stack traces akan ditampilkan pada setiap error yang terjadi dalam
    | aplikasi Anda. Jika dinonaktifkan, halaman error generik sederhana
    | akan ditampilkan.
    |
    */

    'debug' => (bool) env('APP_DEBUG', false),

    /*
    |--------------------------------------------------------------------------
    | URL Aplikasi
    |--------------------------------------------------------------------------
    |
    | URL ini digunakan oleh console untuk menghasilkan URL dengan benar
    | saat menggunakan alat command line Artisan. Anda harus mengatur ini
    | ke root aplikasi agar tersedia dalam perintah Artisan.
    |
    */

    'url' => env('APP_URL', 'http://localhost'),

    /*
    |--------------------------------------------------------------------------
    | Timezone Aplikasi
    |--------------------------------------------------------------------------
    |
    | Di sini Anda dapat menentukan timezone default untuk aplikasi Anda,
    | yang akan digunakan oleh fungsi tanggal dan waktu PHP. Timezone
    | diatur ke "UTC" secara default karena cocok untuk sebagian besar kasus.
    |
    */

    'timezone' => 'UTC',

    /*
    |--------------------------------------------------------------------------
    | Konfigurasi Locale Aplikasi
    |--------------------------------------------------------------------------
    |
    | Locale aplikasi menentukan locale default yang akan digunakan
    | oleh metode translation / localization Laravel. Opsi ini dapat
    | diatur ke locale apa pun yang Anda rencanakan untuk memiliki string
    | translation.
    |
    */

    'locale' => env('APP_LOCALE', 'en'),

    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),

    'faker_locale' => env('APP_FAKER_LOCALE', 'en_US'),

    /*
    |--------------------------------------------------------------------------
    | Kunci Enkripsi
    |--------------------------------------------------------------------------
    |
    | Kunci ini digunakan oleh layanan enkripsi Laravel dan harus diatur
    | ke string acak 32 karakter untuk memastikan semua nilai terenkripsi
    | aman. Anda harus melakukan ini sebelum men-deploy aplikasi.
    |
    */

    'cipher' => 'AES-256-CBC',

    'key' => env('APP_KEY'),

    'previous_keys' => [
        ...array_filter(
            explode(',', (string) env('APP_PREVIOUS_KEYS', ''))
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Driver Mode Maintenance
    |--------------------------------------------------------------------------
    |
    | Opsi konfigurasi ini menentukan driver yang digunakan untuk
    | menentukan dan mengelola status "maintenance mode" Laravel.
    | Driver "cache" akan memungkinkan maintenance mode dikontrol
    | di beberapa mesin.
    |
    | Driver yang didukung: "file", "cache"
    |
    */

    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],

];

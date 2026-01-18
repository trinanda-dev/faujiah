<?php

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Session Driver
    |--------------------------------------------------------------------------
    |
    | Opsi ini menentukan driver session default yang digunakan untuk
    | permintaan masuk. Laravel mendukung berbagai opsi penyimpanan untuk
    | mempertahankan data session. Penyimpanan database adalah pilihan
    | default yang bagus.
    |
    | Didukung: "file", "cookie", "database", "memcached",
    |            "redis", "dynamodb", "array"
    |
    */

    'driver' => env('SESSION_DRIVER', 'database'),

    /*
    |--------------------------------------------------------------------------
    | Session Lifetime
    |--------------------------------------------------------------------------
    |
    | Di sini Anda dapat menentukan jumlah menit yang Anda inginkan session
    | diizinkan tetap idle sebelum kedaluwarsa. Jika Anda ingin mereka
    | kedaluwarsa segera ketika browser ditutup, maka Anda dapat
    | menunjukkan itu melalui opsi konfigurasi expire_on_close.
    |
    */

    'lifetime' => (int) env('SESSION_LIFETIME', 120),

    'expire_on_close' => env('SESSION_EXPIRE_ON_CLOSE', false),

    /*
    |--------------------------------------------------------------------------
    | Session Encryption
    |--------------------------------------------------------------------------
    |
    | Opsi ini memungkinkan Anda dengan mudah menentukan bahwa semua data
    | session Anda harus dienkripsi sebelum disimpan. Semua enkripsi
    | dilakukan secara otomatis oleh Laravel dan Anda dapat menggunakan
    | session seperti biasa.
    |
    */

    'encrypt' => env('SESSION_ENCRYPT', false),

    /*
    |--------------------------------------------------------------------------
    | Session File Location
    |--------------------------------------------------------------------------
    |
    | Saat menggunakan driver session "file", file session ditempatkan
    | pada disk. Lokasi penyimpanan default didefinisikan di sini; namun,
    | Anda bebas untuk memberikan lokasi lain di mana mereka harus disimpan.
    |
    */

    'files' => storage_path('framework/sessions'),

    /*
    |--------------------------------------------------------------------------
    | Session Database Connection
    |--------------------------------------------------------------------------
    |
    | Saat menggunakan driver session "database" atau "redis", Anda dapat
    | menentukan koneksi yang harus digunakan untuk mengelola session ini.
    | Ini harus sesuai dengan koneksi dalam opsi konfigurasi database Anda.
    |
    */

    'connection' => env('SESSION_CONNECTION'),

    /*
    |--------------------------------------------------------------------------
    | Session Database Table
    |--------------------------------------------------------------------------
    |
    | Saat menggunakan driver session "database", Anda dapat menentukan tabel
    | yang akan digunakan untuk menyimpan session. Tentu saja, default yang
    | masuk akal didefinisikan untuk Anda; namun, Anda dipersilakan untuk
    | mengubah ini ke tabel lain.
    |
    */

    'table' => env('SESSION_TABLE', 'sessions'),

    /*
    |--------------------------------------------------------------------------
    | Session Cache Store
    |--------------------------------------------------------------------------
    |
    | Saat menggunakan salah satu backend session berbasis cache framework,
    | Anda dapat mendefinisikan cache store yang harus digunakan untuk
    | menyimpan data session di antara permintaan. Ini harus cocok dengan
    | salah satu cache store yang Anda definisikan.
    |
    | Mempengaruhi: "dynamodb", "memcached", "redis"
    |
    */

    'store' => env('SESSION_STORE'),

    /*
    |--------------------------------------------------------------------------
    | Session Sweeping Lottery
    |--------------------------------------------------------------------------
    |
    | Beberapa driver session harus secara manual menyapu lokasi penyimpanan
    | mereka untuk menghilangkan session lama dari penyimpanan. Di sini adalah
    | peluang bahwa itu akan terjadi pada permintaan tertentu. Secara default,
    | peluangnya adalah 2 dari 100.
    |
    */

    'lottery' => [2, 100],

    /*
    |--------------------------------------------------------------------------
    | Session Cookie Name
    |--------------------------------------------------------------------------
    |
    | Di sini Anda dapat mengubah nama cookie session yang dibuat oleh
    | framework. Biasanya, Anda tidak perlu mengubah nilai ini karena
    | melakukannya tidak memberikan peningkatan keamanan yang bermakna.
    |
    */

    'cookie' => env(
        'SESSION_COOKIE',
        Str::slug((string) env('APP_NAME', 'laravel')).'-session'
    ),

    /*
    |--------------------------------------------------------------------------
    | Session Cookie Path
    |--------------------------------------------------------------------------
    |
    | Path cookie session menentukan path di mana cookie akan dianggap
    | tersedia. Biasanya, ini akan menjadi path root aplikasi Anda,
    | tetapi Anda bebas mengubah ini jika diperlukan.
    |
    */

    'path' => env('SESSION_PATH', '/'),

    /*
    |--------------------------------------------------------------------------
    | Session Cookie Domain
    |--------------------------------------------------------------------------
    |
    | Nilai ini menentukan domain dan subdomain tempat cookie session
    | tersedia. Secara default, cookie akan tersedia untuk domain root
    | dan semua subdomain. Biasanya, ini tidak boleh diubah.
    |
    */

    'domain' => env('SESSION_DOMAIN'),

    /*
    |--------------------------------------------------------------------------
    | HTTPS Only Cookies
    |--------------------------------------------------------------------------
    |
    | Dengan mengatur opsi ini ke true, cookie session hanya akan dikirim
    | kembali ke server jika browser memiliki koneksi HTTPS. Ini akan
    | mencegah cookie dikirim ke Anda ketika tidak dapat dilakukan dengan aman.
    |
    */

    'secure' => env('SESSION_SECURE_COOKIE'),

    /*
    |--------------------------------------------------------------------------
    | HTTP Access Only
    |--------------------------------------------------------------------------
    |
    | Mengatur nilai ini ke true akan mencegah JavaScript mengakses
    | nilai cookie dan cookie hanya akan dapat diakses melalui
    | protokol HTTP. Sangat tidak mungkin Anda harus menonaktifkan opsi ini.
    |
    */

    'http_only' => env('SESSION_HTTP_ONLY', true),

    /*
    |--------------------------------------------------------------------------
    | Same-Site Cookies
    |--------------------------------------------------------------------------
    |
    | Opsi ini menentukan bagaimana cookie Anda berperilaku ketika permintaan
    | lintas-situs terjadi, dan dapat digunakan untuk mengurangi serangan CSRF.
    | Secara default, kami akan mengatur nilai ini ke "lax" untuk mengizinkan
    | permintaan lintas-situs yang aman.
    |
    | Lihat: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#samesitesamesite-value
    |
    | Didukung: "lax", "strict", "none", null
    |
    */

    'same_site' => env('SESSION_SAME_SITE', 'lax'),

    /*
    |--------------------------------------------------------------------------
    | Partitioned Cookies
    |--------------------------------------------------------------------------
    |
    | Mengatur nilai ini ke true akan mengikat cookie ke situs tingkat atas
    | untuk konteks lintas-situs. Cookie yang dipartisi diterima oleh browser
    | ketika ditandai "secure" dan atribut Same-Site diatur ke "none".
    |
    */

    'partitioned' => env('SESSION_PARTITIONED_COOKIE', false),

];

<?php

use Laravel\Fortify\Features;

return [

    /*
    |--------------------------------------------------------------------------
    | Fortify Guard
    |--------------------------------------------------------------------------
    |
    | Di sini Anda dapat menentukan guard autentikasi mana yang akan
    | digunakan Fortify saat mengautentikasi user. Nilai ini harus
    | sesuai dengan salah satu guard yang sudah ada di file konfigurasi
    | "auth" Anda.
    |
    */

    'guard' => 'web',

    /*
    |--------------------------------------------------------------------------
    | Fortify Password Broker
    |--------------------------------------------------------------------------
    |
    | Di sini Anda dapat menentukan broker password mana yang dapat
    | digunakan Fortify saat user mereset password mereka. Nilai yang
    | dikonfigurasi ini harus cocok dengan salah satu setup broker
    | password Anda di file konfigurasi "auth".
    |
    */

    'passwords' => 'users',

    /*
    |--------------------------------------------------------------------------
    | Username / Email
    |--------------------------------------------------------------------------
    |
    | Nilai ini mendefinisikan atribut model mana yang harus dianggap
    | sebagai field "username" aplikasi Anda. Biasanya, ini mungkin
    | alamat email user tetapi Anda bebas mengubah nilai ini di sini.
    |
    | Out of the box, Fortify mengharapkan permintaan forgot password
    | dan reset password memiliki field bernama 'email'. Jika aplikasi
    | menggunakan nama lain untuk field tersebut, Anda dapat mendefinisikannya
    | di bawah ini sesuai kebutuhan.
    |
    */

    'username' => 'email',

    'email' => 'email',

    /*
    |--------------------------------------------------------------------------
    | Lowercase Usernames
    |--------------------------------------------------------------------------
    |
    | Nilai ini mendefinisikan apakah usernames harus di-lowercase sebelum
    | menyimpannya di database, karena beberapa field string database
    | case sensitive. Anda dapat menonaktifkan ini untuk aplikasi Anda
    | jika diperlukan.
    |
    */

    'lowercase_usernames' => true,

    /*
    |--------------------------------------------------------------------------
    | Home Path
    |--------------------------------------------------------------------------
    |
    | Di sini Anda dapat mengkonfigurasi path di mana user akan di-redirect
    | selama autentikasi atau reset password saat operasi berhasil dan
    | user terautentikasi. Anda bebas mengubah nilai ini.
    |
    */

    'home' => '/dashboard',

    /*
    |--------------------------------------------------------------------------
    | Fortify Routes Prefix / Subdomain
    |--------------------------------------------------------------------------
    |
    | Di sini Anda dapat menentukan prefix mana yang akan ditugaskan Fortify
    | ke semua routes yang didaftarkannya dengan aplikasi. Jika diperlukan,
    | Anda dapat mengubah subdomain di mana semua routes Fortify akan
    | tersedia.
    |
    */

    'prefix' => '',

    'domain' => null,

    /*
    |--------------------------------------------------------------------------
    | Fortify Routes Middleware
    |--------------------------------------------------------------------------
    |
    | Di sini Anda dapat menentukan middleware mana yang akan ditugaskan
    | Fortify ke routes yang didaftarkannya dengan aplikasi. Jika diperlukan,
    | Anda dapat mengubah middleware ini tetapi biasanya default yang
    | disediakan lebih disukai.
    |
    */

    'middleware' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Secara default, Fortify akan throttle login ke lima permintaan per
    | menit untuk setiap kombinasi email dan IP address. Namun, jika Anda
    | ingin menentukan rate limiter kustom untuk dipanggil, Anda dapat
    | menentukannya di sini.
    |
    */

    'limiters' => [
        'login' => 'login',
        'two-factor' => 'two-factor',
    ],

    /*
    |--------------------------------------------------------------------------
    | Register View Routes
    |--------------------------------------------------------------------------
    |
    | Di sini Anda dapat menentukan apakah routes yang mengembalikan views
    | harus dinonaktifkan karena Anda mungkin tidak membutuhkannya saat
    | membangun aplikasi Anda sendiri. Ini mungkin terutama benar jika
    | Anda menulis aplikasi single-page kustom.
    |
    */

    'views' => true,

    /*
    |--------------------------------------------------------------------------
    | Features
    |--------------------------------------------------------------------------
    |
    | Beberapa fitur Fortify bersifat opsional. Anda dapat menonaktifkan
    | fitur dengan menghapusnya dari array ini. Anda bebas hanya menghapus
    | beberapa fitur ini, atau Anda bahkan dapat menghapus semua jika
    | diperlukan.
    |
    */

    'features' => [
        Features::registration(),
        Features::resetPasswords(),
        Features::emailVerification(),
        Features::twoFactorAuthentication([
            'confirm' => true,
            'confirmPassword' => true,
            // 'window' => 0
        ]),
    ],

];

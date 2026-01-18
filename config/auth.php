<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Autentikasi
    |--------------------------------------------------------------------------
    |
    | Opsi ini mendefinisikan "guard" autentikasi default dan "broker"
    | reset password untuk aplikasi Anda. Anda dapat mengubah nilai-nilai ini
    | sesuai kebutuhan, tetapi mereka adalah awal yang sempurna untuk
    | sebagian besar aplikasi.
    |
    */

    'defaults' => [
        'guard' => env('AUTH_GUARD', 'web'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'users'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Guard Autentikasi
    |--------------------------------------------------------------------------
    |
    | Selanjutnya, Anda dapat mendefinisikan setiap guard autentikasi untuk
    | aplikasi Anda. Tentu saja, konfigurasi default yang hebat telah
    | didefinisikan untuk Anda yang menggunakan penyimpanan session plus
    | provider user Eloquent.
    |
    | Semua guard autentikasi memiliki provider user, yang mendefinisikan
    | bagaimana user sebenarnya diambil dari database atau sistem penyimpanan
    | lainnya yang digunakan aplikasi. Biasanya, Eloquent digunakan.
    |
    | Didukung: "session"
    |
    */

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Provider User
    |--------------------------------------------------------------------------
    |
    | Semua guard autentikasi memiliki provider user, yang mendefinisikan
    | bagaimana user sebenarnya diambil dari database atau sistem penyimpanan
    | lainnya yang digunakan aplikasi. Biasanya, Eloquent digunakan.
    |
    | Jika Anda memiliki beberapa tabel atau model user, Anda dapat
    | mengkonfigurasi beberapa provider untuk mewakili model / tabel.
    | Provider ini kemudian dapat ditugaskan ke guard autentikasi ekstra
    | yang telah Anda definisikan.
    |
    | Didukung: "database", "eloquent"
    |
    */

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => env('AUTH_MODEL', App\Models\User::class),
        ],

        // 'users' => [
        //     'driver' => 'database',
        //     'table' => 'users',
        // ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Reset Password
    |--------------------------------------------------------------------------
    |
    | Opsi konfigurasi ini menentukan perilaku fungsionalitas reset password
    | Laravel, termasuk tabel yang digunakan untuk penyimpanan token dan
    | provider user yang dipanggil untuk sebenarnya mengambil user.
    |
    | Waktu expiry adalah jumlah menit di mana setiap token reset akan
    | dianggap valid. Fitur keamanan ini membuat token berumur pendek
    | sehingga memiliki lebih sedikit waktu untuk ditebak. Anda dapat
    | mengubah ini sesuai kebutuhan.
    |
    | Pengaturan throttle adalah jumlah detik user harus menunggu sebelum
    | menghasilkan lebih banyak token reset password. Ini mencegah user
    | dengan cepat menghasilkan jumlah token reset password yang sangat besar.
    |
    */

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Timeout Konfirmasi Password
    |--------------------------------------------------------------------------
    |
    | Di sini Anda dapat mendefinisikan jumlah detik sebelum jendela
    | konfirmasi password kedaluwarsa dan user diminta untuk memasukkan
    | kembali password mereka melalui layar konfirmasi. Secara default,
    | timeout berlangsung selama tiga jam.
    |
    */

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];

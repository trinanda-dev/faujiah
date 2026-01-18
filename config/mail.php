<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Mailer
    |--------------------------------------------------------------------------
    |
    | Opsi ini mengontrol mailer default yang digunakan untuk mengirim
    | semua pesan email kecuali mailer lain secara eksplisit ditentukan
    | saat mengirim pesan. Semua mailer tambahan dapat dikonfigurasi
    | dalam array "mailers". Contoh dari setiap jenis mailer disediakan.
    |
    */

    'default' => env('MAIL_MAILER', 'log'),

    /*
    |--------------------------------------------------------------------------
    | Mailer Configurations
    |--------------------------------------------------------------------------
    |
    | Di sini Anda dapat mengkonfigurasi semua mailer yang digunakan oleh
    | aplikasi Anda plus pengaturan masing-masing. Beberapa contoh telah
    | dikonfigurasi untuk Anda dan Anda bebas menambahkan yang Anda butuhkan
    | sesuai kebutuhan aplikasi.
    |
    | Laravel mendukung berbagai driver "transport" mail yang dapat digunakan
    | saat mengirim email. Anda dapat menentukan mana yang Anda gunakan untuk
    | mailer Anda di bawah. Anda juga dapat menambahkan mailer tambahan jika
    | diperlukan.
    |
    | Didukung: "smtp", "sendmail", "mailgun", "ses", "ses-v2",
    |            "postmark", "resend", "log", "array",
    |            "failover", "roundrobin"
    |
    */

    'mailers' => [

        'smtp' => [
            'transport' => 'smtp',
            'scheme' => env('MAIL_SCHEME'),
            'url' => env('MAIL_URL'),
            'host' => env('MAIL_HOST', '127.0.0.1'),
            'port' => env('MAIL_PORT', 2525),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN', parse_url((string) env('APP_URL', 'http://localhost'), PHP_URL_HOST)),
        ],

        'ses' => [
            'transport' => 'ses',
        ],

        'postmark' => [
            'transport' => 'postmark',
            // 'message_stream_id' => env('POSTMARK_MESSAGE_STREAM_ID'),
            // 'client' => [
            //     'timeout' => 5,
            // ],
        ],

        'resend' => [
            'transport' => 'resend',
        ],

        'sendmail' => [
            'transport' => 'sendmail',
            'path' => env('MAIL_SENDMAIL_PATH', '/usr/sbin/sendmail -bs -i'),
        ],

        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],

        'array' => [
            'transport' => 'array',
        ],

        'failover' => [
            'transport' => 'failover',
            'mailers' => [
                'smtp',
                'log',
            ],
            'retry_after' => 60,
        ],

        'roundrobin' => [
            'transport' => 'roundrobin',
            'mailers' => [
                'ses',
                'postmark',
            ],
            'retry_after' => 60,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Global "From" Address
    |--------------------------------------------------------------------------
    |
    | Anda mungkin ingin semua email yang dikirim oleh aplikasi Anda
    | dikirim dari alamat yang sama. Di sini Anda dapat menentukan nama
    | dan alamat yang digunakan secara global untuk semua email yang
    | dikirim oleh aplikasi Anda.
    |
    */

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
        'name' => env('MAIL_FROM_NAME', 'Example'),
    ],

];

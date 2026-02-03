<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Layanan Pihak Ketiga
    |--------------------------------------------------------------------------
    |
    | File ini digunakan untuk menyimpan kredensial untuk layanan pihak ketiga
    | seperti Mailgun, Postmark, AWS dan lainnya. File ini menyediakan lokasi
    | standar untuk jenis informasi ini, memungkinkan paket untuk memiliki
    | file konvensional untuk menemukan berbagai kredensial layanan.
    |
    */

    // Konfigurasi untuk layanan email Postmark
    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    // Konfigurasi untuk layanan email Resend
    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    // Konfigurasi untuk layanan email Amazon SES
    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    // Konfigurasi untuk integrasi Slack
    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Konfigurasi untuk layanan FastAPI (machine learning)
    'fastapi' => [
        'url' => env('FASTAPI_URL', 'http://localhost:8002'),
        'timeout' => env('FASTAPI_TIMEOUT', 300),
    ],

];

<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Di sini Anda dapat menentukan disk filesystem default yang harus
    | digunakan oleh framework. Disk "local", serta berbagai disk berbasis
    | cloud tersedia untuk aplikasi Anda untuk penyimpanan file.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Di bawah ini Anda dapat mengkonfigurasi sebanyak mungkin disk
    | filesystem yang diperlukan, dan Anda bahkan dapat mengkonfigurasi
    | beberapa disk untuk driver yang sama. Contoh untuk sebagian besar
    | driver penyimpanan yang didukung dikonfigurasi di sini untuk referensi.
    |
    | Driver yang didukung: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Di sini Anda dapat mengkonfigurasi symbolic links yang akan dibuat
    | saat perintah Artisan `storage:link` dijalankan. Array keys harus
    | lokasi links dan values harus target mereka.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];

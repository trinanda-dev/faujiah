<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Server Side Rendering
    |--------------------------------------------------------------------------
    |
    | Opsi ini mengkonfigurasi apakah dan bagaimana Inertia menggunakan
    | Server Side Rendering untuk pre-render setiap permintaan awal yang
    | dibuat ke halaman aplikasi Anda sehingga HTML yang di-render server
    | dikirimkan untuk browser user.
    |
    | Lihat: https://inertiajs.com/server-side-rendering
    |
    */

    'ssr' => [
        'enabled' => true,
        'url' => 'http://127.0.0.1:13714',
        // 'bundle' => base_path('bootstrap/ssr/ssr.mjs'),

    ],

    /*
    |--------------------------------------------------------------------------
    | Testing
    |--------------------------------------------------------------------------
    |
    | Nilai yang dijelaskan di sini digunakan untuk menemukan komponen
    | Inertia di filesystem. Misalnya, saat menggunakan `assertInertia`,
    | assertion mencoba menemukan komponen sebagai file relatif terhadap
    | paths.
    |
    */

    'testing' => [

        'ensure_pages_exist' => true,

        'page_paths' => [
            resource_path('js/pages'),
        ],

        'page_extensions' => [
            'js',
            'jsx',
            'svelte',
            'ts',
            'tsx',
            'vue',
        ],

    ],

];

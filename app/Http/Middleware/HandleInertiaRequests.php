<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

/**
 * HandleInertiaRequests
 *
 * Middleware ini menangani request untuk aplikasi Inertia.js,
 * mengatur template root, versi asset, dan data yang dibagikan
 * ke semua komponen frontend.
 *
 * Penjelasan fungsi/penanganan utama:
 * - Mengatur template root untuk halaman pertama.
 * - Menentukan versi asset untuk cache busting.
 * - Membagikan data global seperti auth, sidebar, flash messages, dan errors.
 *
 * Catatan: data yang dibagikan akan tersedia di semua komponen Inertia.
 */
class HandleInertiaRequests extends Middleware
{
    /**
     * Template root yang dimuat pada kunjungan halaman pertama.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Menentukan versi asset saat ini.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        // Gunakan implementasi versi dari parent class.
        // Ini digunakan untuk cache busting asset frontend.
        return parent::version($request);
    }

    /**
     * Tentukan props yang dibagikan secara default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Kembalikan array props yang dibagikan, termasuk dari parent.
        // Tambahkan data global: auth user, status sidebar, flash messages,
        // dan errors dari session.
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(), // Data pengguna yang sedang login
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true', // Status sidebar terbuka/tutup
            'flash' => [
                'success' => $request->session()->get('success'), // Pesan sukses
                'error' => $request->session()->get('error'), // Pesan error
                'training_success' => $request->session()->get('training_success'), // Pesan sukses training
                'arimax_mape' => $request->session()->get('arimax_mape'), // Data MAPE ARIMAX
                'training_order' => $request->session()->get('training_order'), // Urutan training
            ],
            'errors' => $request->session()->get('errors') ? $request->session()->get('errors')->getBag('default')->getMessages() : (object) [], // Pesan error validasi
        ];
    }
}

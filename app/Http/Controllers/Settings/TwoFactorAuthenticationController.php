<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

/**
 * TwoFactorAuthenticationController
 *
 * Controller ini menangani halaman pengaturan autentikasi dua faktor (2FA)
 * untuk pengguna melalui Inertia.js dan Laravel Fortify.
 *
 * Penjelasan fungsi/penanganan utama:
 * - Mengatur middleware untuk konfirmasi password jika diperlukan.
 * - Menampilkan halaman pengaturan 2FA dengan status terkini.
 *
 * Catatan keamanan: pastikan fitur 2FA dikonfigurasi dengan benar
 * untuk meningkatkan keamanan akun pengguna.
 */
class TwoFactorAuthenticationController extends Controller implements HasMiddleware
{
    /**
     * Ambil middleware yang harus ditetapkan pada controller.
     */
    public static function middleware(): array
    {
        // Periksa apakah fitur 2FA memerlukan konfirmasi password.
        // Jika ya, tambahkan middleware 'password.confirm' hanya untuk method 'show'.
        // Jika tidak, kembalikan array kosong (tidak ada middleware tambahan).
        return Features::optionEnabled(Features::twoFactorAuthentication(), 'confirmPassword')
            ? [new Middleware('password.confirm', only: ['show'])]
            : [];
    }

    /**
     * Tampilkan halaman pengaturan autentikasi dua faktor pengguna.
     */
    public function show(TwoFactorAuthenticationRequest $request): Response
    {
        // Pastikan state request valid sebelum melanjutkan.
        $request->ensureStateIsValid();

        // Render halaman pengaturan 2FA menggunakan Inertia.js.
        // Kirim data: apakah 2FA sudah diaktifkan, dan apakah memerlukan konfirmasi.
        return Inertia::render('settings/two-factor', [
            'twoFactorEnabled' => $request->user()->hasEnabledTwoFactorAuthentication(),
            'requiresConfirmation' => Features::optionEnabled(Features::twoFactorAuthentication(), 'confirm'),
        ]);
    }
}

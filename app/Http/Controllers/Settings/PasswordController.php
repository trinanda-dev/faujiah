<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * PasswordController
 *
 * Controller ini menangani halaman pengaturan password pengguna
 * dan proses update password melalui Inertia.js.
 *
 * Penjelasan fungsi/penanganan utama:
 * - Menampilkan halaman pengaturan password.
 * - Memvalidasi dan mengupdate password pengguna.
 *
 * Catatan keamanan: pastikan password telah di-hash sebelum disimpan
 * ke database (hashing dapat dilakukan di tempat lain sebelum method ini
 * dipanggil, atau ubah kode untuk memanggil `Hash::make` sebelum menyimpan).
 */
class PasswordController extends Controller
{
    /**
     * Tampilkan halaman pengaturan password pengguna.
     */
    public function edit(): Response
    {
        // Render halaman pengaturan password menggunakan Inertia.js.
        // Halaman ini akan menampilkan form untuk mengubah password.
        return Inertia::render('settings/password');
    }

    /**
     * Update password pengguna.
     */
    public function update(Request $request): RedirectResponse
    {
        // Validasi input dari request: pastikan password lama benar,
        // password baru memenuhi aturan default, dan konfirmasi cocok.
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        // Update password pengguna di database dengan data yang tervalidasi.
        // Pastikan password sudah di-hash sebelum disimpan.
        $request->user()->update([
            'password' => $validated['password'],
        ]);

        // Redirect kembali ke halaman sebelumnya setelah update berhasil.
        return back();
    }
}

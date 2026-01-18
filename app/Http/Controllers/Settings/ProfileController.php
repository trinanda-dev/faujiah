<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ProfileController
 *
 * Controller ini menangani halaman pengaturan profil pengguna
 * dan operasi terkait seperti update profil dan penghapusan akun
 * melalui Inertia.js.
 *
 * Penjelasan fungsi/penanganan utama:
 * - Menampilkan halaman pengaturan profil.
 * - Mengupdate data profil pengguna.
 * - Menghapus akun pengguna dengan validasi password.
 *
 * Catatan keamanan: pastikan data sensitif seperti email dan password
 * ditangani dengan benar, termasuk verifikasi email jika diperlukan.
 */
class ProfileController extends Controller
{
    /**
     * Tampilkan halaman pengaturan profil pengguna.
     */
    public function edit(Request $request): Response
    {
        // Render halaman pengaturan profil menggunakan Inertia.js.
        // Kirim data tambahan: apakah email perlu diverifikasi,
        // dan status dari session (misalnya setelah update).
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update pengaturan profil pengguna.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        // Isi model user dengan data yang telah tervalidasi dari request.
        $request->user()->fill($request->validated());

        // Jika email diubah, reset waktu verifikasi email untuk memaksa
        // verifikasi ulang.
        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        // Simpan perubahan ke database.
        $request->user()->save();

        // Redirect kembali ke halaman edit profil.
        return to_route('profile.edit');
    }

    /**
     * Hapus akun pengguna.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Validasi bahwa password saat ini benar sebelum menghapus akun.
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        // Ambil instance user dari request.
        $user = $request->user();

        // Logout pengguna untuk mengakhiri sesi.
        Auth::logout();

        // Hapus record user dari database.
        $user->delete();

        // Invalidate dan regenerate token session untuk keamanan.
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Redirect ke halaman utama setelah penghapusan.
        return redirect('/');
    }
}

<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Laravel\Fortify\Features;
use Laravel\Fortify\InteractsWithTwoFactorState;

/**
 * TwoFactorAuthenticationRequest
 *
 * Form Request ini digunakan untuk menangani validasi request
 * terkait autentikasi dua faktor (2FA). Biasanya digunakan dalam
 * halaman pengaturan 2FA untuk memeriksa apakah fitur 2FA diaktifkan.
 *
 * Penjelasan fungsi/penanganan utama:
 * - Mengotorisasi request berdasarkan status fitur 2FA.
 * - Tidak ada aturan validasi khusus (array kosong).
 *
 * Catatan: menggunakan trait InteractsWithTwoFactorState untuk
 * interaksi dengan state 2FA.
 */
class TwoFactorAuthenticationRequest extends FormRequest
{
    use InteractsWithTwoFactorState;

    /**
     * Tentukan apakah pengguna diotorisasi untuk membuat request ini.
     */
    public function authorize(): bool
    {
        // Periksa apakah fitur autentikasi dua faktor diaktifkan.
        // Jika ya, izinkan request; jika tidak, tolak.
        return Features::enabled(Features::twoFactorAuthentication());
    }

    /**
     * Ambil aturan validasi yang berlaku untuk request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Tidak ada aturan validasi khusus untuk request ini.
        // Validasi mungkin ditangani di tempat lain atau tidak diperlukan.
        return [];
    }
}

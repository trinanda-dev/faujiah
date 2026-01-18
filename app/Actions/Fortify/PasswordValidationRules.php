<?php

namespace App\Actions\Fortify;

use Illuminate\Validation\Rules\Password;

/**
 * Trait PasswordValidationRules
 *
 * Menyediakan aturan validasi untuk field password yang dipakai
 * saat proses pendaftaran atau perubahan password.
 *
 * Rangkuman aturan yang dikembalikan oleh `passwordRules()`:
 * - 'required' : field wajib diisi
 * - 'string'   : harus berupa string
 * - Password::min(8) : minimal 8 karakter
 * - 'confirmed': harus cocok dengan field `password_confirmation`
 *
 * Komentar ini hanya dokumentasi; tidak mengubah perilaku kode.
 */
trait PasswordValidationRules
{
    /**
     * Ambil aturan validasi yang digunakan untuk memvalidasi password.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function passwordRules(): array
    {
        return ['required', 'string', Password::min(8), 'confirmed'];
    }
}

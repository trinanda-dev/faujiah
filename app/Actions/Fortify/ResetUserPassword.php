<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\ResetsUserPasswords;

/**
 * ResetUserPassword
 *
 * Kelas ini bertugas menangani proses reset password untuk pengguna
 * yang lupa passwordnya melalui Laravel Fortify.
 *
 * Penjelasan fungsi/penanganan utama:
 * - Melakukan validasi input password baru.
 * - Mengupdate password pengguna di database.
 *
 * Catatan keamanan: pastikan password telah di-hash sebelum disimpan
 * ke database (hashing dapat dilakukan di tempat lain sebelum method ini
 * dipanggil, atau ubah kode untuk memanggil `Hash::make` sebelum menyimpan).
 */
class ResetUserPassword implements ResetsUserPasswords
{
    use PasswordValidationRules;

    /**
     * Validasi dan reset password pengguna yang lupa.
     *
     * @param  array<string, string>  $input
     */
    public function reset(User $user, array $input): void
    {
        // Jalankan validasi terhadap data input password baru menggunakan
        // aturan yang ditentukan. Aturan password diambil dari trait
        // `PasswordValidationRules` yang digunakan oleh kelas ini.
        Validator::make($input, [
            'password' => $this->passwordRules(),
        ])->validate();

        // Jika validasi berhasil, update password pengguna di database.
        // Di sini data dikirim langsung ke `forceFill` — pastikan
        // field `password` sudah di-hash jika ingin menyimpan aman.
        $user->forceFill([
            'password' => $input['password'],
        ])->save();
    }
}

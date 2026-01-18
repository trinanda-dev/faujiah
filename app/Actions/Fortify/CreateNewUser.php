<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

/**
 * CreateNewUser
 *
 * Kelas ini bertugas menangani pembuatan pengguna baru saat proses
 * pendaftaran (registration) lewat Laravel Fortify.
 *
 * Penjelasan fungsi/penanganan utama:
 * - Melakukan validasi input pendaftaran (nama, email, password).
 * - Mengembalikan instance `User` yang dibuat dari data yang tervalidasi.
 *
 * Catatan keamanan: pastikan password telah di-hash sebelum disimpan
 * ke database (hashing dapat dilakukan di tempat lain sebelum method ini
 * dipanggil, atau ubah kode untuk memanggil `Hash::make` sebelum menyimpan).
 */
class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validasi dan buat pengguna yang baru terdaftar.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        // Jalankan validasi terhadap data input pendaftaran menggunakan
        // aturan yang ditentukan. Aturan password diambil dari trait
        // `PasswordValidationRules` yang digunakan oleh kelas ini.
        // Pesan validasi kustom diberikan dalam bahasa Indonesia.
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'password' => $this->passwordRules(),
        ], [
            'name.required' => 'Field tidak boleh kosong',
            'email.required' => 'Field tidak boleh kosong',
            'email.email' => 'Format email tidak valid',
            'email.unique' => 'Email ini sudah terdaftar',
            'password.required' => 'Field tidak boleh kosong',
            'password.min' => 'Password minimal 8 karakter',
            'password.confirmed' => 'Konfirmasi password tidak cocok',
            'password_confirmation.required' => 'Field tidak boleh kosong',
        ])->validate();

        // Jika validasi berhasil, buat record `User` baru di database.
        // Di sini data dikirim langsung ke `User::create` — pastikan
        // field `password` sudah di-hash jika ingin menyimpan aman.
        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);
    }
}

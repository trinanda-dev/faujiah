<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * ProfileUpdateRequest
 *
 * Form Request ini digunakan untuk menangani validasi request
 * saat mengupdate profil pengguna. Biasanya digunakan dalam
 * halaman pengaturan profil untuk memvalidasi input nama dan email.
 *
 * Penjelasan fungsi/penanganan utama:
 * - Memvalidasi field name dan email dengan aturan tertentu.
 * - Memastikan email unik kecuali untuk pengguna yang sedang login.
 *
 * Catatan: validasi ini mencegah duplikasi email dan memastikan
 * format input benar.
 */
class ProfileUpdateRequest extends FormRequest
{
    /**
     * Ambil aturan validasi yang berlaku untuk request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Aturan validasi untuk update profil:
        // - name: required, string, max:255
        // - email: required, string, lowercase, email, max:255,
        //         unique di tabel users tapi abaikan ID pengguna saat ini
        return [
            'name' => ['required', 'string', 'max:255'],

            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
        ];
    }
}

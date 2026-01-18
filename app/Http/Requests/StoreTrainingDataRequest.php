<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

/**
 * StoreTrainingDataRequest
 *
 * Form Request ini digunakan untuk menangani validasi request
 * saat mengunggah file data training. Biasanya digunakan dalam
 * proses upload file CSV atau Excel untuk training model ML.
 *
 * Penjelasan fungsi/penanganan utama:
 * - Mengotorisasi request (selalu true dalam kasus ini).
 * - Memvalidasi file yang diunggah (format dan ukuran).
 * - Menyediakan pesan error kustom dalam bahasa Indonesia.
 *
 * Catatan: file yang diterima adalah CSV, XLSX, atau XLS dengan
 * ukuran maksimal 5MB.
 */
class StoreTrainingDataRequest extends FormRequest
{
    /**
     * Tentukan apakah pengguna diotorisasi untuk membuat request ini.
     */
    public function authorize(): bool
    {
        // Selalu kembalikan true, artinya semua pengguna diotorisasi
        // untuk membuat request ini (tidak ada batasan khusus).
        return true;
    }

    /**
     * Ambil aturan validasi yang berlaku untuk request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Aturan validasi untuk field 'file':
        // - required: file wajib diunggah
        // - File::types(['csv', 'xlsx', 'xls']): hanya menerima format CSV atau Excel
        // - max(5120): ukuran maksimal 5MB (5120 KB)
        return [
            'file' => [
                'required',
                File::types(['csv', 'xlsx', 'xls'])
                    ->max(5120), // 5MB
            ],
        ];
    }

    /**
     * Ambil pesan kustom untuk error validator.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        // Pesan error kustom dalam bahasa Indonesia untuk validasi file.
        return [
            'file.required' => 'File harus diunggah.',
            'file.mimes' => 'File harus berformat CSV atau Excel (.xlsx, .xls).',
            'file.max' => 'Ukuran file maksimal 5MB.',
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreHybridPredictionRequest
 *
 * Form Request ini digunakan untuk menangani validasi request
 * saat menyimpan prediksi hybrid. Biasanya digunakan dalam
 * proses pembuatan prediksi berdasarkan data uji.
 *
 * Penjelasan fungsi/penanganan utama:
 * - Mengotorisasi request (selalu true dalam kasus ini).
 * - Menentukan aturan validasi (kosong karena tidak diperlukan).
 * - Menyediakan pesan error kustom (kosong).
 *
 * Catatan: validasi tidak diperlukan karena prediksi dihasilkan
 * dari data uji yang sudah ada.
 */
class StoreHybridPredictionRequest extends FormRequest
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
        // Tidak ada validasi yang diperlukan - ini akan menghasilkan
        // prediksi dari data uji yang sudah ada.
        return [];
    }

    /**
     * Ambil pesan kustom untuk error validator.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        // Tidak ada pesan kustom yang didefinisikan.
        return [];
    }
}

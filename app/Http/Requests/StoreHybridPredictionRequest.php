<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreHybridPredictionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tinggi_gelombang' => ['required', 'numeric', 'min:0'],
            'kecepatan_angin' => ['required', 'numeric', 'min:0'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tinggi_gelombang.required' => 'Tinggi gelombang harus diisi.',
            'tinggi_gelombang.numeric' => 'Tinggi gelombang harus berupa angka.',
            'tinggi_gelombang.min' => 'Tinggi gelombang tidak boleh negatif.',
            'kecepatan_angin.required' => 'Kecepatan angin harus diisi.',
            'kecepatan_angin.numeric' => 'Kecepatan angin harus berupa angka.',
            'kecepatan_angin.min' => 'Kecepatan angin tidak boleh negatif.',
        ];
    }
}

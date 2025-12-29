<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/**
 * Routes Aplikasi Prediksi Tinggi Gelombang
 *
 * File ini mendefinisikan semua routes yang digunakan dalam aplikasi.
 * Semua routes di bawah middleware 'auth' memerlukan user untuk login terlebih dahulu.
 */

// Redirect root path: jika sudah login ke dashboard, jika belum ke login
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
})->name('home');

// Semua routes di bawah ini memerlukan autentikasi (user harus login)
Route::middleware(['auth'])->group(function () {
    /**
     * Route Dashboard
     * Menampilkan halaman dashboard utama aplikasi
     */
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    /**
     * Routes untuk Manajemen Data
     *
     * Routes ini menangani:
     * - Input/Upload data dari file Excel/CSV
     * - Menampilkan hasil data latih (70% dari data)
     * - Menampilkan hasil data validasi (15% dari data)
     * - Menampilkan hasil data uji (15% dari data)
     * - Menghapus semua data
     */
    Route::prefix('data')->name('data.')->group(function () {
        Route::get('input', [App\Http\Controllers\DataController::class, 'index'])->name('index'); // Halaman input data
        Route::get('results', [App\Http\Controllers\DataController::class, 'results'])->name('results'); // Halaman hasil data latih
        Route::get('validation-results', [App\Http\Controllers\DataController::class, 'validationResults'])->name('validation-results'); // Halaman hasil data validasi
        Route::get('test-results', [App\Http\Controllers\DataController::class, 'testResults'])->name('test-results'); // Halaman hasil data uji
        Route::post('upload', [App\Http\Controllers\DataController::class, 'store'])->name('store'); // Upload file Excel/CSV
        Route::delete('delete', [App\Http\Controllers\DataController::class, 'destroy'])->name('destroy'); // Hapus semua data
    });

    /**
     * Routes untuk Analisis ARIMAX
     *
     * Routes ini menangani analisis statistik untuk identifikasi model ARIMAX:
     * - Uji stasioneritas: mengecek apakah data sudah stasioner
     * - ACF/PACF: menghitung autocorrelation dan partial autocorrelation
     * - Identifikasi model: mengevaluasi berbagai kombinasi model untuk menemukan yang terbaik
     */
    Route::prefix('arimax')->name('arimax.')->group(function () {
        Route::get('stationarity-test', [App\Http\Controllers\ArimaxController::class, 'stationarityTest'])->name('stationarity-test'); // Uji stasioneritas
        Route::get('acf-pacf', [App\Http\Controllers\ArimaxController::class, 'acfPacf'])->name('acf-pacf'); // ACF/PACF analysis
        Route::get('model-identification', [App\Http\Controllers\ArimaxController::class, 'modelIdentification'])->name('model-identification'); // Identifikasi model terbaik
        Route::post('train-model', [App\Http\Controllers\ArimaxController::class, 'trainModel'])->name('train-model'); // Training model (SINGLE SOURCE OF TRUTH)
    });

    /**
     * Routes untuk Prediksi Hybrid ARIMAX-LSTM
     *
     * Routes ini menangani prediksi menggunakan model Hybrid:
     * - Prediction: menampilkan dan menghasilkan prediksi hybrid pada data uji
     * - Evaluation: menampilkan evaluasi akurasi model (MAPE, MAE, RMSE)
     * - Monthly Forecast: prediksi tinggi gelombang satu bulan (30 hari) ke depan
     *
     * Catatan: Semua operasi ML (training, prediksi) dilakukan oleh FastAPI service (Python),
     * Laravel hanya sebagai interface dan koordinator.
     */
    Route::prefix('hybrid')->name('hybrid.')->group(function () {
        Route::get('prediction', [App\Http\Controllers\HybridController::class, 'index'])->name('prediction'); // Halaman prediksi hybrid
        Route::post('prediction', [App\Http\Controllers\HybridController::class, 'store'])->name('prediction.store'); // Generate prediksi (training + prediksi)
        Route::get('evaluation', [App\Http\Controllers\HybridController::class, 'evaluation'])->name('evaluation'); // Halaman evaluasi model
        Route::get('weekly-forecast', [App\Http\Controllers\HybridController::class, 'weeklyForecast'])->name('weekly-forecast'); // Prediksi satu bulan (30 hari) ke depan
    });
});

// Include routes untuk settings (profile, password, dll)
require __DIR__.'/settings.php';

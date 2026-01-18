<?php

// File ini mendefinisikan route untuk halaman pengaturan pengguna.

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Grup route yang memerlukan autentikasi
Route::middleware('auth')->group(function () {
    // Redirect dari /settings ke /settings/profile
    Route::redirect('settings', '/settings/profile');

    // Route untuk mengedit profil pengguna
    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    // Route untuk memperbarui profil pengguna
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    // Route untuk menghapus akun pengguna
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Route untuk mengedit kata sandi
    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    // Route untuk memperbarui kata sandi dengan throttling
    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    // Route untuk halaman pengaturan tampilan
    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    // Route untuk menampilkan pengaturan autentikasi dua faktor
    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');
});

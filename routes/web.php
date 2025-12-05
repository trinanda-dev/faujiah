<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::prefix('data')->name('data.')->group(function () {
        Route::get('input', [App\Http\Controllers\DataController::class, 'index'])->name('index');
        Route::get('results', [App\Http\Controllers\DataController::class, 'results'])->name('results');
        Route::get('test-results', [App\Http\Controllers\DataController::class, 'testResults'])->name('test-results');
        Route::post('upload', [App\Http\Controllers\DataController::class, 'store'])->name('store');
        Route::delete('delete', [App\Http\Controllers\DataController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('arimax')->name('arimax.')->group(function () {
        Route::get('stationarity-test', [App\Http\Controllers\ArimaxController::class, 'stationarityTest'])->name('stationarity-test');
    });
});

require __DIR__.'/settings.php';

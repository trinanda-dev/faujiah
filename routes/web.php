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
        Route::get('acf-pacf', [App\Http\Controllers\ArimaxController::class, 'acfPacf'])->name('acf-pacf');
        Route::get('model-identification', [App\Http\Controllers\ArimaxController::class, 'modelIdentification'])->name('model-identification');
    });

    Route::prefix('hybrid')->name('hybrid.')->group(function () {
        Route::get('prediction', [App\Http\Controllers\HybridController::class, 'index'])->name('prediction');
        Route::post('prediction', [App\Http\Controllers\HybridController::class, 'store'])->name('prediction.store');
        Route::get('evaluation', [App\Http\Controllers\HybridController::class, 'evaluation'])->name('evaluation');
        Route::get('weekly-forecast', [App\Http\Controllers\HybridController::class, 'weeklyForecast'])->name('weekly-forecast');
    });

    Route::prefix('fastapi')->name('fastapi.')->group(function () {
        Route::get('/', [App\Http\Controllers\FastAPIController::class, 'index'])->name('index');
        Route::post('upload-dataset', [App\Http\Controllers\FastAPIController::class, 'uploadDataset'])->name('upload-dataset');
        Route::post('train/arimax', [App\Http\Controllers\FastAPIController::class, 'trainARIMAX'])->name('train.arimax');
        Route::post('train/hybrid', [App\Http\Controllers\FastAPIController::class, 'trainHybrid'])->name('train.hybrid');
        Route::get('evaluate', [App\Http\Controllers\FastAPIController::class, 'evaluate'])->name('evaluate');
        Route::post('predict', [App\Http\Controllers\FastAPIController::class, 'predict'])->name('predict');
    });
});

require __DIR__.'/settings.php';

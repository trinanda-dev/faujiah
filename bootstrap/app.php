<?php
/**
 * File konfigurasi aplikasi Laravel.
 *
 * File ini mengatur konfigurasi dasar aplikasi Laravel, termasuk routing, middleware, dan exception handling.
 * Menggunakan Application facade untuk setup aplikasi.
 */

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

// Mengkonfigurasi aplikasi Laravel dengan base path.
return Application::configure(basePath: dirname(__DIR__))
    // Mengatur routing untuk web, console commands, dan health check.
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    // Mengatur middleware untuk aplikasi.
    ->withMiddleware(function (Middleware $middleware): void {
        // Mengenkripsi cookie kecuali untuk 'appearance' dan 'sidebar_state'.
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Menambahkan middleware untuk web: HandleAppearance, HandleInertiaRequests, dan AddLinkHeadersForPreloadedAssets.
        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    // Mengatur exception handling.
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

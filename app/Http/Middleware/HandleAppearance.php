<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

/**
 * HandleAppearance
 *
 * Middleware ini menangani pengaturan tampilan (appearance) aplikasi
 * berdasarkan cookie yang dikirim oleh pengguna. Biasanya digunakan
 * untuk tema gelap/terang atau pengaturan tampilan lainnya.
 *
 * Penjelasan fungsi/penanganan utama:
 * - Membaca cookie 'appearance' dari request.
 * - Membagikan nilai appearance ke semua view melalui View::share.
 *
 * Catatan: nilai default adalah 'system' jika cookie tidak ada.
 */
class HandleAppearance
{
    /**
     * Tangani request masuk.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Bagikan nilai 'appearance' dari cookie request ke semua view.
        // Jika cookie tidak ada, gunakan nilai default 'system'.
        // Ini memungkinkan view mengakses pengaturan tampilan pengguna.
        View::share('appearance', $request->cookie('appearance') ?? 'system');

        // Lanjutkan ke middleware berikutnya atau controller.
        return $next($request);
    }
}

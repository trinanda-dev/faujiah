<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use Illuminate\Auth\Events\Failed;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\RegisterResponse;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

/**
 * Service Provider untuk mengkonfigurasi Laravel Fortify.
 *
 * Kelas ini bertanggung jawab untuk mendaftarkan dan mengkonfigurasi layanan autentikasi
 * menggunakan paket Laravel Fortify, termasuk view, action, rate limiting, dan redirect.
 */
class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * Method ini digunakan untuk mendaftarkan layanan aplikasi.
     * Saat ini kosong, tetapi bisa digunakan untuk binding interface atau singleton.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * Method ini dipanggil setelah semua service provider terdaftar.
     * Digunakan untuk mengkonfigurasi Fortify dengan memanggil method konfigurasi lainnya.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
        $this->configureRedirects();
    }

    /**
     * Configure Fortify actions.
     *
     * Method ini mengkonfigurasi action kustom untuk Fortify,
     * seperti reset password dan create user menggunakan class yang ditentukan.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     *
     * Method ini mengkonfigurasi view untuk halaman autentikasi menggunakan Inertia.js.
     * Setiap view merender komponen React dengan data yang diperlukan.
     */
    private function configureViews(): void
    {
        // Konfigurasi view login dengan opsi reset password dan registrasi.
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'status' => $request->session()->get('status'),
        ]));

        // Konfigurasi view reset password dengan email dan token.
        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        // Konfigurasi view forgot password.
        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        // Konfigurasi view verify email.
        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        // Konfigurasi view register.
        Fortify::registerView(fn (Request $request) => Inertia::render('auth/register'));

        // Konfigurasi view two-factor challenge.
        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        // Konfigurasi view confirm password.
        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     *
     * Method ini mengatur batasan rate untuk mencegah abuse pada proses autentikasi,
     * seperti login dan two-factor challenge.
     */
    private function configureRateLimiting(): void
    {
        // Rate limiting untuk two-factor challenge: maksimal 5 percobaan per menit berdasarkan ID login.
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        // Rate limiting untuk login: maksimal 5 percobaan per menit berdasarkan username dan IP.
        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }

    /**
     * Configure redirects after authentication actions.
     *
     * Method ini mengkonfigurasi redirect dan respons kustom setelah aksi autentikasi,
     * seperti registrasi dan login gagal.
     */
    private function configureRedirects(): void
    {
        // Override respons register untuk redirect ke login setelah registrasi.
        $this->app->singleton(RegisterResponse::class, function () {
            return new class implements RegisterResponse
            {
                public function toResponse($request)
                {
                    // Logout user yang baru terdaftar.
                    Auth::logout();

                    // Invalidate dan regenerate session.
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();

                    // Redirect ke login dengan pesan sukses.
                    return redirect()->route('login')->with('status', 'Registrasi berhasil! Silakan login dengan akun Anda.');
                }
            };
        });

        // Listen ke event login gagal dan set pesan error kustom.
        Event::listen(Failed::class, function (Failed $event) {
            if ($event->guard === 'web' && request()->routeIs('login')) {
                // Set pesan error kustom untuk login gagal.
                request()->session()->flash('errors', new \Illuminate\Support\MessageBag([
                    'email' => 'Email atau password salah.',
                ]));
            }
        });
    }
}

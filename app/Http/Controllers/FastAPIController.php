<?php

namespace App\Http\Controllers;

use App\Services\FastAPIService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller untuk Integrasi FastAPI ML Service
 *
 * Controller ini menangani komunikasi dengan FastAPI service (Python) untuk:
 * 1. Upload dataset ke FastAPI
 * 2. Training model ARIMAX
 * 3. Training model Hybrid LSTM
 * 4. Evaluasi model
 * 5. Prediksi menggunakan model yang sudah dilatih
 *
 * Semua operasi ML dilakukan di FastAPI (Python), Laravel hanya sebagai interface.
 */
class FastAPIController extends Controller
{
    protected FastAPIService $fastAPIService;

    /**
     * Constructor - Dependency Injection untuk FastAPIService
     *
     * @param  FastAPIService  $fastAPIService  Service untuk komunikasi dengan FastAPI
     */
    public function __construct(FastAPIService $fastAPIService)
    {
        $this->fastAPIService = $fastAPIService;
    }

    /**
     * Menampilkan halaman integrasi FastAPI.
     *
     * Menampilkan status kesehatan FastAPI service dan URL base.
     *
     * @param  Request  $request  Request dari user
     * @return Response Halaman Inertia dengan status FastAPI
     */
    public function index(Request $request): Response
    {
        // Cek status kesehatan FastAPI service
        $healthStatus = $this->fastAPIService->healthCheck();

        return Inertia::render('FastAPI/Index', [
            'healthStatus' => $healthStatus,
            'baseUrl' => config('services.fastapi.url', 'http://localhost:8001'), // URL FastAPI service
        ]);
    }

    /**
     * Upload dataset ke FastAPI.
     *
     * Mengupload file Excel ke FastAPI service untuk digunakan dalam training model.
     *
     * @param  Request  $request  Request yang berisi file Excel
     * @return RedirectResponse Redirect dengan pesan sukses atau error
     */
    public function uploadDataset(Request $request): RedirectResponse
    {
        // Validasi file: harus file Excel, maksimal 10MB
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:10240', // 10MB max
        ]);

        $file = $request->file('file');
        $tempPath = $file->getRealPath(); // Path file sementara

        // Upload dataset ke FastAPI
        $result = $this->fastAPIService->uploadDataset($tempPath);

        if ($result['success']) {
            return redirect()
                ->back()
                ->with('success', 'Dataset berhasil diunggah ke FastAPI service.');
        }

        return redirect()
            ->back()
            ->withErrors(['error' => $result['error'] ?? 'Gagal mengunggah dataset.']);
    }

    /**
     * Melatih model ARIMAX.
     *
     * Memanggil FastAPI untuk melatih model ARIMAX. Dapat dilakukan secara:
     * - Sync: menunggu sampai training selesai (lebih lambat tapi dapat hasil langsung)
     * - Async: training dimulai di background (lebih cepat tapi tidak dapat hasil langsung)
     *
     * @param  Request  $request  Request yang berisi parameter sync/async
     * @return RedirectResponse Redirect dengan pesan sukses atau error
     */
    public function trainARIMAX(Request $request): RedirectResponse
    {
        $sync = $request->boolean('sync', false); // Apakah training dilakukan secara synchronous

        if ($sync) {
            // Training synchronous: menunggu sampai selesai
            $result = $this->fastAPIService->trainARIMAXSync();
        } else {
            // Training asynchronous: dimulai di background
            $result = $this->fastAPIService->trainARIMAX();
        }

        if ($result['success']) {
            $message = $sync
                ? 'ARIMAX model berhasil dilatih. MAPE: '.($result['data']['arimax_mape'] ?? 'N/A')
                : 'ARIMAX training dimulai di background.';

            return redirect()
                ->back()
                ->with('success', $message);
        }

        return redirect()
            ->back()
            ->withErrors(['error' => $result['error'] ?? 'Gagal melatih ARIMAX model.']);
    }

    /**
     * Melatih model Hybrid LSTM.
     *
     * Memanggil FastAPI untuk melatih model Hybrid (ARIMAX + LSTM untuk residual).
     * Dapat dilakukan secara sync atau async.
     *
     * @param  Request  $request  Request yang berisi parameter sync/async
     * @return RedirectResponse Redirect dengan pesan sukses atau error
     */
    public function trainHybrid(Request $request): RedirectResponse
    {
        $sync = $request->boolean('sync', false); // Apakah training dilakukan secara synchronous

        if ($sync) {
            // Training synchronous: menunggu sampai selesai
            $result = $this->fastAPIService->trainHybridSync();
        } else {
            // Training asynchronous: dimulai di background
            $result = $this->fastAPIService->trainHybrid();
        }

        if ($result['success']) {
            $message = $sync
                ? 'Hybrid LSTM model berhasil dilatih. MAPE: '.($result['data']['hybrid_mape'] ?? 'N/A')
                : 'Hybrid LSTM training dimulai di background.';

            return redirect()
                ->back()
                ->with('success', $message);
        }

        return redirect()
            ->back()
            ->withErrors(['error' => $result['error'] ?? 'Gagal melatih Hybrid LSTM model.']);
    }

    /**
     * Mengevaluasi model.
     *
     * Memanggil FastAPI untuk mengevaluasi model ARIMAX dan Hybrid pada data uji.
     * Mengembalikan metrik evaluasi seperti MAPE, MAE, RMSE.
     *
     * @param  Request  $request  Request dari user
     * @return RedirectResponse Redirect dengan hasil evaluasi atau error
     */
    public function evaluate(Request $request): RedirectResponse
    {
        // Panggil FastAPI untuk evaluasi model
        $result = $this->fastAPIService->evaluate();

        if ($result['success']) {
            $data = $result['data'];
            // Format pesan dengan MAPE ARIMAX dan Hybrid
            $message = sprintf(
                'Evaluasi selesai. ARIMAX MAPE: %.2f%%, Hybrid MAPE: %.2f%%',
                $data['arimax']['mape'] ?? 0,
                $data['hybrid']['mape'] ?? 0
            );

            return redirect()
                ->back()
                ->with('success', $message)
                ->with('evaluation', $data); // Kirim data evaluasi untuk ditampilkan
        }

        return redirect()
            ->back()
            ->withErrors(['error' => $result['error'] ?? 'Gagal melakukan evaluasi.']);
    }

    /**
     * Membuat prediksi.
     *
     * Memanggil FastAPI untuk membuat prediksi menggunakan model yang sudah dilatih.
     * Dapat memprediksi beberapa langkah ke depan (n_steps).
     *
     * @param  Request  $request  Request yang berisi parameter prediksi
     * @return RedirectResponse Redirect dengan hasil prediksi atau error
     */
    public function predict(Request $request): RedirectResponse
    {
        // Validasi input
        $request->validate([
            'wind_speed' => 'nullable|array', // Kecepatan angin untuk prediksi (opsional)
            'wind_speed.*' => 'numeric',
            'n_steps' => 'required|integer|min:1|max:100', // Jumlah langkah prediksi (1-100)
        ]);

        $windSpeed = $request->input('wind_speed'); // Kecepatan angin (null = gunakan default)
        $nSteps = $request->input('n_steps', 1); // Jumlah langkah prediksi

        // Panggil FastAPI untuk prediksi
        $result = $this->fastAPIService->predict($windSpeed, $nSteps);

        if ($result['success']) {
            return redirect()
                ->back()
                ->with('success', 'Prediksi berhasil dibuat.')
                ->with('predictions', $result['data']); // Kirim hasil prediksi
        }

        return redirect()
            ->back()
            ->withErrors(['error' => $result['error'] ?? 'Gagal membuat prediksi.']);
    }
}

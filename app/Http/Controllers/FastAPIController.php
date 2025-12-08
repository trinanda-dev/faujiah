<?php

namespace App\Http\Controllers;

use App\Services\FastAPIService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller for FastAPI ML service integration.
 */
class FastAPIController extends Controller
{
    protected FastAPIService $fastAPIService;

    public function __construct(FastAPIService $fastAPIService)
    {
        $this->fastAPIService = $fastAPIService;
    }

    /**
     * Display the FastAPI integration page.
     */
    public function index(Request $request): Response
    {
        $healthStatus = $this->fastAPIService->healthCheck();

        return Inertia::render('FastAPI/Index', [
            'healthStatus' => $healthStatus,
            'baseUrl' => config('services.fastapi.url', 'http://localhost:8001'),
        ]);
    }

    /**
     * Upload dataset to FastAPI.
     */
    public function uploadDataset(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:10240', // 10MB max
        ]);

        $file = $request->file('file');
        $tempPath = $file->getRealPath();

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
     * Train ARIMAX model.
     */
    public function trainARIMAX(Request $request): RedirectResponse
    {
        $sync = $request->boolean('sync', false);

        if ($sync) {
            $result = $this->fastAPIService->trainARIMAXSync();
        } else {
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
     * Train Hybrid LSTM model.
     */
    public function trainHybrid(Request $request): RedirectResponse
    {
        $sync = $request->boolean('sync', false);

        if ($sync) {
            $result = $this->fastAPIService->trainHybridSync();
        } else {
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
     * Evaluate models.
     */
    public function evaluate(Request $request): RedirectResponse
    {
        $result = $this->fastAPIService->evaluate();

        if ($result['success']) {
            $data = $result['data'];
            $message = sprintf(
                'Evaluasi selesai. ARIMAX MAPE: %.2f%%, Hybrid MAPE: %.2f%%',
                $data['arimax']['mape'] ?? 0,
                $data['hybrid']['mape'] ?? 0
            );

            return redirect()
                ->back()
                ->with('success', $message)
                ->with('evaluation', $data);
        }

        return redirect()
            ->back()
            ->withErrors(['error' => $result['error'] ?? 'Gagal melakukan evaluasi.']);
    }

    /**
     * Make predictions.
     */
    public function predict(Request $request): RedirectResponse
    {
        $request->validate([
            'wind_speed' => 'nullable|array',
            'wind_speed.*' => 'numeric',
            'n_steps' => 'required|integer|min:1|max:100',
        ]);

        $windSpeed = $request->input('wind_speed');
        $nSteps = $request->input('n_steps', 1);

        $result = $this->fastAPIService->predict($windSpeed, $nSteps);

        if ($result['success']) {
            return redirect()
                ->back()
                ->with('success', 'Prediksi berhasil dibuat.')
                ->with('predictions', $result['data']);
        }

        return redirect()
            ->back()
            ->withErrors(['error' => $result['error'] ?? 'Gagal membuat prediksi.']);
    }
}


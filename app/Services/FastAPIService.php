<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service for communicating with Python FastAPI ML service.
 */
class FastAPIService
{
    protected string $baseUrl;

    protected int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.fastapi.url', 'http://localhost:8001');
        $this->timeout = config('services.fastapi.timeout', 300); // 5 minutes for training
    }

    /**
     * Check if FastAPI service is available.
     */
    public function healthCheck(): bool
    {
        try {
            // Try health endpoint first
            $response = Http::timeout(5)->get("{$this->baseUrl}/health");

            if ($response->successful()) {
                $data = $response->json();

                return isset($data['status']) && $data['status'] === 'healthy';
            }

            // Fallback: try root endpoint
            $rootResponse = Http::timeout(5)->get("{$this->baseUrl}/");
            if ($rootResponse->successful()) {
                $rootData = $rootResponse->json();

                return isset($rootData['message']);
            }

            return false;
        } catch (\Exception $e) {
            Log::warning('FastAPI health check failed', [
                'error' => $e->getMessage(),
                'baseUrl' => $this->baseUrl,
            ]);

            return false;
        }
    }

    /**
     * Upload dataset to FastAPI.
     *
     * @param  string  $filePath  Path to Excel file
     */
    public function uploadDataset(string $filePath): array
    {
        try {
            if (! file_exists($filePath)) {
                return [
                    'success' => false,
                    'error' => "File not found: {$filePath}",
                ];
            }

            $response = Http::timeout(60)
                ->attach('file', file_get_contents($filePath), basename($filePath))
                ->post("{$this->baseUrl}/upload-dataset");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('detail', 'Upload failed'),
                'status' => $response->status(),
            ];
        } catch (\Exception $e) {
            Log::error('FastAPI upload dataset failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Train ARIMAX model (async - returns immediately).
     */
    public function trainARIMAX(): array
    {
        try {
            $response = Http::timeout(10)
                ->post("{$this->baseUrl}/train/arimax");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('detail', 'Training failed'),
                'status' => $response->status(),
            ];
        } catch (\Exception $e) {
            Log::error('FastAPI train ARIMAX failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Train ARIMAX model synchronously (waits for completion).
     *
     * @param  int  $p  AR order (default: 1)
     * @param  int  $d  Differencing order (default: 0)
     * @param  int  $q  MA order (default: 0)
     */
    public function trainARIMAXSync(int $p = 1, int $d = 0, int $q = 0): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->post("{$this->baseUrl}/train/arimax/sync?p={$p}&d={$d}&q={$q}");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('detail', 'Training failed'),
                'status' => $response->status(),
            ];
        } catch (\Exception $e) {
            Log::error('FastAPI train ARIMAX sync failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Train Hybrid LSTM model (async - returns immediately).
     */
    public function trainHybrid(): array
    {
        try {
            $response = Http::timeout(10)
                ->post("{$this->baseUrl}/train/hybrid");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('detail', 'Training failed'),
                'status' => $response->status(),
            ];
        } catch (\Exception $e) {
            Log::error('FastAPI train hybrid failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Train Hybrid LSTM model synchronously (waits for completion).
     */
    public function trainHybridSync(): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->post("{$this->baseUrl}/train/hybrid/sync");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('detail', 'Training failed'),
                'status' => $response->status(),
            ];
        } catch (\Exception $e) {
            Log::error('FastAPI train hybrid sync failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Evaluate both ARIMAX and Hybrid models.
     */
    public function evaluate(): array
    {
        try {
            $response = Http::timeout(60)
                ->get("{$this->baseUrl}/evaluate");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('detail', 'Evaluation failed'),
                'status' => $response->status(),
            ];
        } catch (\Exception $e) {
            Log::error('FastAPI evaluate failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Make predictions using trained models.
     *
     * @param  array|null  $windSpeed  Array of wind speeds (optional)
     * @param  int  $nSteps  Number of steps to predict
     */
    public function predict(?array $windSpeed = null, int $nSteps = 1): array
    {
        try {
            $payload = [
                'n_steps' => $nSteps,
            ];

            if ($windSpeed !== null) {
                $payload['wind_speed'] = $windSpeed;
            }

            $response = Http::timeout(30)
                ->post("{$this->baseUrl}/predict", $payload);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('detail', 'Prediction failed'),
                'status' => $response->status(),
            ];
        } catch (\Exception $e) {
            Log::error('FastAPI predict failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}

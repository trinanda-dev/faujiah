<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service untuk Komunikasi dengan FastAPI ML Service (Python)
 * 
 * Service ini menangani semua komunikasi HTTP antara Laravel (PHP) dan
 * FastAPI service (Python) yang menjalankan operasi Machine Learning.
 * 
 * Fungsi utama:
 * 1. Health Check - mengecek apakah FastAPI service berjalan
 * 2. Upload Dataset - mengupload file Excel ke FastAPI
 * 3. Training Model - melatih model ARIMAX dan Hybrid LSTM
 * 4. Evaluasi Model - mengevaluasi akurasi model
 * 5. Prediksi - membuat prediksi menggunakan model yang sudah dilatih
 * 
 * Semua operasi ML dilakukan di FastAPI (Python), Laravel hanya sebagai
 * interface dan koordinator.
 */
class FastAPIService
{
    /**
     * Base URL untuk FastAPI service.
     * 
     * @var string
     */
    protected string $baseUrl;

    /**
     * Timeout untuk request HTTP (dalam detik).
     * 
     * @var int
     */
    protected int $timeout;

    /**
     * Constructor - Inisialisasi base URL dan timeout.
     * 
     * Mengambil konfigurasi dari config/services.php.
     * Default timeout 300 detik (5 menit) untuk training yang membutuhkan waktu lama.
     */
    public function __construct()
    {
        $this->baseUrl = config('services.fastapi.url', 'http://localhost:8001');
        $this->timeout = config('services.fastapi.timeout', 300); // 5 menit untuk training
    }

    /**
     * Mengecek apakah FastAPI service tersedia dan berjalan.
     * 
     * Fungsi ini melakukan health check dengan cara:
     * 1. Mencoba endpoint /health terlebih dahulu
     * 2. Jika gagal, mencoba endpoint root (/) sebagai fallback
     * 
     * Digunakan untuk memastikan FastAPI service sudah berjalan sebelum
     * melakukan operasi ML seperti training atau prediksi.
     * 
     * @return bool True jika FastAPI service tersedia, False jika tidak
     */
    public function healthCheck(): bool
    {
        try {
            // Coba endpoint health terlebih dahulu
            $response = Http::timeout(5)->get("{$this->baseUrl}/health");

            if ($response->successful()) {
                $data = $response->json();

                // Cek apakah status adalah 'healthy'
                return isset($data['status']) && $data['status'] === 'healthy';
            }

            // Fallback: coba endpoint root jika /health tidak tersedia
            $rootResponse = Http::timeout(5)->get("{$this->baseUrl}/");
            if ($rootResponse->successful()) {
                $rootData = $rootResponse->json();

                // Jika root endpoint merespons, berarti service berjalan
                return isset($rootData['message']);
            }

            return false; // Service tidak tersedia
        } catch (\Exception $e) {
            // Log warning jika health check gagal
            Log::warning('FastAPI health check failed', [
                'error' => $e->getMessage(),
                'baseUrl' => $this->baseUrl,
            ]);

            return false;
        }
    }

    /**
     * Mengupload dataset (file Excel) ke FastAPI.
     * 
     * Fungsi ini mengupload file Excel yang berisi data time series
     * (timestamp, tinggi gelombang, kecepatan angin) ke FastAPI service.
     * 
     * File Excel akan digunakan oleh FastAPI untuk:
     * - Training model ARIMAX
     * - Training model Hybrid LSTM
     * - Evaluasi model
     * 
     * @param string $filePath Path lengkap ke file Excel yang akan diupload
     * @return array Array dengan key 'success' (bool) dan 'data' atau 'error'
     */
    public function uploadDataset(string $filePath): array
    {
        try {
            // Validasi: pastikan file ada
            if (! file_exists($filePath)) {
                return [
                    'success' => false,
                    'error' => "File not found: {$filePath}",
                ];
            }

            // Upload file ke FastAPI menggunakan multipart/form-data
            // Timeout 60 detik karena upload file bisa memakan waktu
            $response = Http::timeout(60)
                ->attach('file', file_get_contents($filePath), basename($filePath))
                ->post("{$this->baseUrl}/upload-dataset");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(), // Data respons dari FastAPI
                ];
            }

            // Jika upload gagal, kembalikan error
            return [
                'success' => false,
                'error' => $response->json('detail', 'Upload failed'), // Ambil detail error dari FastAPI
                'status' => $response->status(), // HTTP status code
            ];
        } catch (\Exception $e) {
            // Log error jika terjadi exception
            Log::error('FastAPI upload dataset failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Melatih model ARIMAX secara asynchronous (tidak menunggu selesai).
     * 
     * Fungsi ini memanggil FastAPI untuk memulai training ARIMAX di background.
     * Training akan berjalan di FastAPI tanpa menunggu respons, sehingga
     * fungsi ini langsung kembali.
     * 
     * Cocok digunakan jika user tidak perlu menunggu hasil training langsung.
     * 
     * @return array Array dengan key 'success' (bool) dan 'data' atau 'error'
     */
    public function trainARIMAX(): array
    {
        try {
            // Timeout pendek (10 detik) karena hanya memulai training, tidak menunggu selesai
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
     * Melatih model ARIMAX secara synchronous (menunggu sampai selesai).
     * 
     * Fungsi ini memanggil FastAPI untuk melatih model ARIMAX dan menunggu
     * sampai training selesai. Setelah selesai, akan mengembalikan hasil
     * training termasuk metrik seperti MAPE.
     * 
     * Menggunakan timeout yang lebih lama (default 300 detik) karena training
     * membutuhkan waktu yang cukup lama.
     * 
     * Orde ARIMAX (p, d, q) dapat ditentukan secara dinamis berdasarkan
     * hasil identifikasi model di ArimaxController.
     * 
     * @param int $p Orde AR (Autoregressive) - default: 1
     * @param int $d Orde differencing - default: 0
     * @param int $q Orde MA (Moving Average) - default: 0
     * @return array Array dengan key 'success' (bool) dan 'data' (berisi hasil training) atau 'error'
     */
    public function trainARIMAXSync(int $p = 1, int $d = 0, int $q = 0): array
    {
        try {
            // Timeout panjang karena training membutuhkan waktu lama
            // Mengirim parameter p, d, q sebagai query parameter
            $response = Http::timeout($this->timeout)
                ->post("{$this->baseUrl}/train/arimax/sync?p={$p}&d={$d}&q={$q}");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(), // Berisi hasil training (MAPE, dll)
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
     * Melatih model Hybrid LSTM secara asynchronous (tidak menunggu selesai).
     * 
     * Fungsi ini memanggil FastAPI untuk memulai training Hybrid LSTM di background.
     * Model Hybrid menggabungkan ARIMAX dan LSTM untuk memprediksi residual.
     * 
     * Training akan berjalan di FastAPI tanpa menunggu respons, sehingga
     * fungsi ini langsung kembali.
     * 
     * Catatan: Model ARIMAX harus sudah dilatih terlebih dahulu sebelum
     * melatih model Hybrid, karena Hybrid menggunakan residual dari ARIMAX.
     * 
     * @return array Array dengan key 'success' (bool) dan 'data' atau 'error'
     */
    public function trainHybrid(): array
    {
        try {
            // Timeout pendek (10 detik) karena hanya memulai training, tidak menunggu selesai
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
     * Melatih model Hybrid LSTM secara synchronous (menunggu sampai selesai).
     * 
     * Fungsi ini memanggil FastAPI untuk melatih model Hybrid dan menunggu
     * sampai training selesai. Setelah selesai, akan mengembalikan hasil
     * training termasuk metrik seperti MAPE.
     * 
     * Model Hybrid bekerja dengan cara:
     * 1. ARIMAX memprediksi tinggi gelombang
     * 2. LSTM memprediksi residual (error) dari ARIMAX
     * 3. Prediksi final = Prediksi ARIMAX + Prediksi Residual LSTM
     * 
     * Menggunakan timeout yang lebih lama (default 300 detik) karena training
     * LSTM membutuhkan waktu yang cukup lama.
     * 
     * Catatan: Model ARIMAX harus sudah dilatih terlebih dahulu.
     * 
     * @return array Array dengan key 'success' (bool) dan 'data' (berisi hasil training) atau 'error'
     */
    public function trainHybridSync(): array
    {
        try {
            // Timeout panjang karena training LSTM membutuhkan waktu lama
            $response = Http::timeout($this->timeout)
                ->post("{$this->baseUrl}/train/hybrid/sync");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(), // Berisi hasil training (MAPE, dll)
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
     * Mengevaluasi kedua model (ARIMAX dan Hybrid) pada data uji.
     * 
     * Fungsi ini memanggil FastAPI untuk mengevaluasi model yang sudah dilatih
     * menggunakan data uji (20% dari dataset). Evaluasi menghasilkan:
     * - MAPE (Mean Absolute Percentage Error)
     * - MAE (Mean Absolute Error)
     * - RMSE (Root Mean Square Error)
     * - Hasil prediksi untuk setiap data uji
     * 
     * Hasil evaluasi digunakan untuk:
     * - Mengukur akurasi model
     * - Membandingkan performa ARIMAX vs Hybrid
     * - Menyimpan prediksi ke database untuk ditampilkan ke user
     * 
     * @return array Array dengan key 'success' (bool) dan 'data' (berisi hasil evaluasi) atau 'error'
     */
    public function evaluate(): array
    {
        try {
            // Timeout 60 detik karena evaluasi membutuhkan waktu untuk memproses semua data uji
            $response = Http::timeout(60)
                ->get("{$this->baseUrl}/evaluate");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(), // Berisi metrik evaluasi dan hasil prediksi
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
     * Membuat prediksi menggunakan model yang sudah dilatih.
     * 
     * Fungsi ini memanggil FastAPI untuk membuat prediksi tinggi gelombang
     * untuk beberapa langkah ke depan (n_steps).
     * 
     * Prediksi dapat dilakukan dengan atau tanpa kecepatan angin:
     * - Jika windSpeed diberikan: menggunakan kecepatan angin yang ditentukan
     * - Jika windSpeed null: menggunakan kecepatan angin default dari data terakhir
     * 
     * Digunakan untuk:
     * - Prediksi pada data uji (dalam HybridController)
     * - Prediksi seminggu ke depan (dalam weeklyForecast)
     * 
     * @param array|null $windSpeed Array kecepatan angin untuk setiap langkah prediksi (opsional)
     * @param int $nSteps Jumlah langkah prediksi ke depan (default: 1)
     * @return array Array dengan key 'success' (bool) dan 'data' (berisi prediksi) atau 'error'
     */
    public function predict(?array $windSpeed = null, int $nSteps = 1): array
    {
        try {
            // Siapkan payload untuk request
            $payload = [
                'n_steps' => $nSteps, // Jumlah langkah prediksi
            ];

            // Tambahkan kecepatan angin jika diberikan
            if ($windSpeed !== null) {
                $payload['wind_speed'] = $windSpeed;
            }

            // Timeout 30 detik karena prediksi relatif cepat (model sudah dilatih)
            $response = Http::timeout(30)
                ->post("{$this->baseUrl}/predict", $payload);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(), // Berisi prediksi ARIMAX, LSTM, dan Hybrid
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

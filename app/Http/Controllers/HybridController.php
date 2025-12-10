<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreHybridPredictionRequest;
use App\Models\HybridPrediction;
use App\Models\TestData;
use App\Models\TrainingData;
use App\Services\FastAPIService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Controller untuk Prediksi Hybrid ARIMAX-LSTM
 * 
 * Controller ini menggunakan FastAPI service untuk semua operasi ML (training dan prediksi).
 * 
 * Model Hybrid bekerja dengan cara:
 * 1. ARIMAX memprediksi tinggi gelombang berdasarkan data historis dan kecepatan angin
 * 2. LSTM memprediksi residual (error) dari ARIMAX
 * 3. Prediksi final = Prediksi ARIMAX + Prediksi Residual LSTM
 * 
 * Pendekatan ini memanfaatkan kelebihan ARIMAX untuk pola linear dan LSTM untuk pola non-linear.
 */
class HybridController extends Controller
{
    protected FastAPIService $fastAPIService;

    /**
     * Constructor - Inisialisasi FastAPIService
     */
    public function __construct()
    {
        $this->fastAPIService = new FastAPIService;
    }

    /**
     * Menghitung MAPE (Mean Absolute Percentage Error).
     * 
     * MAPE mengukur rata-rata persentase error antara nilai aktual dan prediksi.
     * Semakin kecil MAPE, semakin baik model.
     * 
     * Formula: MAPE = (1/n) * Σ |(aktual - prediksi) / aktual| * 100
     * 
     * @param array $actual Array nilai aktual
     * @param array $predicted Array nilai prediksi
     * @return float Nilai MAPE (atau 999.99 jika error)
     */
    private function calculateMAPE(array $actual, array $predicted): float
    {
        // Validasi: pastikan jumlah data aktual dan prediksi sama
        if (count($actual) !== count($predicted) || empty($actual)) {
            return 999.99; // Nilai error
        }

        $sum = 0;
        $count = 0;
        // Hitung MAPE untuk setiap data point
        for ($i = 0; $i < count($actual); $i++) {
            // Hanya hitung jika nilai aktual tidak nol (untuk menghindari pembagian nol)
            if (abs($actual[$i]) > 0.0001) {
                $sum += abs(($actual[$i] - $predicted[$i]) / $actual[$i]) * 100; // Persentase error
                $count++;
            }
        }

        // Rata-rata MAPE
        return $count > 0 ? $sum / $count : 999.99;
    }

    /**
     * Menampilkan halaman prediksi hybrid.
     * 
     * Menampilkan semua prediksi hybrid yang sudah dihasilkan, termasuk:
     * - Nilai aktual
     * - Prediksi ARIMAX
     * - Prediksi residual LSTM
     * - Prediksi hybrid (ARIMAX + LSTM)
     * - MAPE untuk setiap prediksi
     * 
     * @param Request $request Request dari user
     * @return Response Halaman Inertia dengan data prediksi
     */
    public function index(Request $request): Response
    {
        // Ambil semua prediksi dari database, diurutkan dari yang terlama
        $predictions = HybridPrediction::query()
            ->orderBy('tanggal', 'asc')
            ->get();

        // Format data untuk ditampilkan di tabel
        $predictionData = $predictions->map(function ($prediction, $index) {
            // Format tanggal menjadi YYYY-MM-DD HH:MM:SS
            $tanggal = $prediction->tanggal instanceof \Carbon\Carbon
                ? $prediction->tanggal->format('Y-m-d H:i:s')
                : (is_string($prediction->tanggal) ? $prediction->tanggal : date('Y-m-d H:i:s', strtotime($prediction->tanggal)));

            return [
                'nomor' => $index + 1,
                'tanggal' => $tanggal,
                'tinggi_gelombang_aktual' => (float) $prediction->tinggi_gelombang_aktual,
                'tinggi_gelombang_arimax' => (float) $prediction->tinggi_gelombang_arimax,
                'residual_lstm' => (float) $prediction->residual_lstm,
                'tinggi_gelombang_hybrid' => (float) $prediction->tinggi_gelombang_hybrid,
                'mape' => $prediction->mape !== null ? (float) $prediction->mape : null,
            ];
        })->values();

        $totalData = $predictions->count();
        $overallMetrics = null;
        
        // Hitung metrik keseluruhan (MAPE) jika ada data
        if ($totalData > 0) {
            $actual = $predictions->pluck('tinggi_gelombang_aktual')->map(fn ($v) => (float) $v)->toArray();
            $hybrid = $predictions->pluck('tinggi_gelombang_hybrid')->map(fn ($v) => (float) $v)->toArray();

            $overallMetrics = [
                'mape' => round($this->calculateMAPE($actual, $hybrid), 2), // MAPE keseluruhan
            ];
        }

        return Inertia::render('Hybrid/Prediction', [
            'predictions' => $predictionData,
            'totalData' => $totalData,
            'overallMetrics' => $overallMetrics,
        ]);
    }

    /**
     * Mengekspor data dari database ke file Excel untuk FastAPI.
     * 
     * Fungsi ini menggabungkan data latih dan data uji, kemudian mengekspornya ke Excel.
     * File Excel ini akan diupload ke FastAPI untuk digunakan dalam training model.
     * 
     * Format Excel:
     * - Kolom A: timestamp (tanggal dan waktu)
     * - Kolom B: wave_height (tinggi gelombang)
     * - Kolom C: wind_speed (kecepatan angin)
     * 
     * @return string Path file Excel sementara yang sudah dibuat
     */
    private function exportDataToExcel(): string
    {
        // Ambil semua data (latih + uji) diurutkan berdasarkan tanggal
        // Data harus diurutkan karena time series memerlukan urutan waktu yang benar
        $allData = TrainingData::query()
            ->orderBy('tanggal', 'asc')
            ->get(['tanggal', 'tinggi_gelombang', 'kecepatan_angin'])
            ->concat(
                TestData::query()
                    ->orderBy('tanggal', 'asc')
                    ->get(['tanggal', 'tinggi_gelombang', 'kecepatan_angin'])
            )
            ->sortBy('tanggal')
            ->values();

        // Buat file Excel baru
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        // Set header (baris pertama)
        $sheet->setCellValue('A1', 'timestamp');
        $sheet->setCellValue('B1', 'wave_height');
        $sheet->setCellValue('C1', 'wind_speed');

        // Isi data mulai dari baris 2
        $row = 2;
        foreach ($allData as $item) {
            // Format tanggal menjadi YYYY-MM-DD HH:MM:SS
            $tanggal = $item->tanggal instanceof \Carbon\Carbon
                ? $item->tanggal->format('Y-m-d H:i:s')
                : (is_string($item->tanggal) ? $item->tanggal : date('Y-m-d H:i:s', strtotime($item->tanggal)));

            $sheet->setCellValue("A{$row}", $tanggal);
            $sheet->setCellValue("B{$row}", $item->tinggi_gelombang);
            $sheet->setCellValue("C{$row}", $item->kecepatan_angin);
            $row++;
        }

        // Simpan ke file sementara
        $tempPath = storage_path('app/temp/dataset_'.time().'.xlsx');
        $directory = dirname($tempPath);
        // Buat folder jika belum ada
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        // Simpan file Excel
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempPath);

        return $tempPath; // Kembalikan path file untuk digunakan saat upload
    }

    /**
     * Generate Hybrid ARIMAX-LSTM predictions on test data using FastAPI.
     * Pipeline: Export Data → Upload to FastAPI → Train ARIMAX → Train Hybrid → Evaluate → Save Results
     */
    public function store(StoreHybridPredictionRequest $request): RedirectResponse
    {
        // Note: Health check is optional - we'll try the actual operations directly
        // If FastAPI is not available, the operations will fail with proper error messages

        // Get test data for dates
        $testData = TestData::query()
            ->orderBy('tanggal', 'asc')
            ->get(['tanggal', 'tinggi_gelombang', 'kecepatan_angin']);

        if ($testData->isEmpty()) {
            return redirect()
                ->back()
                ->withErrors(['error' => 'Data uji tidak tersedia. Pastikan data sudah diunggah dan dibagi.']);
        }

        $testDates = $testData->pluck('tanggal')->toArray();

        DB::beginTransaction();

        try {
            // Clear existing predictions
            HybridPrediction::query()->delete();

            Log::info('Step 1: Exporting data from database to Excel');

            // Step 1: Export data to Excel
            $excelPath = $this->exportDataToExcel();

            Log::info('Step 2: Uploading dataset to FastAPI');

            // Step 2: Upload to FastAPI
            $uploadResult = $this->fastAPIService->uploadDataset($excelPath);
            if (! $uploadResult['success']) {
                throw new \Exception('Upload dataset gagal: '.($uploadResult['error'] ?? 'Unknown error'));
            }

            // Clean up temp file
            @unlink($excelPath);

            Log::info('Step 3: Training ARIMAX model');

            // Step 3: Train ARIMAX (sync)
            // Get best order from model identification if available
            $arimaxController = new \App\Http\Controllers\ArimaxController;
            $bestOrder = $arimaxController->getBestOrder();

            $p = $bestOrder['p'] ?? 1;
            $d = $bestOrder['d'] ?? 0;
            $q = $bestOrder['q'] ?? 0;

            if ($bestOrder) {
                Log::info('Using best ARIMAX order from model identification', [
                    'order' => "($p, $d, $q)",
                ]);
            } else {
                Log::info('Using default ARIMAX order', ['order' => "($p, $d, $q)"]);
            }

            $arimaxResult = $this->fastAPIService->trainARIMAXSync($p, $d, $q);
            if (! $arimaxResult['success']) {
                throw new \Exception('ARIMAX training gagal: '.($arimaxResult['error'] ?? 'Unknown error'));
            }

            Log::info('ARIMAX Training Results', $arimaxResult['data']);

            Log::info('Step 4: Training Hybrid LSTM model');

            // Step 4: Train Hybrid (sync)
            $hybridResult = $this->fastAPIService->trainHybridSync();
            if (! $hybridResult['success']) {
                throw new \Exception('Hybrid training gagal: '.($hybridResult['error'] ?? 'Unknown error'));
            }

            Log::info('Hybrid Training Results', $hybridResult['data']);

            Log::info('Step 5: Evaluating models and getting predictions');

            // Step 5: Evaluate (this will return detailed results)
            $evaluateResult = $this->fastAPIService->evaluate();
            if (! $evaluateResult['success']) {
                throw new \Exception('Evaluation gagal: '.($evaluateResult['error'] ?? 'Unknown error'));
            }

            $evaluationData = $evaluateResult['data'];
            $results = $evaluationData['results'] ?? [];

            if (empty($results)) {
                throw new \Exception('Tidak ada hasil evaluasi yang dikembalikan dari FastAPI.');
            }

            Log::info('Evaluation Results', [
                'arimax_mape' => $evaluationData['arimax']['mape'] ?? 'N/A',
                'hybrid_mape' => $evaluationData['hybrid']['mape'] ?? 'N/A',
                'total_results' => count($results),
            ]);

            // Step 6: Save results to database
            // Use actual data from TestData to ensure consistency
            $predictionsToSave = [];
            for ($i = 0; $i < min(count($results), count($testData)); $i++) {
                $result = $results[$i];
                $testItem = $testData[$i];

                // Use actual value from TestData, not from FastAPI result
                $actual = (float) $testItem->tinggi_gelombang;
                $arimaxPred = (float) $result['arimax_pred'];
                $residualLstm = (float) $result['residual_pred'];
                $hybrid = (float) $result['hybrid_pred'];

                $mape = abs($actual) > 0.0001 ? abs(($actual - $hybrid) / $actual) * 100 : null;

                // Use tanggal from TestData to preserve full datetime
                $tanggal = $testItem->tanggal instanceof \Carbon\Carbon
                    ? $testItem->tanggal
                    : \Carbon\Carbon::parse($testItem->tanggal);

                $predictionsToSave[] = [
                    'tanggal' => $tanggal,
                    'tinggi_gelombang_aktual' => round($actual, 4),
                    'tinggi_gelombang_arimax' => round($arimaxPred, 4),
                    'residual_lstm' => round($residualLstm, 4),
                    'tinggi_gelombang_hybrid' => round($hybrid, 4),
                    'mape' => $mape !== null ? round($mape, 4) : null,
                    'mae' => null,
                    'rmse' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Bulk insert predictions
            HybridPrediction::insert($predictionsToSave);

            DB::commit();

            Log::info('Hybrid Prediction Completed using FastAPI', [
                'total_predictions' => count($predictionsToSave),
                'arimax_mape' => $evaluationData['arimax']['mape'] ?? 'N/A',
                'hybrid_mape' => $evaluationData['hybrid']['mape'] ?? 'N/A',
            ]);

            return redirect()
                ->back()
                ->with('success', 'Prediksi Hybrid ARIMAX-LSTM berhasil dihasilkan menggunakan FastAPI untuk '.count($predictionsToSave).' data uji. MAPE Hybrid: '.round($evaluationData['hybrid']['mape'] ?? 0, 2).'%');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Hybrid Prediction Error (FastAPI)', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()
                ->back()
                ->withErrors(['error' => 'Terjadi kesalahan saat menghasilkan prediksi: '.$e->getMessage()]);
        }
    }

    /**
     * Display the hybrid evaluation page.
     */
    public function evaluation(Request $request): Response
    {
        // Get all predictions for MAPE calculation
        $allPredictions = HybridPrediction::query()
            ->orderBy('tanggal', 'asc')
            ->get();

        // Limit to 30 for chart/table display (for performance)
        $predictionsForDisplay = $allPredictions->take(30);

        $chartData = $predictionsForDisplay->map(function ($prediction, $index) {
            $tanggal = $prediction->tanggal instanceof \Carbon\Carbon
                ? $prediction->tanggal->format('Y-m-d H:i:s')
                : (is_string($prediction->tanggal) ? $prediction->tanggal : date('Y-m-d H:i:s', strtotime($prediction->tanggal)));

            return [
                'tanggal' => $tanggal,
                'hari_ke' => $index + 1,
                'data_aktual' => (float) $prediction->tinggi_gelombang_aktual,
                'prediksi_arimax' => (float) $prediction->tinggi_gelombang_arimax,
                'prediksi_hybrid' => (float) $prediction->tinggi_gelombang_hybrid,
            ];
        })->values();

        $tableData = $predictionsForDisplay->map(function ($prediction, $index) {
            $tanggal = $prediction->tanggal instanceof \Carbon\Carbon
                ? $prediction->tanggal->format('Y-m-d H:i:s')
                : (is_string($prediction->tanggal) ? $prediction->tanggal : date('Y-m-d H:i:s', strtotime($prediction->tanggal)));

            return [
                'nomor' => $index + 1,
                'tanggal' => $tanggal,
                'data_aktual' => (float) $prediction->tinggi_gelombang_aktual,
                'prediksi_arimax' => (float) $prediction->tinggi_gelombang_arimax,
                'prediksi_hybrid' => (float) $prediction->tinggi_gelombang_hybrid,
            ];
        })->values();

        // Calculate MAPE using ALL data (not just 30 for display)
        $total = $allPredictions->count();
        $mapeArimax = 0;
        $mapeHybrid = 0;

        if ($total > 0) {
            // Calculate MAPE for ARIMAX using all data
            $mapeArimax = $allPredictions->sum(function ($p) {
                $aktual = (float) $p->tinggi_gelombang_aktual;
                $arimax = (float) $p->tinggi_gelombang_arimax;
                if (abs($aktual) > 0.0001) {
                    return abs(($aktual - $arimax) / $aktual) * 100;
                }

                return 0;
            }) / $total;

            // Calculate MAPE for Hybrid using all data
            $mapeHybrid = $allPredictions->sum(function ($p) {
                $aktual = (float) $p->tinggi_gelombang_aktual;
                $hybrid = (float) $p->tinggi_gelombang_hybrid;
                if (abs($aktual) > 0.0001) {
                    return abs(($aktual - $hybrid) / $aktual) * 100;
                }

                return 0;
            }) / $total;
        }

        $metrics = [
            'mape_arimax' => round($mapeArimax, 2),
            'mape_hybrid' => round($mapeHybrid, 2),
            'total_data' => $total,
        ];

        return Inertia::render('Hybrid/Evaluation', [
            'chartData' => $chartData,
            'tableData' => $tableData,
            'metrics' => $metrics,
        ]);
    }

    /**
     * Display weekly forecast (7 days ahead) page.
     * Predicts wave height for the next 7 days from today.
     */
    public function weeklyForecast(Request $request): Response
    {
        // Get current date/time in GMT+7 (Asia/Jakarta)
        $now = now()->setTimezone('Asia/Jakarta');
        $currentDate = $now->format('Y-m-d');
        $currentTime = $now->format('H:i:s');
        $currentDay = $now->locale('id')->dayName; // Indonesian day name
        $currentDateTime = $now->format('Y-m-d H:i:s');

        // Get last wind speed from training data (for prediction)
        $lastTrainingData = TrainingData::query()
            ->orderBy('tanggal', 'desc')
            ->first(['kecepatan_angin']);

        $lastWindSpeed = $lastTrainingData ? (float) $lastTrainingData->kecepatan_angin : 4.0; // Default if no data

        // Generate dates for next 7 days
        $forecastDates = [];
        for ($i = 1; $i <= 7; $i++) {
            $date = $now->copy()->addDays($i);
            $forecastDates[] = [
                'date' => $date->format('Y-m-d'),
                'day' => $date->locale('id')->dayName,
                'datetime' => $date->format('Y-m-d H:i:s'),
            ];
        }

        // Check if models are trained (by checking if we can make prediction)
        $hasModels = false;
        $predictions = [];
        $error = null;

        try {
            // Try to get prediction from FastAPI
            $predictionResult = $this->fastAPIService->predict(null, 7); // 7 days, use default wind speed

            if ($predictionResult['success']) {
                $hasModels = true;
                $data = $predictionResult['data'];
                $hybridPredictions = $data['predictions'] ?? [];
                $arimaxPredictions = $data['arimax_predictions'] ?? [];
                $residualPredictions = $data['residual_predictions'] ?? [];

                // Combine with dates
                foreach ($forecastDates as $index => $dateInfo) {
                    $predictions[] = [
                        'tanggal' => $dateInfo['datetime'],
                        'hari' => $dateInfo['day'],
                        'tanggal_format' => $dateInfo['date'],
                        'prediksi_hybrid' => isset($hybridPredictions[$index]) ? round((float) $hybridPredictions[$index], 4) : null,
                        'prediksi_arimax' => isset($arimaxPredictions[$index]) ? round((float) $arimaxPredictions[$index], 4) : null,
                        'residual_lstm' => isset($residualPredictions[$index]) ? round((float) $residualPredictions[$index], 4) : null,
                    ];
                }
            } else {
                $error = $predictionResult['error'] ?? 'Model belum dilatih. Silakan lakukan training terlebih dahulu.';
            }
        } catch (\Exception $e) {
            Log::error('Weekly forecast error', ['error' => $e->getMessage()]);
            $error = 'Terjadi kesalahan saat mengambil prediksi: '.$e->getMessage();
        }

        return Inertia::render('Hybrid/WeeklyForecast', [
            'currentDate' => $currentDate,
            'currentTime' => $currentTime,
            'currentDay' => $currentDay,
            'currentDateTime' => $currentDateTime,
            'timezone' => 'GMT+7 (WIB)',
            'forecastDates' => $forecastDates,
            'predictions' => $predictions,
            'hasModels' => $hasModels,
            'error' => $error,
            'lastWindSpeed' => $lastWindSpeed,
        ]);
    }
}

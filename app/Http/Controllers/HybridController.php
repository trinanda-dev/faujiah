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
     * @param  array  $actual  Array nilai aktual
     * @param  array  $predicted  Array nilai prediksi
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
     * @param  Request  $request  Request dari user
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
        // Ambil semua data (latih + validasi + uji) diurutkan berdasarkan tanggal
        // Data harus diurutkan karena time series memerlukan urutan waktu yang benar
        $allData = TrainingData::query()
            ->orderBy('tanggal', 'asc')
            ->get(['tanggal', 'tinggi_gelombang', 'kecepatan_angin'])
            ->concat(
                \App\Models\ValidationData::query()
                    ->orderBy('tanggal', 'asc')
                    ->get(['tanggal', 'tinggi_gelombang', 'kecepatan_angin'])
            )
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

            Log::info('Step 3: Training ARIMAX and Hybrid models');

            // Step 3: Train ARIMAX and Hybrid using single endpoint (SINGLE SOURCE OF TRUTH)
            // Get best order from model identification if available
            $arimaxController = new \App\Http\Controllers\ArimaxController;
            $bestOrder = $arimaxController->getBestOrder();

            $order = null;
            if ($bestOrder) {
                $order = $bestOrder;
                // Safely format order string
                $orderString = 'N/A';
                if ($order !== null && is_array($order) && isset($order['p'], $order['d'], $order['q'])) {
                    $orderString = "({$order['p']}, {$order['d']}, {$order['q']})";
                }
                Log::info('Using best ARIMAX order from model identification', [
                    'order' => $orderString,
                ]);
            } else {
                Log::info('Using default ARIMAX order from FastAPI');
            }

            // Train both ARIMAX and Hybrid in one call
            $hybridResult = $this->fastAPIService->trainHybridSync($order);
            if (! $hybridResult['success']) {
                throw new \Exception('Training gagal: '.($hybridResult['error'] ?? 'Unknown error'));
            }

            // Log seed search results jika ada
            if (isset($hybridResult['data']['seed_search_logs']) && !empty($hybridResult['data']['seed_search_logs'])) {
                // Safely format order string
                $orderString = 'N/A';
                if ($order !== null && is_array($order) && isset($order['p'], $order['d'], $order['q'])) {
                    $orderString = "({$order['p']}, {$order['d']}, {$order['q']})";
                }
                
                Log::info('Seed Search Results', [
                    'order' => $orderString,
                    'logs' => $hybridResult['data']['seed_search_logs'],
                ]);
                
                // Log setiap entry seed search secara terpisah untuk kemudahan membaca
                foreach ($hybridResult['data']['seed_search_logs'] as $logEntry) {
                    Log::info('Seed Search', ['message' => $logEntry]);
                }
            }

            Log::info('Training Results', $hybridResult['data']);

            Log::info('Step 5: Evaluating models and getting predictions');

            // Step 5: Evaluate (this will return detailed results)
            $evaluateResult = $this->fastAPIService->evaluate();
            if (! $evaluateResult['success']) {
                throw new \Exception('Evaluation gagal: '.($evaluateResult['error'] ?? 'Unknown error'));
            }

            // Safely access evaluation data
            $evaluationData = $evaluateResult['data'] ?? [];
            if (!is_array($evaluationData)) {
                throw new \Exception('Format data evaluasi tidak valid dari FastAPI.');
            }
            
            $results = $evaluationData['results'] ?? [];
            if (!is_array($results)) {
                throw new \Exception('Format results evaluasi tidak valid dari FastAPI.');
            }

            if (empty($results)) {
                throw new \Exception('Tidak ada hasil evaluasi yang dikembalikan dari FastAPI.');
            }

            // Safely access nested arrays
            $arimaxMape = isset($evaluationData['arimax']) && is_array($evaluationData['arimax']) 
                ? ($evaluationData['arimax']['mape'] ?? 'N/A')
                : 'N/A';
            $hybridMape = isset($evaluationData['hybrid']) && is_array($evaluationData['hybrid'])
                ? ($evaluationData['hybrid']['mape'] ?? 'N/A')
                : 'N/A';

            Log::info('Evaluation Results', [
                'arimax_mape' => $arimaxMape,
                'hybrid_mape' => $hybridMape,
                'total_results' => count($results),
            ]);

            // Step 6: Save results to database
            // Use actual data from FastAPI results to ensure consistency with evaluation
            // FastAPI returns results in the same order as test dataset
            $predictionsToSave = [];
            $testDataArray = $testData->values()->all(); // Convert to array for easier indexing
            
            // Use the minimum of results count and testData count to avoid mismatch
            // This handles cases where Python test dataset has different count than database
            $resultsCount = count($results);
            $testDataCount = count($testData);
            $minCount = min($resultsCount, $testDataCount);
            
            // Log warning if counts don't match
            if ($resultsCount != $testDataCount) {
                Log::warning('Mismatch between FastAPI results and database test data', [
                    'fastapi_results_count' => $resultsCount,
                    'database_test_data_count' => $testDataCount,
                    'using_count' => $minCount,
                ]);
            }
            
            // Save only matching records to ensure consistency
            for ($i = 0; $i < $minCount; $i++) {
                $result = $results[$i] ?? null;
                $testItem = isset($testDataArray[$i]) ? $testDataArray[$i] : null;

                // Skip if result is null
                if ($result === null || !is_array($result)) {
                    Log::warning("Skipping invalid result at index {$i}");
                    continue;
                }

                // Use actual value from FastAPI result (matches evaluation calculation)
                // Fallback to TestData if result doesn't have actual value
                $actual = isset($result['actual']) ? (float) $result['actual'] : 
                         ($testItem ? (float) $testItem->tinggi_gelombang : 0);
                $arimaxPred = isset($result['arimax_pred']) ? (float) $result['arimax_pred'] : 0;
                $residualLstm = isset($result['residual_pred']) ? (float) $result['residual_pred'] : 0;
                $hybrid = isset($result['hybrid_pred']) ? (float) $result['hybrid_pred'] : 0;

                $mape = abs($actual) > 0.0001 ? abs(($actual - $hybrid) / $actual) * 100 : null;

                // Use timestamp from FastAPI result, fallback to TestData
                if (isset($result['timestamp'])) {
                    $tanggal = \Carbon\Carbon::parse($result['timestamp']);
                } elseif ($testItem) {
                    $tanggal = $testItem->tanggal instanceof \Carbon\Carbon
                        ? $testItem->tanggal
                        : \Carbon\Carbon::parse($testItem->tanggal);
                } else {
                    // Fallback: use current time if no timestamp available
                    $tanggal = now();
                }

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
                'arimax_mape' => $arimaxMape,
                'hybrid_mape' => $hybridMape,
            ]);

            // Safely get hybrid MAPE for success message
            $hybridMapeValue = isset($evaluationData['hybrid']) && is_array($evaluationData['hybrid'])
                ? ($evaluationData['hybrid']['mape'] ?? 0)
                : 0;

            return redirect()
                ->back()
                ->with('success', 'Prediksi Hybrid ARIMAX-LSTM berhasil dihasilkan menggunakan FastAPI untuk '.count($predictionsToSave).' data uji. MAPE Hybrid: '.round($hybridMapeValue, 2).'%');
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
            // Calculate MAPE for ARIMAX on TEST SET - only count valid values (aktual != 0)
            // This matches Python's calculation: divide by count of valid values, not total
            // IMPORTANT: MAPE is calculated on TEST SET (evaluation data) for fair comparison
            $arimaxSum = 0;
            $arimaxValidCount = 0;
            foreach ($allPredictions as $p) {
                $aktual = (float) $p->tinggi_gelombang_aktual;
                $arimax = (float) $p->tinggi_gelombang_arimax;
                // Only count if actual value is not zero (matches Python: mask = y_true != 0)
                if (abs($aktual) > 0.0001) {
                    $arimaxSum += abs(($aktual - $arimax) / $aktual) * 100;
                    $arimaxValidCount++;
                }
            }
            $mapeArimax = $arimaxValidCount > 0 ? $arimaxSum / $arimaxValidCount : 0;

            // Calculate MAPE for Hybrid on TEST SET - only count valid values (aktual != 0)
            // IMPORTANT: MAPE is calculated on TEST SET (evaluation data) for fair comparison
            $hybridSum = 0;
            $hybridValidCount = 0;
            foreach ($allPredictions as $p) {
                $aktual = (float) $p->tinggi_gelombang_aktual;
                $hybrid = (float) $p->tinggi_gelombang_hybrid;
                // Only count if actual value is not zero (matches Python: mask = y_true != 0)
                if (abs($aktual) > 0.0001) {
                    $hybridSum += abs(($aktual - $hybrid) / $aktual) * 100;
                    $hybridValidCount++;
                }
            }
            $mapeHybrid = $hybridValidCount > 0 ? $hybridSum / $hybridValidCount : 0;
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
     * Display monthly forecast (30 days ahead) page.
     * 
     * PREDIKSI OTOMATIS: Fixed periode 1-31 Januari 2025 (30 hari, 60 prediksi)
     * - Selalu menggunakan tanggal 1-31 Januari 2025
     * - Menggunakan kecepatan angin terakhir dari data training
     * - Tidak bisa diubah oleh user
     * 
     * PREDIKSI MANUAL: Flexible periode sesuai input user (lihat method manualForecast)
     * - User bisa memilih tanggal mulai dan akhir
     * - User bisa input kecepatan angin
     * - Maksimal 60 hari (120 prediksi)
     */
    public function weeklyForecast(Request $request): Response
    {
        // Get current date/time in GMT+7 (Asia/Jakarta) for display purposes only
        $now = now()->setTimezone('Asia/Jakarta');
        $currentDate = $now->format('Y-m-d');
        $currentTime = $now->format('H:i:s');
        $currentDay = $now->locale('id')->dayName; // Indonesian day name
        $currentDateTime = $now->format('Y-m-d H:i:s');

        // Get last date from all data (training + validation + test) to determine prediction start date
        $lastTrainingDate = TrainingData::query()
            ->orderBy('tanggal', 'desc')
            ->first(['tanggal']);
        
        $lastValidationDate = \App\Models\ValidationData::query()
            ->orderBy('tanggal', 'desc')
            ->first(['tanggal']);
        
        $lastTestDate = TestData::query()
            ->orderBy('tanggal', 'desc')
            ->first(['tanggal']);

        // Find the latest date among all datasets
        $lastDataDate = null;
        $dates = [];
        if ($lastTrainingDate) {
            $dates[] = $lastTrainingDate->tanggal instanceof \Carbon\Carbon 
                ? $lastTrainingDate->tanggal 
                : \Carbon\Carbon::parse($lastTrainingDate->tanggal);
        }
        if ($lastValidationDate) {
            $dates[] = $lastValidationDate->tanggal instanceof \Carbon\Carbon 
                ? $lastValidationDate->tanggal 
                : \Carbon\Carbon::parse($lastValidationDate->tanggal);
        }
        if ($lastTestDate) {
            $dates[] = $lastTestDate->tanggal instanceof \Carbon\Carbon 
                ? $lastTestDate->tanggal 
                : \Carbon\Carbon::parse($lastTestDate->tanggal);
        }

        if (!empty($dates)) {
            $lastDataDate = collect($dates)->max();
        }

        // If no data found, use current date as fallback
        if (!$lastDataDate) {
            $lastDataDate = $now->copy();
        }

        // Get last wind speed from training data (for prediction)
        $lastTrainingData = TrainingData::query()
            ->orderBy('tanggal', 'desc')
            ->first(['kecepatan_angin']);

        $lastWindSpeed = $lastTrainingData ? (float) $lastTrainingData->kecepatan_angin : 4.0; // Default if no data

        // Generate dates for DYNAMIC period: 30 days ahead from last data date
        // Prediksi otomatis dimulai dari tanggal setelah data terakhir + 1 hari
        // Default: 30 hari ke depan (60 prediksi: 30 hari × 2 per hari)
        $forecastDates = [];
        
        // Determine start date: next day after last data date
        // If last data is at 00:00, start prediction at 00:00 next day
        // If last data is at 12:00, start prediction at 00:00 next day
        // Round to nearest 12-hour interval (00:00 or 12:00)
        $startForecastDate = $lastDataDate->copy();
        
        // Get the hour of last data
        $lastDataHour = (int) $startForecastDate->format('H');
        
        // If last data is before 12:00, start from 00:00 next day
        // If last data is at or after 12:00, start from 00:00 next day (or 12:00 if we want to continue)
        // For simplicity, always start from 00:00 next day
        $startForecastDate->addDay()->setTime(0, 0, 0);
        
        // Default: 30 days ahead (60 predictions: 30 days × 2 per day)
        $forecastDays = 30;
        $nPredictions = $forecastDays * 2; // 2 predictions per day (00:00 and 12:00)

        // Generate forecast dates
        $currentForecastTime = $startForecastDate->copy();
        
        // Simpan objek Carbon langsung untuk menghindari konversi timezone yang tidak diinginkan
        $forecastDates = [];
        for ($i = 0; $i < $nPredictions; $i++) {
            $forecastDates[] = [
                'date' => $currentForecastTime->format('Y-m-d'),
                'day' => $currentForecastTime->locale('id')->dayName,
                'datetime' => $currentForecastTime->format('Y-m-d H:i:s'),
                'datetime_obj' => $currentForecastTime->copy(), // Simpan objek Carbon untuk format yang benar
                'time' => $currentForecastTime->format('H:i'),
            ];
            // Add 12 hours for next prediction (00:00 -> 12:00 -> 00:00 next day)
            $currentForecastTime->addHours(12);
        }

        // Check if models are trained (by checking if we can make prediction)
        $hasModels = false;
        $predictions = [];
        $error = null;

        try {
            // Try to get prediction from FastAPI
            // nPredictions predictions for forecastDays days (2 per day: 00:00 dan 12:00)
            $predictionResult = $this->fastAPIService->predict(null, $nPredictions);

            if ($predictionResult['success']) {
                $hasModels = true;
                $data = $predictionResult['data'];
                $hybridPredictions = $data['predictions'] ?? [];
                $arimaxPredictions = $data['arimax_predictions'] ?? [];
                $residualPredictions = $data['residual_predictions'] ?? [];

                // Combine with dates
                foreach ($forecastDates as $index => $dateInfo) {
                    // Format tanggal untuk ditampilkan: "DD/MM/YYYY HH:mm"
                    // Gunakan objek Carbon yang sudah ada (sudah dalam timezone Asia/Jakarta) untuk menghindari konversi timezone
                    $dateObj = isset($dateInfo['datetime_obj']) 
                        ? $dateInfo['datetime_obj'] 
                        : \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $dateInfo['datetime'], 'Asia/Jakarta');
                    $tanggalFormat = $dateObj->format('d/m/Y H:i');

                    $predictions[] = [
                        'tanggal' => $dateInfo['datetime'],
                        'hari' => $dateInfo['day'],
                        'tanggal_format' => $tanggalFormat, // Format: "DD/MM/YYYY HH:mm" - sudah dalam timezone Asia/Jakarta
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
            'lastDataDate' => $lastDataDate ? $lastDataDate->format('Y-m-d H:i:s') : null,
        ]);
    }

    /**
     * Handle manual forecast prediction with custom dates and wind speed.
     * 
     * User can specify:
     * - Start date
     * - End date
     * - Wind speed (constant for all predictions)
     */
    public function manualForecast(Request $request): RedirectResponse|Response
    {
        // Ensure this is a POST request
        if (! $request->isMethod('post')) {
            Log::warning('Manual forecast accessed with non-POST method', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
            ]);
            
            return redirect()
                ->route('hybrid.weekly-forecast')
                ->withErrors(['error' => 'Invalid request method.']);
        }
        
        try {
            // Validate based on mode
            $windSpeedMode = $request->input('wind_speed_mode', 'constant');
            
            try {
                if ($windSpeedMode === 'constant') {
                    $request->validate([
                        'start_date' => 'required|date',
                        'end_date' => 'required|date|after:start_date',
                        'wind_speed_mode' => 'required|in:constant,time-varying',
                        'wind_speed' => 'required|numeric|min:0',
                    ]);
                } else {
                    $request->validate([
                        'start_date' => 'required|date',
                        'end_date' => 'required|date|after:start_date',
                        'wind_speed_mode' => 'required|in:constant,time-varying',
                        'wind_speed_array' => 'required|array|min:1',
                        'wind_speed_array.*' => 'required|numeric|min:0',
                    ], [
                        'wind_speed_array.required' => 'Array kecepatan angin harus diisi',
                        'wind_speed_array.array' => 'Kecepatan angin harus berupa array',
                        'wind_speed_array.min' => 'Array kecepatan angin tidak boleh kosong',
                        'wind_speed_array.*.required' => 'Setiap nilai kecepatan angin harus diisi',
                        'wind_speed_array.*.numeric' => 'Setiap nilai kecepatan angin harus berupa angka',
                        'wind_speed_array.*.min' => 'Setiap nilai kecepatan angin harus >= 0',
                    ]);
                }
            } catch (\Illuminate\Validation\ValidationException $e) {
                // Redirect ke route GET dengan error messages
                return redirect()
                    ->route('hybrid.weekly-forecast')
                    ->withErrors($e->errors())
                    ->withInput();
            }

            $startDate = \Carbon\Carbon::parse($request->start_date)->setTimezone('Asia/Jakarta');
            $endDate = \Carbon\Carbon::parse($request->end_date)->setTimezone('Asia/Jakarta');

            // Calculate number of days
            $diffDays = $startDate->diffInDays($endDate) + 1; // +1 to include both start and end dates

            // Generate dates per 12 hours
            // Mulai dari 00:00 tanggal mulai, lalu 12:00 tanggal mulai, dst
            $forecastDates = [];
            // Set waktu mulai ke 00:00 (bukan 02:00 atau waktu lain)
            $currentForecastTime = $startDate->copy()->setTime(0, 0, 0)->setTimezone('Asia/Jakarta');
            $endDateWithTime = $endDate->copy()->setTime(23, 59, 59)->setTimezone('Asia/Jakarta');
            
            // Generate timestamps per 12 jam sampai endDate
            while ($currentForecastTime <= $endDateWithTime) {
                $forecastDates[] = [
                    'date' => $currentForecastTime->format('Y-m-d'),
                    'day' => $currentForecastTime->locale('id')->dayName,
                    'datetime' => $currentForecastTime->format('Y-m-d H:i:s'),
                    'time' => $currentForecastTime->format('H:i'),
                ];
                // Add 12 hours for next prediction (00:00 -> 12:00 -> 00:00 next day)
                $currentForecastTime->addHours(12);
            }
            
            // nSteps adalah jumlah forecastDates yang di-generate
            $nSteps = count($forecastDates);

            // Prepare wind speed array based on mode
            if ($windSpeedMode === 'constant') {
                // Mode Konstan: replicate nilai angin menjadi array sepanjang horizon prediksi
                $windSpeed = (float) $request->wind_speed;
                $windSpeedArray = array_fill(0, $nSteps, $windSpeed);
            } else {
                // Mode Time-varying: gunakan array input langsung sebagai variabel eksogen
                $windSpeedArray = $request->wind_speed_array;
                
                // Handle case where array might be null or not set
                if (! is_array($windSpeedArray)) {
                    Log::error('Wind speed array is not an array', [
                        'wind_speed_array' => $windSpeedArray,
                        'wind_speed_array_type' => gettype($windSpeedArray),
                        'request_all' => $request->all(),
                    ]);
                    
                    return redirect()
                        ->route('hybrid.weekly-forecast')
                        ->withErrors(['error' => 'Array kecepatan angin tidak valid. Silakan refresh halaman dan coba lagi.']);
                }
                
                // Debug: Log untuk troubleshooting
                Log::info('Time-varying mode - Received data', [
                    'wind_speed_array_count' => count($windSpeedArray),
                    'wind_speed_array_sample' => array_slice($windSpeedArray, 0, 5),
                    'nSteps' => $nSteps,
                    'diffDays' => $diffDays,
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'forecast_dates_count' => count($forecastDates),
                ]);
                
                // Validate array length matches nSteps
                $windSpeedArrayCount = count($windSpeedArray);
                
                if ($windSpeedArrayCount !== $nSteps) {
                    Log::warning('Wind speed array length mismatch', [
                        'wind_speed_array_count' => $windSpeedArrayCount,
                        'nSteps' => $nSteps,
                        'diffDays' => $diffDays,
                        'start_date' => $startDate->format('Y-m-d'),
                        'end_date' => $endDate->format('Y-m-d'),
                        'forecast_dates_count' => count($forecastDates),
                        'wind_speed_array_sample' => array_slice($windSpeedArray, 0, 5),
                    ]);
                    
                    return redirect()
                        ->route('hybrid.weekly-forecast')
                        ->withErrors(['error' => "Jumlah input kecepatan angin ($windSpeedArrayCount) harus sesuai dengan jumlah time step ($nSteps) untuk periode yang dipilih ($diffDays hari). Silakan refresh halaman dan coba lagi."]);
                }
                
                // Convert to float array
                $windSpeedArray = array_map('floatval', $windSpeedArray);
            }

            // Get predictions from FastAPI
            $hasModels = false;
            $predictions = [];
            $error = null;

            try {
                $predictionResult = $this->fastAPIService->predict($windSpeedArray, $nSteps);

                if ($predictionResult['success']) {
                    $hasModels = true;
                    $data = $predictionResult['data'];
                    $hybridPredictions = $data['predictions'] ?? [];
                    $arimaxPredictions = $data['arimax_predictions'] ?? [];
                    $residualPredictions = $data['residual_predictions'] ?? [];

                    // Combine with dates
                    foreach ($forecastDates as $index => $dateInfo) {
                        // Format tanggal untuk ditampilkan: "DD/MM/YYYY HH:mm"
                        // Gunakan objek Carbon yang sudah ada (sudah dalam timezone Asia/Jakarta) untuk menghindari konversi timezone
                        $dateObj = isset($dateInfo['datetime_obj']) 
                            ? $dateInfo['datetime_obj'] 
                            : \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $dateInfo['datetime'], 'Asia/Jakarta');
                        $tanggalFormat = $dateObj->format('d/m/Y H:i');

                        $predictions[] = [
                            'tanggal' => $dateInfo['datetime'],
                            'hari' => $dateInfo['day'],
                            'tanggal_format' => $tanggalFormat, // Format: "DD/MM/YYYY HH:mm" - sudah dalam timezone Asia/Jakarta
                            'prediksi_hybrid' => isset($hybridPredictions[$index]) ? round((float) $hybridPredictions[$index], 4) : null,
                            'prediksi_arimax' => isset($arimaxPredictions[$index]) ? round((float) $arimaxPredictions[$index], 4) : null,
                            'residual_lstm' => isset($residualPredictions[$index]) ? round((float) $residualPredictions[$index], 4) : null,
                        ];
                    }
                } else {
                    $error = $predictionResult['error'] ?? 'Model belum dilatih. Silakan lakukan training terlebih dahulu.';
                }
            } catch (\Exception $e) {
                Log::error('Manual forecast error', ['error' => $e->getMessage()]);
                $error = 'Terjadi kesalahan saat mengambil prediksi: '.$e->getMessage();
            }

            // Get last data date for display
            $lastTrainingDate = TrainingData::query()
                ->orderBy('tanggal', 'desc')
                ->first(['tanggal']);
            
            $lastValidationDate = \App\Models\ValidationData::query()
                ->orderBy('tanggal', 'desc')
                ->first(['tanggal']);
            
            $lastTestDate = TestData::query()
                ->orderBy('tanggal', 'desc')
                ->first(['tanggal']);

            $lastDataDate = null;
            $dates = [];
            if ($lastTrainingDate) {
                $dates[] = $lastTrainingDate->tanggal instanceof \Carbon\Carbon 
                    ? $lastTrainingDate->tanggal 
                    : \Carbon\Carbon::parse($lastTrainingDate->tanggal);
            }
            if ($lastValidationDate) {
                $dates[] = $lastValidationDate->tanggal instanceof \Carbon\Carbon 
                    ? $lastValidationDate->tanggal 
                    : \Carbon\Carbon::parse($lastValidationDate->tanggal);
            }
            if ($lastTestDate) {
                $dates[] = $lastTestDate->tanggal instanceof \Carbon\Carbon 
                    ? $lastTestDate->tanggal 
                    : \Carbon\Carbon::parse($lastTestDate->tanggal);
            }

            if (!empty($dates)) {
                $lastDataDate = collect($dates)->max();
            }

            // Get last wind speed for default value
            $lastTrainingData = TrainingData::query()
                ->orderBy('tanggal', 'desc')
                ->first(['kecepatan_angin']);
            $lastWindSpeed = $lastTrainingData ? (float) $lastTrainingData->kecepatan_angin : 4.0;

            return Inertia::render('Hybrid/WeeklyForecast', [
                'currentDate' => now()->setTimezone('Asia/Jakarta')->format('Y-m-d'),
                'currentTime' => now()->setTimezone('Asia/Jakarta')->format('H:i:s'),
                'currentDay' => now()->setTimezone('Asia/Jakarta')->locale('id')->dayName,
                'currentDateTime' => now()->setTimezone('Asia/Jakarta')->format('Y-m-d H:i:s'),
                'timezone' => 'GMT+7 (WIB)',
                'forecastDates' => $forecastDates,
                'predictions' => $predictions,
                'hasModels' => $hasModels,
                'error' => $error,
                'lastWindSpeed' => $lastWindSpeed,
                'lastDataDate' => $lastDataDate ? $lastDataDate->format('Y-m-d H:i:s') : null,
            ]);
        } catch (\Exception $e) {
            // Catch any other unexpected errors and redirect to GET route
            Log::error('Manual forecast unexpected error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return redirect()
                ->route('hybrid.weekly-forecast')
                ->withErrors(['error' => 'Terjadi kesalahan: '.$e->getMessage()]);
        }
    }
}

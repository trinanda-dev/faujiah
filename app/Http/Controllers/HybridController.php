<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreHybridPredictionRequest;
use App\Models\HybridPrediction;
use App\Models\TestData;
use App\Models\TrainingData;
use App\Services\ARIMAXService;
use App\Services\FastAPIService;
use App\Services\PseudoLSTMService;
use App\Services\ScalerService;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Hybrid ARIMAX-LSTM Controller
 * Implements: ARIMAX → Residual → LSTM → Hybrid Prediction
 * All components use mathematically valid training methods.
 */
class HybridController extends Controller
{
    protected ARIMAXService $arimaxService;

    protected PseudoLSTMService $lstmService;

    protected ScalerService $scalerService;

    protected FastAPIService $fastAPIService;

    /**
     * Debug mode flag.
     */
    protected bool $debugMode = false;

    public function __construct()
    {
        $this->arimaxService = new ARIMAXService;
        // Initialize with window=24, hidden=8, dropout=0.25
        $this->lstmService = new PseudoLSTMService(inputSize: 24, hiddenSize: 8, dropoutRate: 0.25);
        $this->scalerService = new ScalerService;
        $this->fastAPIService = new FastAPIService;

        // Disable debug mode in production to avoid performance issues
        // Debug mode generates too many logs and slows down training significantly
        $this->debugMode = false;
        // Only enable debug mode if explicitly needed for debugging
        // if (config('app.debug', false) && env('ENABLE_HYBRID_DEBUG', false)) {
        //     $this->debugMode = true;
        //     $this->arimaxService->setDebugMode(true);
        //     $this->lstmService->setDebugMode(true);
        // }
    }

    /**
     * Calculate MAPE (Mean Absolute Percentage Error).
     */
    private function calculateMAPE(array $actual, array $predicted): float
    {
        if (count($actual) !== count($predicted) || empty($actual)) {
            return 999.99;
        }

        $sum = 0;
        $count = 0;
        for ($i = 0; $i < count($actual); $i++) {
            if (abs($actual[$i]) > 0.0001) {
                $sum += abs(($actual[$i] - $predicted[$i]) / $actual[$i]) * 100;
                $count++;
            }
        }

        return $count > 0 ? $sum / $count : 999.99;
    }

    /**
     * Calculate MAE (Mean Absolute Error).
     */
    private function calculateMAE(array $actual, array $predicted): float
    {
        if (count($actual) !== count($predicted) || empty($actual)) {
            return 999.99;
        }

        $sum = 0;
        for ($i = 0; $i < count($actual); $i++) {
            $sum += abs($actual[$i] - $predicted[$i]);
        }

        return $sum / count($actual);
    }

    /**
     * Calculate RMSE (Root Mean Squared Error).
     */
    private function calculateRMSE(array $actual, array $predicted): float
    {
        if (count($actual) !== count($predicted) || empty($actual)) {
            return 999.99;
        }

        $sum = 0;
        for ($i = 0; $i < count($actual); $i++) {
            $sum += pow($actual[$i] - $predicted[$i], 2);
        }

        return sqrt($sum / count($actual));
    }

    /**
     * Display the hybrid prediction page.
     */
    public function index(Request $request): Response
    {
        $predictions = HybridPrediction::query()
            ->orderBy('tanggal', 'asc')
            ->get();

        $predictionData = $predictions->map(function ($prediction, $index) {
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
                'mae' => $prediction->mae !== null ? (float) $prediction->mae : null,
                'rmse' => $prediction->rmse !== null ? (float) $prediction->rmse : null,
            ];
        })->values();

        $totalData = $predictions->count();
        $overallMetrics = null;
        if ($totalData > 0) {
            $actual = $predictions->pluck('tinggi_gelombang_aktual')->map(fn ($v) => (float) $v)->toArray();
            $hybrid = $predictions->pluck('tinggi_gelombang_hybrid')->map(fn ($v) => (float) $v)->toArray();

            $overallMetrics = [
                'mape' => round($this->calculateMAPE($actual, $hybrid), 2),
                'mae' => round($this->calculateMAE($actual, $hybrid), 4),
                'rmse' => round($this->calculateRMSE($actual, $hybrid), 4),
            ];
        }

        return Inertia::render('Hybrid/Prediction', [
            'predictions' => $predictionData,
            'totalData' => $totalData,
            'overallMetrics' => $overallMetrics,
        ]);
    }

    /**
     * Export data from database to Excel file for FastAPI.
     */
    private function exportDataToExcel(): string
    {
        // Get all data (training + test) sorted by date
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

        // Create Excel file
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        // Set headers
        $sheet->setCellValue('A1', 'timestamp');
        $sheet->setCellValue('B1', 'wave_height');
        $sheet->setCellValue('C1', 'wind_speed');

        // Fill data
        $row = 2;
        foreach ($allData as $item) {
            $tanggal = $item->tanggal instanceof \Carbon\Carbon
                ? $item->tanggal->format('Y-m-d H:i:s')
                : (is_string($item->tanggal) ? $item->tanggal : date('Y-m-d H:i:s', strtotime($item->tanggal)));

            $sheet->setCellValue("A{$row}", $tanggal);
            $sheet->setCellValue("B{$row}", $item->tinggi_gelombang);
            $sheet->setCellValue("C{$row}", $item->kecepatan_angin);
            $row++;
        }

        // Save to temporary file
        $tempPath = storage_path('app/temp/dataset_'.time().'.xlsx');
        $directory = dirname($tempPath);
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $writer = new Xlsx($spreadsheet);
        $writer->save($tempPath);

        return $tempPath;
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
            $arimaxResult = $this->fastAPIService->trainARIMAXSync();
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
            $predictionsToSave = [];
            for ($i = 0; $i < min(count($results), count($testDates)); $i++) {
                $result = $results[$i];
                $actual = (float) $result['actual'];
                $arimaxPred = (float) $result['arimax_pred'];
                $residualLstm = (float) $result['residual_pred'];
                $hybrid = (float) $result['hybrid_pred'];

                $mape = abs($actual) > 0.0001 ? abs(($actual - $hybrid) / $actual) * 100 : null;
                $mae = abs($actual - $hybrid);
                $rmse = sqrt(pow($actual - $hybrid, 2));

                $tanggal = $testDates[$i] instanceof \Carbon\Carbon
                    ? $testDates[$i]
                    : \Carbon\Carbon::parse($testDates[$i]);

                $predictionsToSave[] = [
                    'tanggal' => $tanggal,
                    'tinggi_gelombang_aktual' => round($actual, 4),
                    'tinggi_gelombang_arimax' => round($arimaxPred, 4),
                    'residual_lstm' => round($residualLstm, 4),
                    'tinggi_gelombang_hybrid' => round($hybrid, 4),
                    'mape' => $mape !== null ? round($mape, 4) : null,
                    'mae' => round($mae, 4),
                    'rmse' => round($rmse, 4),
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
}

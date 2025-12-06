<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreHybridPredictionRequest;
use App\Models\HybridPrediction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HybridController extends Controller
{
    /**
     * Display the hybrid prediction page.
     */
    public function index(Request $request): Response
    {
        $predictions = HybridPrediction::query()
            ->orderBy('timestamp_prediksi', 'desc')
            ->limit(50)
            ->get();

        return Inertia::render('Hybrid/Prediction', [
            'predictions' => $predictions,
        ]);
    }

    /**
     * Store a new hybrid prediction.
     */
    public function store(StoreHybridPredictionRequest $request): RedirectResponse
    {
        $tinggiGelombang = (float) $request->input('tinggi_gelombang');
        $kecepatanAngin = (float) $request->input('kecepatan_angin');

        // Simulate ARIMAX prediction (in real implementation, this would call the actual model)
        $prediksiArimax = $tinggiGelombang * 0.85 + $kecepatanAngin * 0.12 + 0.05;

        // Simulate LSTM residual prediction (in real implementation, this would call the actual model)
        $prediksiLstmResidual = ($tinggiGelombang - $prediksiArimax) * 0.3;

        // Hybrid prediction = ARIMAX + LSTM residual
        $prediksiHybrid = $prediksiArimax + $prediksiLstmResidual;

        // Calculate MAPE
        $mapeHybrid = abs(($tinggiGelombang - $prediksiHybrid) / $tinggiGelombang) * 100;

        HybridPrediction::create([
            'tinggi_gelombang' => $tinggiGelombang,
            'kecepatan_angin' => $kecepatanAngin,
            'prediksi_arimax' => $prediksiArimax,
            'prediksi_lstm_residual' => $prediksiLstmResidual,
            'prediksi_hybrid' => $prediksiHybrid,
            'mape_hybrid' => $mapeHybrid,
            'timestamp_prediksi' => now(),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Prediksi berhasil dibuat.');
    }

    /**
     * Display the hybrid evaluation page.
     */
    public function evaluation(Request $request): Response
    {
        // Get predictions for evaluation (latest 30 for chart)
        $predictions = HybridPrediction::query()
            ->orderBy('timestamp_prediksi', 'asc')
            ->limit(30)
            ->get();

        // Format data for chart
        $chartData = $predictions->map(function ($prediction, $index) {
            $tanggal = $prediction->timestamp_prediksi instanceof \Carbon\Carbon
                ? $prediction->timestamp_prediksi->format('Y-m-d')
                : (is_string($prediction->timestamp_prediksi) ? $prediction->timestamp_prediksi : date('Y-m-d', strtotime($prediction->timestamp_prediksi)));

            return [
                'tanggal' => $tanggal,
                'hari_ke' => $index + 1,
                'data_aktual' => (float) $prediction->tinggi_gelombang,
                'prediksi_arimax' => (float) $prediction->prediksi_arimax,
                'prediksi_lstm_residual' => (float) $prediction->prediksi_lstm_residual,
                'prediksi_hybrid' => (float) $prediction->prediksi_hybrid,
            ];
        })->values();

        // Format data for table
        $tableData = $predictions->map(function ($prediction, $index) {
            $tanggal = $prediction->timestamp_prediksi instanceof \Carbon\Carbon
                ? $prediction->timestamp_prediksi->format('Y-m-d')
                : (is_string($prediction->timestamp_prediksi) ? $prediction->timestamp_prediksi : date('Y-m-d', strtotime($prediction->timestamp_prediksi)));

            return [
                'nomor' => $index + 1,
                'tanggal' => $tanggal,
                'data_aktual' => (float) $prediction->tinggi_gelombang,
                'prediksi_arimax' => (float) $prediction->prediksi_arimax,
                'prediksi_lstm_residual' => (float) $prediction->prediksi_lstm_residual,
                'prediksi_hybrid' => (float) $prediction->prediksi_hybrid,
            ];
        })->values();

        // Calculate metrics
        $total = $predictions->count();
        if ($total > 0) {
            $mae = $predictions->sum(function ($p) {
                return abs((float) $p->tinggi_gelombang - (float) $p->prediksi_hybrid);
            }) / $total;

            $rmse = sqrt(
                $predictions->sum(function ($p) {
                    return pow((float) $p->tinggi_gelombang - (float) $p->prediksi_hybrid, 2);
                }) / $total
            );

            $mape = $predictions->sum(function ($p) {
                $aktual = (float) $p->tinggi_gelombang;
                if ($aktual == 0) {
                    return 0;
                }

                return abs(($aktual - (float) $p->prediksi_hybrid) / $aktual) * 100;
            }) / $total;
        } else {
            $mae = 0;
            $rmse = 0;
            $mape = 0;
        }

        $metrics = [
            'mape' => round($mape, 2),
            'mae' => round($mae, 4),
            'rmse' => round($rmse, 4),
            'total_data' => $total,
        ];

        return Inertia::render('Hybrid/Evaluation', [
            'chartData' => $chartData,
            'tableData' => $tableData,
            'metrics' => $metrics,
        ]);
    }
}

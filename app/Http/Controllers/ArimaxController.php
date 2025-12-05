<?php

namespace App\Http\Controllers;

use App\Models\TrainingData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArimaxController extends Controller
{
    /**
     * Display the stationarity test graph page.
     */
    public function stationarityTest(Request $request): Response
    {
        // Get training data for time series graph
        $trainingData = TrainingData::query()
            ->whereNotNull('tinggi_gelombang_normalized')
            ->orderBy('tanggal', 'asc')
            ->get(['tanggal', 'tinggi_gelombang', 'tinggi_gelombang_normalized']);

        // Format data for chart
        $timeSeriesData = $trainingData->map(function ($item) {
            $tanggal = $item->tanggal instanceof \Carbon\Carbon
                ? $item->tanggal->format('Y-m-d')
                : (is_string($item->tanggal) ? $item->tanggal : date('Y-m-d', strtotime($item->tanggal)));

            return [
                'tanggal' => $tanggal,
                'tinggi_gelombang' => (float) $item->tinggi_gelombang,
                'tinggi_gelombang_normalized' => $item->tinggi_gelombang_normalized
                    ? (float) $item->tinggi_gelombang_normalized
                    : null,
            ];
        })->values();

        // Calculate differencing data (first difference)
        $differencingData = [];
        for ($i = 1; $i < count($timeSeriesData); $i++) {
            $prev = $timeSeriesData[$i - 1];
            $curr = $timeSeriesData[$i];
            $differencingData[] = [
                'tanggal' => $curr['tanggal'],
                'differencing' => $curr['tinggi_gelombang'] - $prev['tinggi_gelombang'],
            ];
        }

        return Inertia::render('Arimax/StationarityTest', [
            'timeSeriesData' => $timeSeriesData,
            'differencingData' => $differencingData,
            'totalData' => $trainingData->count(),
        ]);
    }
}

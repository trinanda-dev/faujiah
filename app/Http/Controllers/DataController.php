<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTrainingDataRequest;
use App\Models\TestData;
use App\Models\TrainingData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DataController extends Controller
{
    /**
     * Display the input data page.
     */
    public function index(Request $request): Response
    {
        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);

        $trainingData = TrainingData::query()
            ->orderBy('tanggal', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return Inertia::render('Data/InputData', [
            'trainingData' => $trainingData,
            'totalData' => TrainingData::count(),
        ]);
    }

    /**
     * Store uploaded CSV data.
     */
    public function store(StoreTrainingDataRequest $request): RedirectResponse
    {
        $file = $request->file('file');
        $path = $file->getRealPath();
        $data = array_map('str_getcsv', file($path));
        $header = array_shift($data);

        // Validate header
        $expectedHeaders = ['tanggal', 'tinggi_gelombang', 'kecepatan_angin'];
        $headerLower = array_map('strtolower', array_map('trim', $header));

        if (count(array_intersect($expectedHeaders, $headerLower)) !== count($expectedHeaders)) {
            return redirect()
                ->back()
                ->withErrors(['file' => 'Format header CSV tidak valid. Header harus: tanggal, tinggi_gelombang, kecepatan_angin']);
        }

        // Map header to indices
        $tanggalIndex = array_search('tanggal', $headerLower);
        $tinggiGelombangIndex = array_search('tinggi_gelombang', $headerLower);
        $kecepatanAnginIndex = array_search('kecepatan_angin', $headerLower);

        DB::beginTransaction();

        try {
            $inserted = 0;
            $errors = [];

            foreach ($data as $rowIndex => $row) {
                if (count($row) < 3) {
                    continue;
                }

                $tanggal = trim($row[$tanggalIndex] ?? '');
                $tinggiGelombang = trim($row[$tinggiGelombangIndex] ?? '');
                $kecepatanAngin = trim($row[$kecepatanAnginIndex] ?? '');

                // Skip empty rows
                if (empty($tanggal) || empty($tinggiGelombang) || empty($kecepatanAngin)) {
                    continue;
                }

                // Validate and insert
                try {
                    TrainingData::create([
                        'tanggal' => $tanggal,
                        'tinggi_gelombang' => (float) $tinggiGelombang,
                        'kecepatan_angin' => (float) $kecepatanAngin,
                    ]);
                    $inserted++;
                } catch (\Exception $e) {
                    $errors[] = 'Baris '.($rowIndex + 2).': '.$e->getMessage();
                }
            }

            DB::commit();

            if ($inserted === 0) {
                return redirect()
                    ->back()
                    ->withErrors(['file' => 'Tidak ada data valid yang dapat diimpor. Pastikan data tidak kosong.']);
            }

            return redirect()
                ->back()
                ->with('success', "Berhasil mengimpor {$inserted} data.".(count($errors) > 0 ? ' Beberapa baris memiliki error: '.implode(', ', array_slice($errors, 0, 5)) : ''));
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()
                ->back()
                ->withErrors(['file' => 'Terjadi kesalahan saat mengimpor data: '.$e->getMessage()]);
        }
    }

    /**
     * Delete all training data.
     */
    public function destroy(): RedirectResponse
    {
        TrainingData::truncate();

        return redirect()
            ->back()
            ->with('success', 'Semua data berhasil dihapus.');
    }

    /**
     * Display the training data results page.
     */
    public function results(Request $request): Response
    {
        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);

        $trainingData = TrainingData::query()
            ->whereNotNull('tinggi_gelombang_normalized')
            ->whereNotNull('kecepatan_angin_normalized')
            ->orderBy('tanggal', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);

        return Inertia::render('Data/TrainingDataResult', [
            'trainingData' => $trainingData,
            'totalData' => TrainingData::whereNotNull('tinggi_gelombang_normalized')
                ->whereNotNull('kecepatan_angin_normalized')
                ->count(),
        ]);
    }

    /**
     * Display the test data results page.
     */
    public function testResults(Request $request): Response
    {
        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);

        $testData = TestData::query()
            ->orderBy('tanggal', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);

        return Inertia::render('Data/TestDataResult', [
            'testData' => $testData,
            'totalData' => TestData::count(),
        ]);
    }
}

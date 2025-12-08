<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTrainingDataRequest;
use App\Models\HybridPrediction;
use App\Models\TestData;
use App\Models\TrainingData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;

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
            'totalData' => TrainingData::count() + TestData::count(),
        ]);
    }

    /**
     * Store uploaded CSV or Excel data.
     */
    public function store(StoreTrainingDataRequest $request): RedirectResponse
    {
        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());

        // Read data based on file type
        if ($extension === 'csv') {
            $data = $this->readCsvFile($file);
        } else {
            $data = $this->readExcelFile($file);
        }

        if (empty($data)) {
            return redirect()
                ->back()
                ->withErrors(['file' => 'File tidak dapat dibaca atau kosong.']);
        }

        $header = array_shift($data);

        // Normalize header names (case-insensitive, trim, handle various formats)
        $headerLower = array_map(function ($h) {
            return strtolower(trim($h));
        }, $header);

        // Define possible header name variations
        $tanggalVariations = ['tanggal', 'timestamp', 'date', 'waktu'];
        $tinggiGelombangVariations = ['tinggi_gelombang', 'wave_height', 'tinggi gelombang', 'wave height'];
        $kecepatanAnginVariations = ['kecepatan_angin', 'wind_speed', 'kecepatan angin', 'wind speed'];

        // Find header indices with flexible matching
        $tanggalIndex = null;
        $tinggiGelombangIndex = null;
        $kecepatanAnginIndex = null;

        foreach ($headerLower as $index => $headerName) {
            if (in_array($headerName, $tanggalVariations) && $tanggalIndex === null) {
                $tanggalIndex = $index;
            }
            if (in_array($headerName, $tinggiGelombangVariations) && $tinggiGelombangIndex === null) {
                $tinggiGelombangIndex = $index;
            }
            if (in_array($headerName, $kecepatanAnginVariations) && $kecepatanAnginIndex === null) {
                $kecepatanAnginIndex = $index;
            }
        }

        // Validate that all required headers are found
        if ($tanggalIndex === null || $tinggiGelombangIndex === null || $kecepatanAnginIndex === null) {
            $missing = [];
            if ($tanggalIndex === null) {
                $missing[] = 'tanggal/timestamp/date';
            }
            if ($tinggiGelombangIndex === null) {
                $missing[] = 'tinggi_gelombang/wave_height';
            }
            if ($kecepatanAnginIndex === null) {
                $missing[] = 'kecepatan_angin/wind_speed';
            }

            return redirect()
                ->back()
                ->withErrors(['file' => 'Format header tidak valid. Header yang diperlukan: '.implode(', ', $missing).'. Header yang ditemukan: '.implode(', ', $header)]);
        }

        DB::beginTransaction();

        try {
            $validData = [];
            $errors = [];

            // Collect and validate all data first
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

                // Normalize date format (handle various formats)
                $tanggal = $this->normalizeDate($tanggal);

                // Normalize number format (handle comma as decimal separator)
                $tinggiGelombang = $this->normalizeNumber($tinggiGelombang);
                $kecepatanAngin = $this->normalizeNumber($kecepatanAngin);

                // Validate data
                try {
                    $validData[] = [
                        'tanggal' => $tanggal,
                        'tinggi_gelombang' => (float) $tinggiGelombang,
                        'kecepatan_angin' => (float) $kecepatanAngin,
                    ];
                } catch (\Exception $e) {
                    $errors[] = 'Baris '.($rowIndex + 2).': '.$e->getMessage();
                }
            }

            if (empty($validData)) {
                DB::rollBack();

                return redirect()
                    ->back()
                    ->withErrors(['file' => 'Tidak ada data valid yang dapat diimpor. Pastikan data tidak kosong.']);
            }

            // Clear existing data and predictions AFTER validation succeeds
            // Use delete() instead of truncate() to work within transaction
            TrainingData::query()->delete();
            TestData::query()->delete();
            HybridPrediction::query()->delete();

            // Sort data by date (important for time series)
            usort($validData, function ($a, $b) {
                return strtotime($a['tanggal']) - strtotime($b['tanggal']);
            });

            // Split dataset: 90% training, 10% test
            $totalData = count($validData);
            $trainingCount = (int) round($totalData * 0.9);
            $testCount = $totalData - $trainingCount;

            // Split data
            $trainingData = array_slice($validData, 0, $trainingCount);
            $testData = array_slice($validData, $trainingCount);

            // Insert training data (90%)
            $trainingInserted = 0;
            foreach ($trainingData as $item) {
                try {
                    TrainingData::create($item);
                    $trainingInserted++;
                } catch (\Exception $e) {
                    $errors[] = 'Error inserting training data: '.$e->getMessage();
                }
            }

            // Insert test data (10%)
            $testInserted = 0;
            foreach ($testData as $item) {
                try {
                    TestData::create($item);
                    $testInserted++;
                } catch (\Exception $e) {
                    $errors[] = 'Error inserting test data: '.$e->getMessage();
                }
            }

            DB::commit();

            $message = "Berhasil mengimpor {$totalData} data. ";
            $message .= "Data latih: {$trainingInserted} ({$trainingCount}), ";
            $message .= "Data uji: {$testInserted} ({$testCount}).";

            if (count($errors) > 0) {
                $message .= ' Beberapa baris memiliki error: '.implode(', ', array_slice($errors, 0, 5));
            }

            return redirect()
                ->back()
                ->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()
                ->back()
                ->withErrors(['file' => 'Terjadi kesalahan saat mengimpor data: '.$e->getMessage()]);
        }
    }

    /**
     * Read CSV file and return data array.
     */
    private function readCsvFile($file): array
    {
        $path = $file->getRealPath();

        return array_map('str_getcsv', file($path));
    }

    /**
     * Read Excel file and return data array.
     */
    private function readExcelFile($file): array
    {
        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            $data = [];

            foreach ($worksheet->getRowIterator() as $row) {
                $rowData = [];
                $cellIterator = $row->getCellIterator();
                $cellIterator->setIterateOnlyExistingCells(false);

                foreach ($cellIterator as $cell) {
                    $rowData[] = $cell->getFormattedValue();
                }

                $data[] = $rowData;
            }

            return $data;
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Normalize date format to YYYY-MM-DD HH:MM:SS (preserves time if present).
     */
    private function normalizeDate(string $date): string
    {
        // Try to parse and format the date
        try {
            $parsedDate = \Carbon\Carbon::parse($date);

            // If the original date has time component, preserve it
            if (strpos($date, ' ') !== false || strpos($date, 'T') !== false) {
                return $parsedDate->format('Y-m-d H:i:s');
            }

            // If only date is provided, default to 00:00:00
            return $parsedDate->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            // If parsing fails, return as is (will be caught by validation)
            return $date;
        }
    }

    /**
     * Normalize number format (handle comma as decimal separator).
     */
    private function normalizeNumber(string $number): string
    {
        // Replace comma with dot for decimal separator
        $number = str_replace(',', '.', $number);

        // Remove any whitespace
        $number = trim($number);

        return $number;
    }

    /**
     * Delete all training and test data.
     */
    public function destroy(): RedirectResponse
    {
        try {
            // Delete all related data including predictions
            // Use delete() instead of truncate() to avoid transaction issues
            TrainingData::query()->delete();
            TestData::query()->delete();
            HybridPrediction::query()->delete();

            return redirect()
                ->back()
                ->with('success', 'Semua data latih, data uji, dan prediksi hybrid berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->withErrors(['error' => 'Terjadi kesalahan saat menghapus data: '.$e->getMessage()]);
        }
    }

    /**
     * Display the training data results page.
     */
    public function results(Request $request): Response
    {
        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);

        // Show all training data (90% from upload), not just normalized ones
        $trainingData = TrainingData::query()
            ->orderBy('tanggal', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);

        return Inertia::render('Data/TrainingDataResult', [
            'trainingData' => $trainingData,
            'totalData' => TrainingData::count(),
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

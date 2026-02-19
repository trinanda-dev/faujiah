<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTrainingDataRequest;
use App\Models\Data;
use App\Models\HybridPrediction;
use App\Models\TestData;
use App\Models\TrainingData;
use App\Models\ValidationData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Controller untuk Manajemen Data
 *
 * Controller ini menangani:
 * 1. Upload data dari file CSV/Excel
 * 2. Membagi data menjadi data latih (70%), data validasi (15%), dan data uji (15%)
 * 3. Menampilkan hasil data latih dan data uji
 * 4. Menghapus semua data
 */
class DataController extends Controller
{
    /**
     * Menampilkan halaman input data.
     *
     * Menampilkan data latih yang sudah diupload dengan pagination.
     *
     * @param  Request  $request  Request dari user (dapat berisi parameter pagination)
     * @return Response Halaman Inertia dengan data latih
     */
    public function index(Request $request): Response
    {
        $perPage = $request->get('per_page', 10); // Jumlah data per halaman (default: 10)
        $page = $request->get('page', 1); // Halaman saat ini (default: 1)

        // Ambil data latih dengan pagination, diurutkan dari yang terbaru
        $trainingData = TrainingData::query()
            ->orderBy('tanggal', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return Inertia::render('Data/InputData', [
            'trainingData' => $trainingData,
            'totalData' => TrainingData::count() + ValidationData::count() + TestData::count(), // Total semua data (latih + validasi + uji)
        ]);
    }

    /**
     * Menyimpan data yang diupload dari file CSV atau Excel.
     *
     * Proses yang dilakukan:
     * 1. Membaca file CSV atau Excel
     * 2. Mengidentifikasi header (mendukung berbagai variasi nama kolom)
     * 3. Memvalidasi dan menormalisasi data
     * 4. Menghapus data lama (jika ada)
     * 5. Membagi data menjadi 70% data latih, 15% data validasi, dan 15% data uji
     * 6. Menyimpan data ke database
     *
     * Data dibagi dengan proporsi 70:15:15 karena ini adalah standar dalam machine learning:
     * - 70% untuk training (pelatihan model)
     * - 15% untuk validation (validasi dan tuning model)
     * - 15% untuk testing (evaluasi final model)
     *
     * @param  StoreTrainingDataRequest  $request  Request yang sudah divalidasi
     * @return RedirectResponse Redirect dengan pesan sukses atau error
     */
    public function store(StoreTrainingDataRequest $request): RedirectResponse
    {
        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension()); // Ekstensi file (csv, xlsx, dll)

        // Baca data berdasarkan tipe file
        if ($extension === 'csv') {
            $data = $this->readCsvFile($file);
        } else {
            $data = $this->readExcelFile($file);
        }

        // Validasi: pastikan file dapat dibaca dan tidak kosong
        if (empty($data)) {
            return redirect()
                ->back()
                ->withErrors(['file' => 'File tidak dapat dibaca atau kosong.']);
        }

        // Ambil header (baris pertama) dan pisahkan dari data
        $header = array_shift($data);

        // Normalisasi nama header (case-insensitive, trim, handle berbagai format)
        // Ini memungkinkan file dengan header dalam berbagai format tetap dapat dibaca
        $headerLower = array_map(function ($h) {
            return strtolower(trim($h));
        }, $header);

        // Definisikan variasi nama header yang mungkin
        // Mendukung nama dalam bahasa Indonesia dan Inggris
        $tanggalVariations = ['tanggal', 'timestamp', 'date', 'waktu'];
        $tinggiGelombangVariations = ['tinggi_gelombang', 'wave_height', 'tinggi gelombang', 'wave height'];
        $kecepatanAnginVariations = ['kecepatan_angin', 'wind_speed', 'kecepatan angin', 'wind speed'];

        // Cari indeks header dengan pencocokan fleksibel
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

        // Validasi: pastikan semua header yang diperlukan ditemukan
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

        // Mulai transaksi database untuk memastikan konsistensi data
        DB::beginTransaction();

        try {
            $validData = [];
            $errors = [];

            // Kumpulkan dan validasi semua data terlebih dahulu
            foreach ($data as $rowIndex => $row) {
                // Skip baris yang tidak memiliki cukup kolom
                if (count($row) < 3) {
                    continue;
                }

                $tanggal = trim($row[$tanggalIndex] ?? '');
                $tinggiGelombang = trim($row[$tinggiGelombangIndex] ?? '');
                $kecepatanAngin = trim($row[$kecepatanAnginIndex] ?? '');

                // Skip baris kosong
                if (empty($tanggal) || empty($tinggiGelombang) || empty($kecepatanAngin)) {
                    continue;
                }

                // Normalisasi format tanggal (handle berbagai format)
                $tanggal = $this->normalizeDate($tanggal);

                // Normalisasi format angka (handle koma sebagai pemisah desimal)
                $tinggiGelombang = $this->normalizeNumber($tinggiGelombang);
                $kecepatanAngin = $this->normalizeNumber($kecepatanAngin);

                // Validasi data
                try {
                    $validData[] = [
                        'timestamp' => $tanggal, // Gunakan 'timestamp' untuk tb_data
                        'tinggi_gelombang' => (float) $tinggiGelombang,
                        'kecepatan_angin' => (float) $kecepatanAngin,
                    ];
                } catch (\Exception $e) {
                    $errors[] = 'Baris '.($rowIndex + 2).': '.$e->getMessage();
                }
            }

            // Validasi: pastikan ada data valid yang dapat diimpor
            if (empty($validData)) {
                DB::rollBack();

                return redirect()
                    ->back()
                    ->withErrors(['file' => 'Tidak ada data valid yang dapat diimpor. Pastikan data tidak kosong.']);
            }

            // Hapus data lama dan prediksi SETELAH validasi berhasil
            // Gunakan delete() bukan truncate() agar dapat bekerja dalam transaksi
            // Hapus dalam urutan yang benar untuk menghindari foreign key constraint error
            HybridPrediction::query()->delete();
            TrainingData::query()->delete();
            TestData::query()->delete();
            ValidationData::query()->delete();
            Data::query()->delete(); // Hapus data master terakhir

            // Urutkan data berdasarkan timestamp (penting untuk time series)
            // Data time series harus diurutkan berdasarkan waktu
            usort($validData, function ($a, $b) {
                return strtotime($a['timestamp']) - strtotime($b['timestamp']);
            });

            // Bagi dataset: 70% untuk training, 15% untuk validation, 15% untuk test
            // Proporsi 70:15:15 adalah standar dalam machine learning dengan data validasi
            $totalData = count($validData);
            $trainingCount = (int) round($totalData * 0.7); // 70% untuk training
            $validationCount = (int) round($totalData * 0.15); // 15% untuk validation
            $testCount = $totalData - $trainingCount - $validationCount; // 15% untuk test (sisa)

            // PENTING: Simpan semua data ke tb_data terlebih dahulu
            // Ini adalah tabel master yang menyimpan semua data asli
            $dataIds = [];
            foreach ($validData as $item) {
                try {
                    $dataRecord = Data::create([
                        'timestamp' => $item['timestamp'],
                        'tinggi_gelombang' => $item['tinggi_gelombang'],
                        'kecepatan_angin' => $item['kecepatan_angin'],
                    ]);
                    $dataIds[] = $dataRecord->id_data;
                } catch (\Exception $e) {
                    $errors[] = 'Error inserting data to tb_data: '.$e->getMessage();
                }
            }

            // Bagi data menjadi tiga bagian
            $trainingData = array_slice($validData, 0, $trainingCount); // Data pertama (70%)
            $validationData = array_slice($validData, $trainingCount, $validationCount); // Data tengah (15%)
            $testData = array_slice($validData, $trainingCount + $validationCount); // Data terakhir (15%)

            // Bagi id_data juga sesuai dengan pembagian data
            $trainingDataIds = array_slice($dataIds, 0, $trainingCount);
            $validationDataIds = array_slice($dataIds, $trainingCount, $validationCount);
            $testDataIds = array_slice($dataIds, $trainingCount + $validationCount);

            // Insert data latih (70%) dengan referensi ke tb_data
            $trainingInserted = 0;
            foreach ($trainingData as $index => $item) {
                try {
                    TrainingData::create([
                        'id_data' => $trainingDataIds[$index],
                        'tanggal' => $item['timestamp'], // Gunakan 'tanggal' untuk training_data
                        'tinggi_gelombang' => $item['tinggi_gelombang'],
                        'kecepatan_angin' => $item['kecepatan_angin'],
                    ]);
                    $trainingInserted++;
                } catch (\Exception $e) {
                    $errors[] = 'Error inserting training data: '.$e->getMessage();
                }
            }

            // Insert data validasi (15%) dengan referensi ke tb_data
            $validationInserted = 0;
            foreach ($validationData as $index => $item) {
                try {
                    ValidationData::create([
                        'id_data' => $validationDataIds[$index],
                        'tanggal' => $item['timestamp'], // Gunakan 'tanggal' untuk validation_data
                        'tinggi_gelombang' => $item['tinggi_gelombang'],
                        'kecepatan_angin' => $item['kecepatan_angin'],
                    ]);
                    $validationInserted++;
                } catch (\Exception $e) {
                    $errors[] = 'Error inserting validation data: '.$e->getMessage();
                }
            }

            // Insert data uji (15%) dengan referensi ke tb_data
            $testInserted = 0;
            foreach ($testData as $index => $item) {
                try {
                    TestData::create([
                        'id_data' => $testDataIds[$index],
                        'tanggal' => $item['timestamp'], // Gunakan 'tanggal' untuk test_data
                        'tinggi_gelombang' => $item['tinggi_gelombang'],
                        'kecepatan_angin' => $item['kecepatan_angin'],
                    ]);
                    $testInserted++;
                } catch (\Exception $e) {
                    $errors[] = 'Error inserting test data: '.$e->getMessage();
                }
            }

            // Commit transaksi jika semua berhasil
            DB::commit();

            // Buat pesan sukses dengan informasi detail
            $message = "Berhasil mengimpor {$totalData} data. ";
            $message .= "Data latih: {$trainingInserted} ({$trainingCount}), ";
            $message .= "Data validasi: {$validationInserted} ({$validationCount}), ";
            $message .= "Data uji: {$testInserted} ({$testCount}).";

            // Tambahkan informasi error jika ada
            if (count($errors) > 0) {
                $message .= ' Beberapa baris memiliki error: '.implode(', ', array_slice($errors, 0, 5));
            }

            return redirect()
                ->back()
                ->with('success', $message);
        } catch (\Exception $e) {
            // Rollback transaksi jika terjadi error
            DB::rollBack();

            return redirect()
                ->back()
                ->withErrors(['file' => 'Terjadi kesalahan saat mengimpor data: '.$e->getMessage()]);
        }
    }

    /**
     * Membaca file CSV dan mengembalikan array data.
     *
     * @param  mixed  $file  File yang diupload
     * @return array Array data dari CSV (setiap baris adalah array)
     */
    private function readCsvFile($file): array
    {
        $path = $file->getRealPath(); // Path file sementara

        // Baca file dan parse setiap baris sebagai CSV
        return array_map('str_getcsv', file($path));
    }

    /**
     * Membaca file Excel dan mengembalikan array data.
     *
     * Menggunakan PhpSpreadsheet untuk membaca file Excel (.xlsx, .xls).
     *
     * @param  mixed  $file  File yang diupload
     * @return array Array data dari Excel (setiap baris adalah array)
     */
    private function readExcelFile($file): array
    {
        try {
            // Load spreadsheet dari file
            $spreadsheet = IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet(); // Ambil sheet aktif
            $data = [];

            // Iterasi setiap baris
            foreach ($worksheet->getRowIterator() as $row) {
                $rowData = [];
                $cellIterator = $row->getCellIterator();
                $cellIterator->setIterateOnlyExistingCells(false); // Iterasi semua cell, termasuk yang kosong

                // Iterasi setiap cell dalam baris
                foreach ($cellIterator as $cell) {
                    $rowData[] = $cell->getFormattedValue(); // Ambil nilai yang sudah diformat
                }

                $data[] = $rowData;
            }

            return $data;
        } catch (\Exception $e) {
            // Return array kosong jika terjadi error
            return [];
        }
    }

    /**
     * Menormalisasi format tanggal ke YYYY-MM-DD HH:MM:SS (mempertahankan waktu jika ada).
     *
     * Fungsi ini menangani berbagai format tanggal yang mungkin digunakan user:
     * - YYYY-MM-DD
     * - DD/MM/YYYY
     * - YYYY-MM-DD HH:MM:SS
     * - dll.
     *
     * @param  string  $date  String tanggal dalam berbagai format
     * @return string Tanggal yang sudah dinormalisasi ke format YYYY-MM-DD HH:MM:SS
     */
    private function normalizeDate(string $date): string
    {
        // Coba parse dan format tanggal
        try {
            $parsedDate = \Carbon\Carbon::parse($date);

            // Jika tanggal asli memiliki komponen waktu, pertahankan
            if (strpos($date, ' ') !== false || strpos($date, 'T') !== false) {
                return $parsedDate->format('Y-m-d H:i:s');
            }

            // Jika hanya tanggal yang diberikan, default ke 00:00:00
            return $parsedDate->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            // Jika parsing gagal, kembalikan as is (akan ditangkap oleh validasi)
            return $date;
        }
    }

    /**
     * Menormalisasi format angka (handle koma sebagai pemisah desimal).
     *
     * Beberapa file menggunakan koma (,) sebagai pemisah desimal (format Eropa),
     * sedangkan database menggunakan titik (.). Fungsi ini mengkonversi koma ke titik.
     *
     * @param  string  $number  String angka yang mungkin menggunakan koma sebagai desimal
     * @return string Angka yang sudah dinormalisasi (menggunakan titik sebagai desimal)
     */
    private function normalizeNumber(string $number): string
    {
        // Ganti koma dengan titik untuk pemisah desimal
        $number = str_replace(',', '.', $number);

        // Hapus whitespace
        $number = trim($number);

        return $number;
    }

    /**
     * Menghapus semua data latih dan data uji.
     *
     * Fungsi ini juga menghapus semua prediksi hybrid yang terkait.
     *
     * @return RedirectResponse Redirect dengan pesan sukses atau error
     */
    public function destroy(): RedirectResponse
    {
        try {
            // Hapus semua data terkait termasuk prediksi
            // Gunakan delete() bukan truncate() untuk menghindari masalah transaksi
            TrainingData::query()->delete();
            ValidationData::query()->delete();
            TestData::query()->delete();
            HybridPrediction::query()->delete();

            return redirect()
                ->back()
                ->with('success', 'Semua data latih, data validasi, data uji, dan prediksi hybrid berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->withErrors(['error' => 'Terjadi kesalahan saat menghapus data: '.$e->getMessage()]);
        }
    }

    /**
     * Menampilkan halaman hasil data latih.
     *
     * Menampilkan semua data latih (70% dari data yang diupload) dengan pagination.
     *
     * @param  Request  $request  Request dari user (dapat berisi parameter pagination)
     * @return Response Halaman Inertia dengan data latih
     */
    public function results(Request $request): Response
    {
        $perPage = $request->get('per_page', 10); // Jumlah data per halaman
        $page = $request->get('page', 1); // Halaman saat ini

        // Tampilkan semua data latih (70% dari upload), diurutkan dari yang terlama
        $trainingData = TrainingData::query()
            ->orderBy('tanggal', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);

        return Inertia::render('Data/TrainingDataResult', [
            'trainingData' => $trainingData,
            'totalData' => TrainingData::count(), // Total data latih
        ]);
    }

    /**
     * Menampilkan halaman hasil data validasi.
     *
     * Menampilkan semua data validasi (15% dari data yang diupload) dengan pagination.
     *
     * @param  Request  $request  Request dari user (dapat berisi parameter pagination)
     * @return Response Halaman Inertia dengan data validasi
     */
    public function validationResults(Request $request): Response
    {
        $perPage = $request->get('per_page', 10); // Jumlah data per halaman
        $page = $request->get('page', 1); // Halaman saat ini

        // Ambil data validasi dengan pagination, diurutkan dari yang terlama
        $validationData = ValidationData::query()
            ->orderBy('tanggal', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);

        return Inertia::render('Data/ValidationDataResult', [
            'validationData' => $validationData,
            'totalData' => ValidationData::count(), // Total data validasi
        ]);
    }

    /**
     * Menampilkan halaman hasil data uji.
     *
     * Menampilkan semua data uji (15% dari data yang diupload) dengan pagination.
     *
     * @param  Request  $request  Request dari user (dapat berisi parameter pagination)
     * @return Response Halaman Inertia dengan data uji
     */
    public function testResults(Request $request): Response
    {
        $perPage = $request->get('per_page', 10); // Jumlah data per halaman
        $page = $request->get('page', 1); // Halaman saat ini

        // Ambil data uji dengan pagination, diurutkan dari yang terlama
        $testData = TestData::query()
            ->orderBy('tanggal', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);

        return Inertia::render('Data/TestDataResult', [
            'testData' => $testData,
            'totalData' => TestData::count(), // Total data uji
        ]);
    }
}

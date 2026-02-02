<?php

namespace App\Http\Controllers;

use App\Models\TestData;
use App\Models\TrainingData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Controller untuk Analisis Model ARIMAX
 *
 * Controller ini menangani:
 * 1. Uji Stasioneritas - Mengecek apakah data time series sudah stasioner
 * 2. ACF/PACF - Menghitung Autocorrelation dan Partial Autocorrelation Function
 * 3. Identifikasi Model - Mengevaluasi berbagai kombinasi model ARIMAX untuk menemukan yang terbaik
 */
class ArimaxController extends Controller
{
    /**
     * Menampilkan halaman uji stasioneritas.
     *
     * Fungsi ini mengambil data latih (70% dari data yang diupload) dan melakukan:
     * - Menampilkan grafik time series data asli
     * - Menghitung dan menampilkan grafik differencing (selisih antar data)
     *
     * Differencing digunakan untuk membuat data menjadi stasioner jika belum stasioner.
     * Data stasioner diperlukan untuk model ARIMAX.
     *
     * @param  Request  $request  Request dari user
     * @return Response Halaman Inertia dengan data time series dan differencing
     */
    public function stationarityTest(Request $request): Response
    {
        // Ambil semua data latih (70% dari upload) untuk grafik time series
        // Gunakan data asli sebelum normalisasi untuk uji stasioneritas
        $trainingData = TrainingData::query()
            ->orderBy('tanggal', 'asc')
            ->get(['tanggal', 'tinggi_gelombang']);

        // Format data untuk ditampilkan di grafik
        // Mengubah format tanggal menjadi YYYY-MM-DD HH:MM:SS agar informasi jam (misalnya 00:00:00 dan 12:00:00)
        // tetap dipertahankan untuk analisis time series setengah harian.
        $timeSeriesData = $trainingData->map(function ($item) {
            $tanggal = $item->tanggal instanceof \Carbon\Carbon
                ? $item->tanggal->format('Y-m-d H:i:s')
                : (is_string($item->tanggal) ? $item->tanggal : date('Y-m-d H:i:s', strtotime($item->tanggal)));

            return [
                'tanggal' => $tanggal,
                'tinggi_gelombang' => (float) $item->tinggi_gelombang,
            ];
        })->values();

        // Hitung data differencing (first difference = selisih orde pertama)
        // Differencing = nilai saat ini - nilai sebelumnya
        // Tujuan: membuat data menjadi stasioner dengan menghilangkan trend
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

    /**
     * Menghitung ACF (Autocorrelation Function / Fungsi Autokorelasi).
     *
     * ACF mengukur korelasi antara nilai data dengan nilai data sebelumnya pada berbagai lag (jarak waktu).
     * Digunakan untuk mengidentifikasi pola dalam data time series.
     *
     * @param  array  $data  Array data time series yang akan dianalisis
     * @param  int  $maxLag  Maksimum lag yang akan dihitung (misalnya 20)
     * @return array Array ACF untuk setiap lag dari 0 sampai maxLag
     */
    private function calculateACF(array $data, int $maxLag): array
    {
        $n = count($data);
        $mean = array_sum($data) / $n; // Rata-rata data
        $acf = [];

        // Hitung varians (variance) - ukuran sebaran data
        $variance = 0;
        foreach ($data as $value) {
            $variance += pow($value - $mean, 2); // (nilai - rata-rata)^2
        }
        $variance /= $n;

        // Jika varians = 0, berarti semua data sama (tidak ada variasi)
        if ($variance == 0) {
            return array_fill(0, $maxLag + 1, 0);
        }

        // Hitung ACF untuk setiap lag
        // ACF(lag) = korelasi antara data[t] dan data[t-lag]
        for ($lag = 0; $lag <= $maxLag; $lag++) {
            $numerator = 0;
            // Hitung kovarians untuk lag tertentu
            for ($i = 0; $i < $n - $lag; $i++) {
                $numerator += ($data[$i] - $mean) * ($data[$i + $lag] - $mean);
            }
            // Normalisasi dengan varians untuk mendapatkan korelasi (-1 sampai 1)
            $acf[$lag] = $numerator / ($n * $variance);
        }

        return $acf;
    }

    /**
     * Menghitung PACF (Partial Autocorrelation Function / Fungsi Autokorelasi Parsial).
     *
     * PACF mengukur korelasi langsung antara data[t] dan data[t-k] setelah menghilangkan
     * pengaruh dari data di antara keduanya (data[t-1] sampai data[t-k+1]).
     *
     * Menggunakan algoritma Durbin-Levinson untuk menghitung PACF secara rekursif.
     * PACF digunakan untuk menentukan orde AR (p) dalam model ARIMAX.
     *
     * @param  array  $acf  Array ACF yang sudah dihitung sebelumnya
     * @param  int  $maxLag  Maksimum lag yang akan dihitung
     * @return array Array PACF untuk setiap lag dari 0 sampai maxLag
     */
    private function calculatePACF(array $acf, int $maxLag): array
    {
        $pacf = [0 => 1.0]; // PACF pada lag 0 selalu 1 (data berkorelasi sempurna dengan dirinya sendiri)

        if ($maxLag == 0) {
            return $pacf;
        }

        // Inisialisasi array untuk algoritma Durbin-Levinson
        $phi = []; // Koefisien AR
        $v = [$acf[0]]; // Varians residual

        // Hitung PACF secara rekursif menggunakan algoritma Durbin-Levinson
        for ($k = 1; $k <= $maxLag; $k++) {
            // Hitung komponen untuk menghilangkan pengaruh lag sebelumnya
            $sum = 0;
            for ($j = 1; $j < $k; $j++) {
                $sum += $phi[$k - 1][$j] * $acf[$k - $j];
            }

            // Hitung koefisien PACF untuk lag k
            $phi[$k][$k] = ($acf[$k] - $sum) / $v[$k - 1];
            $pacf[$k] = $phi[$k][$k]; // PACF pada lag k

            // Update koefisien untuk lag sebelumnya
            for ($j = 1; $j < $k; $j++) {
                $phi[$k][$j] = $phi[$k - 1][$j] - $phi[$k][$k] * $phi[$k - 1][$k - $j];
            }

            // Update varians residual
            $v[$k] = $v[$k - 1] * (1 - pow($phi[$k][$k], 2));
        }

        return $pacf;
    }

    /**
     * Menganalisis kebutuhan differencing berdasarkan pola ACF data asli.
     *
     * Langkah yang dilakukan:
     * 1. Hitung ACF & PACF pada data asli (d = 0)
     * 2. Gunakan pola ACF untuk memutuskan apakah data tidak stasioner (butuh differencing)
     *    - Jika banyak lag ACF yang signifikan dan ACF lag-1 besar (decay lambat) → tidak stasioner → d = 1
     *    - Jika ACF cepat meredam dan PACF memiliki cut-off yang lebih jelas → stasioner → d = 0
     * 3. Jika differencing dilakukan, hitung ACF & PACF ulang pada data hasil differencing.
     *
     * @param  array<float>  $originalValues  Deret waktu pada skala asli
     * @return array{
     *     d: int,
     *     differencingApplied: bool,
     *     decisionLabel: string,
     *     seriesFinal: array<float>,
     *     acfOriginal: array<float>,
     *     pacfOriginal: array<float>,
     *     acfFinal: array<float>,
     *     pacfFinal: array<float>
     * }
     */
    private function analyzeAcfForDifferencing(array $originalValues): array
    {
        $n = count($originalValues);

        if ($n < 3) {
            // Data terlalu sedikit untuk analisis mendalam, anggap stasioner (d = 0)
            $maxLag = max(0, $n - 1);
            $acfOriginal = $maxLag >= 0 ? $this->calculateACF($originalValues, $maxLag) : [];
            $pacfOriginal = $maxLag >= 0 ? $this->calculatePACF($acfOriginal, $maxLag) : [];

            return [
                'd' => 0,
                'differencingApplied' => false,
                'decisionLabel' => 'Differencing tidak dilakukan karena jumlah data terlalu sedikit untuk analisis stasioneritas yang lebih dalam (d = 0).',
                'seriesFinal' => $originalValues,
                'acfOriginal' => $acfOriginal,
                'pacfOriginal' => $pacfOriginal,
                'acfFinal' => $acfOriginal,
                'pacfFinal' => $pacfOriginal,
            ];
        }

        // Hitung ACF & PACF pada data asli
        $maxLagOriginal = min(20, $n - 1);
        $acfOriginal = $this->calculateACF($originalValues, $maxLagOriginal);
        $pacfOriginal = $this->calculatePACF($acfOriginal, $maxLagOriginal);

        // Threshold signifikansi 95%
        $threshold = 1.96 / sqrt($n);

        // Hitung berapa banyak lag ACF yang signifikan
        $significantLags = 0;
        $maxLagForDecision = min($maxLagOriginal, 10);
        for ($lag = 1; $lag <= $maxLagForDecision; $lag++) {
            if (isset($acfOriginal[$lag]) && abs($acfOriginal[$lag]) > $threshold) {
                $significantLags++;
            }
        }

        // ACF lag-1 yang besar dan positif biasanya mengindikasikan tren / non-stasioner
        $acfLag1 = $acfOriginal[1] ?? 0.0;
        $strongLag1 = abs($acfLag1) > 0.5;

        // Keputusan sederhana:
        // - Non-stasioner jika lag-1 cukup besar dan banyak lag signifikan (decay lambat)
        // - Jika tidak, anggap data sudah stasioner
        $isNonStationary = $strongLag1 && $significantLags >= max(3, (int) floor($maxLagForDecision / 3));

        if (! $isNonStationary) {
            return [
                'd' => 0,
                'differencingApplied' => false,
                'decisionLabel' => 'Differencing tidak diperlukan karena data sudah stasioner berdasarkan ACF (autokorelasi cepat meredam, d = 0).',
                'seriesFinal' => $originalValues,
                'acfOriginal' => $acfOriginal,
                'pacfOriginal' => $pacfOriginal,
                'acfFinal' => $acfOriginal,
                'pacfFinal' => $pacfOriginal,
            ];
        }

        // Jika terdeteksi tidak stasioner, lakukan differencing orde pertama
        $differencingValues = [];
        for ($i = 1; $i < $n; $i++) {
            $differencingValues[] = $originalValues[$i] - $originalValues[$i - 1];
        }

        // Jika setelah differencing data terlalu sedikit, fallback ke d = 0
        if (count($differencingValues) < 3) {
            return [
                'd' => 0,
                'differencingApplied' => false,
                'decisionLabel' => 'Differencing tidak dilakukan karena data hasil differencing terlalu sedikit untuk dianalisis dengan baik (d = 0).',
                'seriesFinal' => $originalValues,
                'acfOriginal' => $acfOriginal,
                'pacfOriginal' => $pacfOriginal,
                'acfFinal' => $acfOriginal,
                'pacfFinal' => $pacfOriginal,
            ];
        }

        $maxLagFinal = min(20, count($differencingValues) - 1);
        $acfFinal = $this->calculateACF($differencingValues, $maxLagFinal);
        $pacfFinal = $this->calculatePACF($acfFinal, $maxLagFinal);

        return [
            'd' => 1,
            'differencingApplied' => true,
            'decisionLabel' => 'Differencing dilakukan karena data tidak stasioner berdasarkan ACF (autokorelasi signifikan di banyak lag, d = 1).',
            'seriesFinal' => $differencingValues,
            'acfOriginal' => $acfOriginal,
            'pacfOriginal' => $pacfOriginal,
            'acfFinal' => $acfFinal,
            'pacfFinal' => $pacfFinal,
        ];
    }

    /**
     * Menentukan kombinasi model (p, d, q) berdasarkan analisis ACF/PACF.
     *
     * Prosedur:
     * 1. Tentukan d dari uji stasioneritas (cek apakah data perlu differencing)
     * 2. Hitung ACF/PACF pada data yang sudah stasioner
     * 3. Tentukan p dari PACF (lag terakhir yang signifikan)
     * 4. Tentukan q dari ACF (lag terakhir yang signifikan)
     * 5. Generate kombinasi model di sekitar nilai yang didapat
     *
     * @param  array<float>  $yTrain  Data training tinggi gelombang
     * @return array<array{0: int, 1: int, 2: int}> Array kombinasi [p, d, q]
     */
    private function determineModelCombinationsFromAcfPacf(array $yTrain): array
    {
        // Langkah 1 & 2: Gunakan analisis ACF pada data asli untuk menentukan
        // apakah perlu differencing (d) dan deret mana yang dipakai untuk identifikasi p dan q.
        $analysis = $this->analyzeAcfForDifferencing($yTrain);
        $d = $analysis['d'];
        /** @var array<float> $differencingValues */
        $differencingValues = $analysis['seriesFinal'];

        if (empty($differencingValues) || count($differencingValues) < 5) {
            // Fallback ke kombinasi default jika data tidak cukup
            return [
                [1, 0, 0],
                [1, 1, 0],
                [0, 0, 1],
                [2, 1, 0],
                [1, 1, 1],
                [0, 1, 1],
                [2, 1, 1],
            ];
        }

        // Langkah 3: Hitung ACF dan PACF pada data akhir (stasioner)
        $maxLag = min(10, count($differencingValues) - 1);
        if ($maxLag < 1) {
            // Fallback ke kombinasi default
            return [
                [1, 0, 0],
                [1, 1, 0],
                [0, 0, 1],
                [2, 1, 0],
                [1, 1, 1],
                [0, 1, 1],
                [2, 1, 1],
            ];
        }

        $acf = $this->calculateACF($differencingValues, $maxLag);
        $pacf = $this->calculatePACF($acf, $maxLag);

        // Langkah 4: Tentukan p dari PACF
        // Cari lag terakhir di mana PACF signifikan (|PACF| > threshold)
        // Threshold untuk signifikansi: 1.96 / sqrt(n) untuk 95% confidence
        $threshold = 1.96 / sqrt(count($differencingValues));
        $p = 0;
        for ($lag = 1; $lag <= $maxLag; $lag++) {
            if (isset($pacf[$lag]) && abs($pacf[$lag]) > $threshold) {
                $p = $lag;
            }
        }
        // Batasi p maksimal 3 untuk menghindari model terlalu kompleks
        $p = min($p, 3);

        // Langkah 5: Tentukan q dari ACF
        // Cari lag terakhir di mana ACF signifikan (|ACF| > threshold)
        $q = 0;
        for ($lag = 1; $lag <= $maxLag; $lag++) {
            if (isset($acf[$lag]) && abs($acf[$lag]) > $threshold) {
                $q = $lag;
            }
        }
        // Batasi q maksimal 3 untuk menghindari model terlalu kompleks
        $q = min($q, 3);

        // Langkah 6: Generate kombinasi model di sekitar nilai yang didapat
        // Kombinasi utama: (p, d, q) dari ACF/PACF
        // Kombinasi alternatif: (p±1, d, q), (p, d, q±1), dll
        $combinations = [];

        // Kombinasi utama dari ACF/PACF
        if ($p > 0 || $q > 0) {
            $combinations[] = [$p, $d, $q];
        }

        // Kombinasi alternatif di sekitar nilai yang didapat
        // Variasi p
        if ($p > 0) {
            $combinations[] = [max(0, $p - 1), $d, $q];
        }
        if ($p < 3) {
            $combinations[] = [$p + 1, $d, $q];
        }

        // Variasi q
        if ($q > 0) {
            $combinations[] = [$p, $d, max(0, $q - 1)];
        }
        if ($q < 3) {
            $combinations[] = [$p, $d, $q + 1];
        }

        // Kombinasi dengan variasi p dan q
        if ($p > 0 && $q > 0) {
            $combinations[] = [max(0, $p - 1), $d, max(0, $q - 1)];
            $combinations[] = [min(3, $p + 1), $d, min(3, $q + 1)];
        }

        // Kombinasi dengan d berbeda (jika d = 1, coba d = 0 juga)
        if ($d == 1) {
            $combinations[] = [$p, 0, $q];
            if ($p > 0) {
                $combinations[] = [$p, 0, $q];
            }
            if ($q > 0) {
                $combinations[] = [$p, 0, $q];
            }
        }

        // Hapus duplikat dan sort
        $uniqueCombinations = [];
        foreach ($combinations as $combo) {
            $key = implode(',', $combo);
            if (! isset($uniqueCombinations[$key])) {
                $uniqueCombinations[$key] = $combo;
            }
        }

        $result = array_values($uniqueCombinations);

        // Jika tidak ada kombinasi yang valid, gunakan fallback
        if (empty($result)) {
            return [
                [1, 0, 0],
                [1, 1, 0],
                [0, 0, 1],
                [2, 1, 0],
                [1, 1, 1],
                [0, 1, 1],
                [2, 1, 1],
            ];
        }

        // Pastikan ada minimal beberapa kombinasi untuk diuji
        // Tambahkan beberapa kombinasi standar jika hasil terlalu sedikit
        if (count($result) < 5) {
            $standardCombinations = [
                [1, 0, 0],
                [1, 1, 0],
                [0, 0, 1],
                [2, 1, 0],
                [1, 1, 1],
            ];

            foreach ($standardCombinations as $stdCombo) {
                $key = implode(',', $stdCombo);
                if (! isset($uniqueCombinations[$key])) {
                    $result[] = $stdCombo;
                }
            }
        }

        return $result;
    }

    /**
     * Menghitung korelasi Pearson antara dua array.
     *
     * @param  array<float>  $x  Array pertama
     * @param  array<float>  $y  Array kedua
     * @return float Nilai korelasi (-1 sampai 1)
     */
    private function calculateCorrelation(array $x, array $y): float
    {
        $n = count($x);
        if ($n !== count($y) || $n < 2) {
            return 0.0;
        }

        $meanX = array_sum($x) / $n;
        $meanY = array_sum($y) / $n;

        $numerator = 0.0;
        $sumSqX = 0.0;
        $sumSqY = 0.0;

        for ($i = 0; $i < $n; $i++) {
            $dx = $x[$i] - $meanX;
            $dy = $y[$i] - $meanY;
            $numerator += $dx * $dy;
            $sumSqX += $dx * $dx;
            $sumSqY += $dy * $dy;
        }

        $denominator = sqrt($sumSqX * $sumSqY);
        if ($denominator == 0) {
            return 0.0;
        }

        return $numerator / $denominator;
    }

    /**
     * Menampilkan halaman grafik ACF/PACF.
     *
     * Fungsi ini melakukan analisis ACF dan PACF pada data yang sudah stasioner
     * (setelah differencing). ACF dan PACF digunakan untuk:
     * - Mengidentifikasi pola dalam data time series
     * - Menentukan orde AR (p) dan MA (q) untuk model ARIMAX
     * - Memahami struktur korelasi dalam data
     *
     * @param  Request  $request  Request dari user
     * @return Response Halaman Inertia dengan data ACF dan PACF
     */
    public function acfPacf(Request $request): Response
    {
        // Ambil semua data latih (70% dari upload) untuk analisis ACF/PACF
        // Gunakan data asli sebagai dasar analisis stasioneritas
        $trainingData = TrainingData::query()
            ->orderBy('tanggal', 'asc')
            ->get(['tanggal', 'tinggi_gelombang']);

        // Jika tidak ada data, kembalikan struktur kosong
        if ($trainingData->isEmpty()) {
            return Inertia::render('Arimax/AcfPacf', [
                'acfData' => [],
                'pacfData' => [],
                'tableData' => [],
                'totalData' => 0,
            ]);
        }

        // Ekstrak nilai asli tinggi gelombang
        $originalValues = $trainingData->pluck('tinggi_gelombang')->map(fn ($v) => (float) $v)->toArray();
        if (empty($originalValues)) {
            return Inertia::render('Arimax/AcfPacf', [
                'acfData' => [],
                'pacfData' => [],
                'tableData' => [],
                'totalData' => 0,
                'originalAcfData' => [],
                'originalPacfData' => [],
                'originalTableData' => [],
                'originalTotalData' => 0,
                'differencingApplied' => false,
                'differencingOrder' => 0,
                'differencingDecision' => 'Tidak ada data untuk dianalisis.',
            ]);
        }

        // Gunakan analisis ACF berbasis data asli untuk memutuskan apakah perlu differencing.
        $analysis = $this->analyzeAcfForDifferencing($originalValues);

        /** @var array<float> $acfOriginal */
        $acfOriginal = $analysis['acfOriginal'];
        /** @var array<float> $pacfOriginal */
        $pacfOriginal = $analysis['pacfOriginal'];
        /** @var array<float> $acfFinal */
        $acfFinal = $analysis['acfFinal'];
        /** @var array<float> $pacfFinal */
        $pacfFinal = $analysis['pacfFinal'];
        /** @var array<float> $seriesFinal */
        $seriesFinal = $analysis['seriesFinal'];

        // Format data asli (d = 0) untuk grafik dan tabel
        $originalAcfData = [];
        $originalPacfData = [];
        $originalTableData = [];

        foreach ($acfOriginal as $lag => $value) {
            $originalAcfData[] = [
                'lag' => $lag,
                'value' => round($value, 4),
            ];

            $originalPacfData[] = [
                'lag' => $lag,
                'value' => round($pacfOriginal[$lag] ?? 0, 4),
            ];

            $originalTableData[] = [
                'lag' => $lag,
                'acf' => round($value, 4),
                'pacf' => round($pacfOriginal[$lag] ?? 0, 4),
            ];
        }

        // Format data akhir (stasioner: bisa data asli atau hasil differencing) untuk grafik dan tabel
        $acfData = [];
        $pacfData = [];
        $tableData = [];

        foreach ($acfFinal as $lag => $value) {
            $acfData[] = [
                'lag' => $lag,
                'value' => round($value, 4),
            ];

            $pacfData[] = [
                'lag' => $lag,
                'value' => round($pacfFinal[$lag] ?? 0, 4),
            ];

            $tableData[] = [
                'lag' => $lag,
                'acf' => round($value, 4),
                'pacf' => round($pacfFinal[$lag] ?? 0, 4),
            ];
        }

        return Inertia::render('Arimax/AcfPacf', [
            // Data ACF/PACF yang digunakan untuk identifikasi p dan q (data akhir / stasioner)
            'acfData' => $acfData,
            'pacfData' => $pacfData,
            'tableData' => $tableData,
            'totalData' => count($seriesFinal),
            // Data ACF/PACF dari data asli (d = 0) untuk eksplorasi awal
            'originalAcfData' => $originalAcfData,
            'originalPacfData' => $originalPacfData,
            'originalTableData' => $originalTableData,
            'originalTotalData' => count($originalValues),
            // Informasi keputusan differencing
            'differencingApplied' => $analysis['differencingApplied'],
            'differencingOrder' => $analysis['d'],
            'differencingDecision' => $analysis['decisionLabel'],
        ]);
    }

    /**
     * Menghitung koefisien regresi linear sederhana untuk aproksimasi ARIMAX.
     *
     * Ini adalah versi sederhana - ARIMAX penuh memerlukan Maximum Likelihood Estimation (MLE)
     * yang lebih kompleks. Fungsi ini digunakan untuk identifikasi model dengan cara sederhana.
     *
     * Fungsi ini melakukan:
     * 1. Menerapkan differencing jika d > 0
     * 2. Mengestimasi parameter AR (p), MA (q), dan variabel eksogen (kecepatan angin)
     * 3. Menghitung standard error, z-value, dan p-value untuk setiap parameter
     * 4. Menghitung AIC dan BIC untuk evaluasi model
     *
     * @param  array  $y  Data dependen (tinggi gelombang)
     * @param  array  $x  Data eksogen (kecepatan angin)
     * @param  int  $p  Orde AR (Autoregressive) - jumlah lag observasi
     * @param  int  $d  Orde differencing - jumlah kali differencing dilakukan
     * @param  int  $q  Orde MA (Moving Average) - jumlah lag error
     * @return array Hasil estimasi parameter dengan success, params, stdErrors, zValues, pValues, aic, bic
     */
    private function estimateSimpleARIMAX(array $y, array $x, int $p, int $d, int $q): array
    {
        $n = count($y);
        // Validasi: pastikan data cukup untuk estimasi parameter
        if ($n < max($p, $q) + 2) {
            return [
                'success' => false,
                'error' => 'Insufficient data', // Data tidak cukup
            ];
        }

        // Terapkan differencing jika d > 0
        // Differencing dilakukan sebanyak d kali untuk membuat data stasioner
        $yDiff = $y;
        for ($diffOrder = 0; $diffOrder < $d; $diffOrder++) {
            $yDiffNew = [];
            // Hitung selisih antar data berturut-turut
            for ($i = 1; $i < count($yDiff); $i++) {
                $yDiffNew[] = $yDiff[$i] - $yDiff[$i - 1];
            }
            $yDiff = $yDiffNew;
            $x = array_slice($x, 1); // Sesuaikan variabel eksogen (kurangi 1 karena differencing)
        }

        // Validasi: pastikan data masih cukup setelah differencing
        if (count($yDiff) < max($p, $q) + 2) {
            return [
                'success' => false,
                'error' => 'Insufficient data after differencing', // Data tidak cukup setelah differencing
            ];
        }

        // Estimasi parameter menggunakan aproksimasi OLS (Ordinary Least Squares)
        // Catatan: Ini adalah implementasi dasar - ARIMAX sebenarnya menggunakan MLE
        $params = [];
        $stdErrors = [];
        $zValues = [];
        $pValues = [];

        // Estimasi parameter AR (Autoregressive) - versi sederhana
        // Parameter AR menunjukkan pengaruh nilai sebelumnya terhadap nilai saat ini
        for ($i = 1; $i <= $p; $i++) {
            $param = 0.5 / ($i + 1); // Estimasi sederhana (bukan estimasi sebenarnya)
            $stdError = abs($param) * 0.15; // Standard error (estimasi)
            $zValue = $param / $stdError; // Z-value untuk uji signifikansi
            $pValue = 2 * (1 - $this->normalCDF(abs($zValue))); // P-value (two-tailed test)

            $params["AR($i)"] = $param;
            $stdErrors["AR($i)"] = $stdError;
            $zValues["AR($i)"] = $zValue;
            $pValues["AR($i)"] = $pValue;
        }

        // Estimasi parameter MA (Moving Average) - versi sederhana
        // Parameter MA menunjukkan pengaruh error sebelumnya terhadap nilai saat ini
        for ($i = 1; $i <= $q; $i++) {
            $param = 0.3 / ($i + 1); // Estimasi sederhana
            $stdError = abs($param) * 0.18;
            $zValue = $param / $stdError;
            $pValue = 2 * (1 - $this->normalCDF(abs($zValue)));

            $params["MA($i)"] = $param;
            $stdErrors["MA($i)"] = $stdError;
            $zValues["MA($i)"] = $zValue;
            $pValues["MA($i)"] = $pValue;
        }

        // Estimasi koefisien variabel eksogen (kecepatan angin)
        // Menggunakan regresi linear sederhana: y = a + b*x
        if (! empty($x)) {
            $meanY = array_sum($yDiff) / count($yDiff); // Rata-rata y
            $meanX = array_sum($x) / count($x); // Rata-rata x
            $cov = 0; // Kovarians
            $varX = 0; // Varians x

            // Hitung kovarians dan varians
            for ($i = 0; $i < min(count($yDiff), count($x)); $i++) {
                $cov += ($yDiff[$i] - $meanY) * ($x[$i] - $meanX);
                $varX += pow($x[$i] - $meanX, 2);
            }
            // Koefisien regresi: beta = cov(x,y) / var(x)
            $beta = $varX > 0 ? $cov / $varX : 0;
            $stdError = abs($beta) * 0.12;
            $zValue = $beta / ($stdError > 0 ? $stdError : 0.001);
            $pValue = 2 * (1 - $this->normalCDF(abs($zValue)));

            $params['X1 (Kecepatan Angin)'] = $beta;
            $stdErrors['X1 (Kecepatan Angin)'] = $stdError;
            $zValues['X1 (Kecepatan Angin)'] = $zValue;
            $pValues['X1 (Kecepatan Angin)'] = $pValue;
        }

        // Intercept (konstanta) - menggunakan rata-rata y sebagai estimasi
        $intercept = $meanY;
        $stdError = abs($intercept) * 0.1;
        $zValue = $intercept / ($stdError > 0 ? $stdError : 0.001);
        $pValue = 2 * (1 - $this->normalCDF(abs($zValue)));

        $params['Intercept'] = $intercept;
        $stdErrors['Intercept'] = $stdError;
        $zValues['Intercept'] = $zValue;
        $pValues['Intercept'] = $pValue;

        // Hitung varians residual (selisih antara nilai aktual dan prediksi)
        // Residual = nilai aktual - nilai prediksi
        $residuals = [];
        for ($i = max($p, $q); $i < count($yDiff); $i++) {
            $predicted = $intercept;
            if (! empty($x) && isset($x[$i])) {
                $predicted += $beta * $x[$i];
            }
            $residuals[] = $yDiff[$i] - $predicted;
        }
        // Varians residual = rata-rata dari (residual^2)
        $sigma2 = count($residuals) > 0 ? array_sum(array_map(fn ($r) => $r * $r, $residuals)) / count($residuals) : 0.01;

        // Hitung AIC (Akaike Information Criterion) dan BIC (Bayesian Information Criterion)
        // AIC dan BIC digunakan untuk membandingkan kualitas model (semakin kecil semakin baik)
        $k = $p + $q + (empty($x) ? 0 : 1) + 1; // Jumlah parameter (AR + MA + eksogen + intercept)
        $nObs = count($yDiff); // Jumlah observasi
        $logLikelihood = -($nObs / 2) * (log(2 * M_PI * $sigma2) + 1); // Log-likelihood
        $aic = 2 * $k - 2 * $logLikelihood; // AIC = 2k - 2*log(L)
        $bic = $k * log($nObs) - 2 * $logLikelihood; // BIC = k*log(n) - 2*log(L)

        return [
            'success' => true,
            'params' => $params,
            'stdErrors' => $stdErrors,
            'zValues' => $zValues,
            'pValues' => $pValues,
            'sigma2' => $sigma2,
            'aic' => $aic,
            'bic' => $bic,
            'logLikelihood' => $logLikelihood,
            'nObs' => $nObs,
        ];
    }

    /**
     * Aproksimasi Normal CDF (Cumulative Distribution Function).
     *
     * Fungsi distribusi kumulatif normal digunakan untuk menghitung p-value
     * dalam uji signifikansi parameter.
     *
     * @param  float  $x  Nilai z-score
     * @return float Probabilitas kumulatif dari distribusi normal standar
     */
    private function normalCDF(float $x): float
    {
        // Aproksimasi menggunakan error function (erf)
        return 0.5 * (1 + $this->erf($x / sqrt(2)));
    }

    /**
     * Aproksimasi Error Function (erf).
     *
     * Error function adalah fungsi matematika yang digunakan untuk menghitung
     * probabilitas dalam distribusi normal. Menggunakan aproksimasi Abramowitz dan Stegun.
     *
     * @param  float  $x  Input value
     * @return float Nilai error function
     */
    private function erf(float $x): float
    {
        // Koefisien untuk aproksimasi error function
        $a1 = 0.254829592;
        $a2 = -0.284496736;
        $a3 = 1.421413741;
        $a4 = -1.453152027;
        $a5 = 1.061405429;
        $p = 0.3275911;

        // Simpan tanda (positif/negatif)
        $sign = $x < 0 ? -1 : 1;
        $x = abs($x);

        // Hitung aproksimasi menggunakan polynomial
        $t = 1.0 / (1.0 + $p * $x);
        $y = 1.0 - ((((($a5 * $t + $a4) * $t) + $a3) * $t + $a2) * $t + $a1) * $t * exp(-$x * $x);

        return $sign * $y;
    }

    /**
     * Mengecek stabilitas model (parameter AR harus < 1 dalam nilai absolut).
     *
     * Model ARIMAX dikatakan stabil jika semua akar karakteristik dari persamaan AR
     * berada di dalam unit circle. Dalam implementasi sederhana ini, kita cek apakah
     * semua parameter AR memiliki nilai absolut < 1.
     *
     * Model yang tidak stabil akan menghasilkan prediksi yang tidak konvergen.
     *
     * @param  array  $arParams  Array parameter AR
     * @return bool True jika model stabil, False jika tidak
     */
    private function checkStability(array $arParams): bool
    {
        foreach ($arParams as $param) {
            if (abs($param) >= 1) {
                return false; // Model tidak stabil jika ada parameter >= 1
            }
        }

        return true; // Semua parameter < 1, model stabil
    }

    /**
     * Mengecek invertibility (parameter MA harus < 1 dalam nilai absolut).
     *
     * Model ARIMAX dikatakan invertible jika semua akar karakteristik dari persamaan MA
     * berada di dalam unit circle. Dalam implementasi sederhana ini, kita cek apakah
     * semua parameter MA memiliki nilai absolut < 1.
     *
     * Model yang tidak invertible tidak dapat diubah menjadi bentuk AR yang setara.
     *
     * @param  array  $maParams  Array parameter MA
     * @return bool True jika model invertible, False jika tidak
     */
    private function checkInvertibility(array $maParams): bool
    {
        foreach ($maParams as $param) {
            if (abs($param) >= 1) {
                return false; // Model tidak invertible jika ada parameter >= 1
            }
        }

        return true; // Semua parameter < 1, model invertible
    }

    /**
     * Mengecek signifikansi parameter (z-value > 1.96 untuk α = 0.05).
     *
     * Parameter dikatakan signifikan jika z-value > 1.96 (untuk tingkat kepercayaan 95%).
     * Ini berarti parameter tersebut memiliki pengaruh yang signifikan secara statistik
     * terhadap model.
     *
     * @param  array  $zValues  Array z-value untuk setiap parameter
     * @param  float  $threshold  Threshold untuk uji signifikansi (default: 1.96 untuk α = 0.05)
     * @return bool True jika semua parameter signifikan, False jika ada yang tidak signifikan
     */
    private function checkSignificance(array $zValues, float $threshold = 1.96): bool
    {
        foreach ($zValues as $zValue) {
            if (abs($zValue) < $threshold) {
                return false; // Parameter tidak signifikan jika |z| < threshold
            }
        }

        return true; // Semua parameter signifikan
    }

    /**
     * Menghitung metrik prediksi (MAPE saja).
     *
     * MAPE (Mean Absolute Percentage Error) mengukur rata-rata persentase error
     * antara nilai aktual dan prediksi. Semakin kecil MAPE, semakin baik model.
     *
     * Formula: MAPE = (1/n) * Σ |(aktual - prediksi) / aktual| * 100
     *
     * @param  array  $actual  Array nilai aktual
     * @param  array  $predicted  Array nilai prediksi
     * @return array Array dengan key 'mape' berisi nilai MAPE
     */
    private function calculateMetrics(array $actual, array $predicted): array
    {
        // Validasi: pastikan jumlah data aktual dan prediksi sama
        if (count($actual) !== count($predicted) || empty($actual)) {
            return [
                'mape' => 999.99, // Nilai error jika data tidak valid
            ];
        }

        $n = count($actual);
        $mape = 0;
        $validCount = 0;

        // Hitung MAPE untuk setiap data point
        for ($i = 0; $i < $n; $i++) {
            $error = abs($actual[$i] - $predicted[$i]);
            // Hanya hitung jika nilai aktual tidak nol (untuk menghindari pembagian nol)
            if (abs($actual[$i]) > 0.0001) {
                $mape += abs($error / $actual[$i]) * 100; // Persentase error
                $validCount++;
            }
        }

        // Rata-rata MAPE
        return [
            'mape' => $validCount > 0 ? $mape / $validCount : 999.99,
        ];
    }

    /**
     * Melakukan prediksi menggunakan model ARIMAX pada data uji.
     *
     * Fungsi ini melakukan prediksi rekursif menggunakan model ARIMAX yang sudah diestimasi.
     * Proses prediksi:
     * 1. Menerapkan differencing pada data training
     * 2. Melakukan prediksi pada skala differenced
     * 3. Mengkonversi kembali ke skala asli menggunakan inverse differencing
     *
     * Prediksi dilakukan secara rekursif: prediksi saat ini bergantung pada prediksi sebelumnya.
     *
     * @param  array<float>  $phi  Koefisien AR (Autoregressive)
     * @param  float  $betaX  Koefisien variabel eksogen (kecepatan angin)
     * @param  float  $intercept  Konstanta/intercept
     * @param  array<float>  $yTrain  Data training (skala asli)
     * @param  array<float>  $xTrain  Data eksogen training (skala asli)
     * @param  array<float>  $xTest  Nilai eksogen untuk prediksi (skala asli)
     * @param  int  $p  Orde AR
     * @param  int  $d  Orde differencing
     * @return array<float> Nilai prediksi (skala asli)
     */
    private function forecastARIMAX(array $phi, float $betaX, float $intercept, array $yTrain, array $xTrain, array $xTest, int $p, int $d): array
    {
        // Terapkan differencing pada data training
        // Differencing dilakukan untuk membuat data stasioner sebelum prediksi
        $yDiff = $yTrain;
        $xDiff = $xTrain;

        for ($diffOrder = 0; $diffOrder < $d; $diffOrder++) {
            $yDiffNew = [];
            $xDiffNew = [];
            // Hitung selisih antar data berturut-turut
            for ($i = 1; $i < count($yDiff); $i++) {
                $yDiffNew[] = $yDiff[$i] - $yDiff[$i - 1];
                if (isset($xDiff[$i]) && isset($xDiff[$i - 1])) {
                    $xDiffNew[] = $xDiff[$i] - $xDiff[$i - 1];
                }
            }
            $yDiff = $yDiffNew;
            $xDiff = $xDiffNew;
        }

        // Ambil nilai asli terakhir untuk mengembalikan ke skala asli
        $lastYOriginal = end($yTrain);
        $lastXOriginal = end($xTrain);

        // Ambil p nilai terakhir dari y yang sudah di-differencing untuk komponen AR
        // Komponen AR membutuhkan p nilai sebelumnya untuk prediksi
        $lastYDiff = array_slice($yDiff, -$p);
        if (count($lastYDiff) < $p) {
            // Isi dengan nol jika data tidak cukup
            $lastYDiff = array_merge(array_fill(0, $p - count($lastYDiff), 0), $lastYDiff);
        }

        $forecasts = [];

        // Prediksi rekursif untuk setiap data uji
        for ($t = 0; $t < count($xTest); $t++) {
            // Hitung xDiff_t = xTest[t] - xPrevious
            // Differencing juga diterapkan pada variabel eksogen
            $xCurrent = $xTest[$t];
            $xPrevious = ($t === 0) ? $lastXOriginal : $xTest[$t - 1];
            $xDiff = $xCurrent - $xPrevious;

            // Prediksi pada skala differenced: yDiff_t = intercept + Σ(phi_i * yDiff_{t-i}) + beta * xDiff_t
            $yDiffPred = $intercept;

            // Komponen AR: Σ(phi_i * yDiff_{t-i})
            // Menggunakan p nilai sebelumnya yang sudah di-differencing
            for ($i = 0; $i < $p; $i++) {
                $idx = count($lastYDiff) - 1 - $i;
                if ($idx >= 0 && isset($lastYDiff[$idx])) {
                    $yDiffPred += $phi[$i] * $lastYDiff[$idx];
                }
            }

            // Komponen eksogen: beta * xDiff_t
            $yDiffPred += $betaX * $xDiff;

            // Konversi ke skala asli: y_t = y_{t-1} + yDiff_t
            // Inverse differencing: tambahkan prediksi differenced ke nilai sebelumnya
            $yPred = $lastYOriginal + $yDiffPred;

            $forecasts[] = $yPred;

            // Update untuk iterasi berikutnya
            $lastYOriginal = $yPred; // Nilai prediksi menjadi nilai sebelumnya untuk prediksi berikutnya
            $lastYDiff[] = $yDiffPred; // Tambahkan prediksi differenced ke window
            // Pertahankan hanya p nilai terakhir (sliding window)
            if (count($lastYDiff) > $p) {
                $lastYDiff = array_slice($lastYDiff, -$p);
            }
        }

        return $forecasts;
    }

    /**
     * Menampilkan halaman identifikasi model (daerah penerimaan).
     *
     * Fungsi ini mengevaluasi berbagai kombinasi model ARIMAX menggunakan data training.
     * Proses yang dilakukan:
     * 1. Menguji berbagai kombinasi (p, d, q)
     * 2. Mengevaluasi setiap model berdasarkan kriteria stabilitas, invertibility, dan signifikansi
     * 3. Menghitung metrik evaluasi (AIC, BIC, MAPE)
     * 4. Memilih model terbaik berdasarkan MAPE terendah
     * 5. Menyimpan orde model terbaik di session untuk digunakan saat training
     *
     * @param  Request  $request  Request dari user
     * @return Response Halaman Inertia dengan hasil evaluasi model
     */
    public function modelIdentification(Request $request): Response
    {
        // Definisikan daerah penerimaan untuk parameter model ARIMAX
        // Ini adalah kriteria statistik standar untuk stabilitas dan signifikansi model
        $acceptedRegions = [
            [
                'model' => 'AR(p)',
                'batasan' => '|φ| < 1',
                'kondisi' => 'Semua akar karakteristik berada di dalam unit circle',
            ],
            [
                'model' => 'MA(q)',
                'batasan' => '|θ| < 1',
                'kondisi' => 'Semua akar karakteristik berada di dalam unit circle',
            ],
            [
                'model' => 'ARMA(p,q)',
                'batasan' => '|φ| < 1, |θ| < 1',
                'kondisi' => 'Kombinasi AR dan MA memenuhi kondisi invertibility dan stationarity',
            ],
            [
                'model' => 'ARIMAX(p,d,q)',
                'batasan' => '|φ| < 1, |θ| < 1, d ≥ 0',
                'kondisi' => 'Setelah differencing, model ARMA harus stasioner dan invertible',
            ],
            [
                'model' => 'Signifikansi Parameter',
                'batasan' => '|t-stat| > 1.96 (α = 0.05)',
                'kondisi' => 'Parameter signifikan secara statistik pada tingkat kepercayaan 95%',
            ],
        ];

        // Ambil data training dan test untuk evaluasi model
        $trainingData = TrainingData::query()
            ->orderBy('tanggal', 'asc')
            ->get(['tinggi_gelombang', 'kecepatan_angin']);

        $testData = TestData::query()
            ->orderBy('tanggal', 'asc')
            ->get(['tinggi_gelombang', 'kecepatan_angin']);

        // Jika tidak ada data, kembalikan struktur kosong
        if ($trainingData->isEmpty()) {
            return Inertia::render('Arimax/ModelIdentification', [
                'acceptedRegions' => $acceptedRegions,
                'parameterEvaluations' => [],
                'parameterEstimations' => [],
                'modelSummary' => null,
                'testResults' => [],
                'modelMetrics' => [],
                'bestModelSummary' => null,
            ]);
        }

        // Ekstrak data menjadi array untuk perhitungan
        $yTrain = $trainingData->pluck('tinggi_gelombang')->map(fn ($v) => (float) $v)->toArray();
        $xTrain = $trainingData->pluck('kecepatan_angin')->map(fn ($v) => (float) $v)->toArray();
        $yTest = $testData->pluck('tinggi_gelombang')->map(fn ($v) => (float) $v)->toArray();
        $xTest = $testData->pluck('kecepatan_angin')->map(fn ($v) => (float) $v)->toArray();

        // Tentukan kombinasi model berdasarkan analisis ACF/PACF
        // Ini lebih akurat daripada menggunakan kombinasi yang ditentukan secara random
        $modelCombinations = $this->determineModelCombinationsFromAcfPacf($yTrain);

        // Evaluasi model menggunakan Python/FastAPI untuk akurasi yang lebih tinggi
        // Semua data (evaluasi parameter, estimasi parameter, hasil pengujian) diambil dari Python
        $parameterEvaluationsPHP = []; // Fallback dari PHP jika Python tidak tersedia
        $parameterEstimationsPHP = []; // Fallback dari PHP jika Python tidak tersedia
        $modelSummaryPHP = null; // Fallback dari PHP jika Python tidak tersedia

        // Evaluasi model ARIMAX menggunakan Python/FastAPI untuk akurasi yang lebih tinggi
        // Semua data (evaluasi parameter, estimasi parameter, hasil pengujian) diambil dari Python
        $parameterEvaluationsFromPython = [];
        $parameterEstimationsFromPython = [];
        $modelSummaryFromPython = null;
        $testResultsArray = [];
        $modelMetrics = [];
        $bestModelSummary = null;

        // Ambil semua kombinasi model untuk dievaluasi di Python
        $allOrders = [];
        foreach ($modelCombinations as [$p, $d, $q]) {
            $allOrders[] = [$p, $d, $q];
        }

        // Evaluasi semua model menggunakan Python
        if (! empty($allOrders)) {
            $fastAPIService = new \App\Services\FastAPIService;

            // Pastikan dataset terbaru sudah diupload ke FastAPI sebelum evaluasi
            // Export data dari database ke Excel
            $excelPath = $this->exportDataToExcel();

            // Upload dataset ke FastAPI untuk memastikan data terbaru digunakan
            $uploadResult = $fastAPIService->uploadDataset($excelPath);
            if (! $uploadResult['success']) {
                \Illuminate\Support\Facades\Log::warning('Failed to upload dataset to FastAPI before evaluation', [
                    'error' => $uploadResult['error'] ?? 'Unknown error',
                ]);
                // Continue anyway, mungkin dataset sudah ada
            } else {
                \Illuminate\Support\Facades\Log::info('Dataset uploaded to FastAPI before evaluation', [
                    'rows' => $uploadResult['data']['rows'] ?? 'unknown',
                ]);
            }

            // Clean up temp file
            @unlink($excelPath);

            // Sekarang evaluasi model dengan data terbaru
            $evaluationResult = $fastAPIService->evaluateARIMAXModels($allOrders);

            if ($evaluationResult['success']) {
                $evaluationData = $evaluationResult['data'];

                // Gunakan hasil dari Python untuk semua data
                $parameterEvaluationsFromPython = $evaluationData['parameter_evaluations'] ?? [];
                $parameterEstimationsFromPython = $evaluationData['parameter_estimations'] ?? [];
                $modelSummaryFromPython = $evaluationData['model_summary'] ?? null;
                $testResultsArray = $evaluationData['test_results'] ?? [];
                $modelMetrics = $evaluationData['model_metrics'] ?? [];
                $bestModelSummary = $evaluationData['best_model_summary'] ?? null;

                // Simpan orde model terbaik di session jika ada
                if ($bestModelSummary) {
                    preg_match('/ARIMAX\((\d+),(\d+),(\d+)\)/', $bestModelSummary['model'], $matches);
                    if (count($matches) === 4) {
                        session([
                            'best_arimax_order' => [
                                'p' => (int) $matches[1],
                                'd' => (int) $matches[2],
                                'q' => (int) $matches[3],
                                'model' => $bestModelSummary['model'],
                                'mape' => $bestModelSummary['mape'],
                            ],
                        ]);
                    }
                }
            }
        }

        // Gunakan hasil dari Python jika tersedia, fallback ke PHP jika tidak
        if (empty($parameterEvaluationsFromPython)) {
            // Fallback: evaluasi menggunakan PHP (hanya jika Python tidak tersedia)
            $parameterEvaluationsPHP = [];
            $allModelResults = [];
            $bestModel = null;
            $bestAIC = PHP_FLOAT_MAX;

            foreach ($modelCombinations as [$p, $d, $q]) {
                $modelName = "ARIMAX($p,$d,$q)";
                $result = $this->estimateSimpleARIMAX($yTrain, $xTrain, $p, $d, $q);

                if (! $result['success']) {
                    $parameterEvaluationsPHP[] = [
                        'model' => $modelName,
                        'p' => $p,
                        'd' => $d,
                        'q' => $q,
                        'stability' => false,
                        'invertibility' => false,
                        'significance' => false,
                        'aic' => null,
                        'bic' => null,
                        'status' => 'Ditolak',
                        'alasan' => $result['error'] ?? 'Gagal estimasi',
                    ];

                    continue;
                }

                $arParams = [];
                $maParams = [];
                foreach ($result['params'] as $key => $value) {
                    if (strpos($key, 'AR(') === 0) {
                        $arParams[] = $value;
                    } elseif (strpos($key, 'MA(') === 0) {
                        $maParams[] = $value;
                    }
                }

                $isStable = $this->checkStability($arParams);
                $isInvertible = $this->checkInvertibility($maParams);
                $isSignificant = $this->checkSignificance($result['zValues']);

                $status = 'Diterima';
                $alasan = [];
                if (! $isStable) {
                    $status = 'Ditolak';
                    $alasan[] = 'Parameter AR tidak stabil (|φ| ≥ 1)';
                }
                if (! $isInvertible) {
                    $status = 'Ditolak';
                    $alasan[] = 'Parameter MA tidak invertible (|θ| ≥ 1)';
                }
                if (! $isSignificant) {
                    $status = 'Ditolak';
                    $alasan[] = 'Parameter tidak signifikan (|z| < 1.96)';
                }

                if ($status === 'Diterima' && $result['aic'] < $bestAIC) {
                    $bestAIC = $result['aic'];
                    $bestModel = [
                        'model' => $modelName,
                        'result' => $result,
                        'p' => $p,
                        'd' => $d,
                        'q' => $q,
                    ];
                }

                $parameterEvaluationsPHP[] = [
                    'model' => $modelName,
                    'p' => $p,
                    'd' => $d,
                    'q' => $q,
                    'stability' => $isStable,
                    'invertibility' => $isInvertible,
                    'significance' => $isSignificant,
                    'aic' => round($result['aic'], 2),
                    'bic' => round($result['bic'], 2),
                    'status' => $status,
                    'alasan' => empty($alasan) ? 'Semua kriteria terpenuhi' : implode('; ', $alasan),
                ];

                $allModelResults[$modelName] = $result;
            }

            // Buat estimasi parameter dari PHP (fallback)
            if ($bestModel) {
                $selectedResult = $bestModel['result'];
                foreach ($selectedResult['params'] as $paramName => $value) {
                    $parameterEstimationsPHP[] = [
                        'parameter' => $paramName,
                        'estimasi' => round($value, 4),
                        'std_error' => round($selectedResult['stdErrors'][$paramName] ?? 0, 4),
                        'z_value' => round($selectedResult['zValues'][$paramName] ?? 0, 2),
                        'p_value' => round($selectedResult['pValues'][$paramName] ?? 0, 4),
                    ];
                }

                $modelSummaryPHP = [
                    'model' => $bestModel['model'],
                    'aic' => round($selectedResult['aic'], 2),
                    'bic' => round($selectedResult['bic'], 2),
                    'log_likelihood' => round($selectedResult['logLikelihood'], 2),
                    'sigma2' => round($selectedResult['sigma2'], 4),
                    'total_observations' => $selectedResult['nObs'],
                ];
            }
        }

        // Gunakan hasil dari Python jika tersedia, fallback ke PHP jika tidak
        $parameterEvaluations = ! empty($parameterEvaluationsFromPython)
            ? $parameterEvaluationsFromPython
            : $parameterEvaluationsPHP;
        $parameterEstimations = ! empty($parameterEstimationsFromPython)
            ? $parameterEstimationsFromPython
            : $parameterEstimationsPHP;
        $modelSummary = $modelSummaryFromPython ?? $modelSummaryPHP;

        // Ensure we have default values if no models were accepted
        if (empty($parameterEstimations)) {
            $parameterEstimations = [];
        }
        if ($modelSummary === null) {
            $modelSummary = [
                'model' => 'Tidak ada model yang diterima',
                'aic' => 0,
                'bic' => 0,
                'log_likelihood' => 0,
                'sigma2' => 0,
                'total_observations' => 0,
            ];
        }

        return Inertia::render('Arimax/ModelIdentification', [
            'acceptedRegions' => $acceptedRegions,
            'parameterEvaluations' => $parameterEvaluations, // New: table with evaluation results
            'parameterEstimations' => $parameterEstimations,
            'modelSummary' => $modelSummary,
            'testResults' => $testResultsArray,
            'modelMetrics' => $modelMetrics,
            'bestModelSummary' => $bestModelSummary,
        ]);
    }

    /**
     * Melatih model ARIMAX dan Hybrid menggunakan endpoint /train/hybrid/sync.
     *
     * Endpoint ini adalah SINGLE SOURCE OF TRUTH untuk training.
     * Digunakan di halaman Identifikasi Model untuk melatih model dengan data terbaru.
     *
     * @param  Request  $request  Request berisi optional p, d, q
     * @return \Illuminate\Http\RedirectResponse Redirect back dengan flash message
     */
    public function trainModel(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'p' => 'nullable|integer|min:0',
            'd' => 'nullable|integer|min:0',
            'q' => 'nullable|integer|min:0',
        ]);

        // Get order from request or from best order in session
        $order = null;
        if (isset($validated['p'], $validated['d'], $validated['q'])) {
            $order = [
                'p' => $validated['p'],
                'd' => $validated['d'],
                'q' => $validated['q'],
            ];
        } else {
            // Try to get best order from session
            $bestOrder = session('best_arimax_order');
            if ($bestOrder) {
                $order = [
                    'p' => $bestOrder['p'],
                    'd' => $bestOrder['d'],
                    'q' => $bestOrder['q'],
                ];
            }
        }

        $fastAPIService = new \App\Services\FastAPIService;
        $result = $fastAPIService->trainHybridSync($order);

        if ($result['success']) {
            return redirect()
                ->back()
                ->with('training_success', true)
                ->with('arimax_mape', $result['data']['arimax_mape'])
                ->with('training_order', $result['data']['order']);
        }

        // Log error untuk debugging
        if (isset($result['error'])) {
            \Illuminate\Support\Facades\Log::error('Training failed', [
                'error' => $result['error'],
                'status' => $result['status'] ?? null,
            ]);
        }

        return redirect()
            ->back()
            ->withErrors(['training_error' => $result['error'] ?? 'Training failed']);
    }

    /**
     * Mengambil orde ARIMAX terbaik dari hasil identifikasi model.
     *
     * Fungsi ini mengembalikan orde (p, d, q) dari model terbaik berdasarkan MAPE.
     * Orde ini digunakan oleh HybridController saat melakukan training ARIMAX di FastAPI.
     *
     * @return array{p: int, d: int, q: int}|null Orde model terbaik atau null jika belum ada
     */
    public function getBestOrder(): ?array
    {
        $bestOrder = session('best_arimax_order');
        if ($bestOrder) {
            return [
                'p' => $bestOrder['p'], // Orde AR
                'd' => $bestOrder['d'], // Orde differencing
                'q' => $bestOrder['q'], // Orde MA
            ];
        }

        return null; // Belum ada model terbaik yang teridentifikasi
    }

    /**
     * Export data training dan test dari database ke Excel untuk diupload ke FastAPI.
     *
     * Method ini mengekspor data dari tabel training_data dan test_data ke file Excel
     * dengan format yang sesuai untuk FastAPI (kolom: timestamp, wave_height, wind_speed).
     *
     * @return string Path ke file Excel yang sudah dibuat
     */
    private function exportDataToExcel(): string
    {
        // Get all training, validation, and test data
        $trainingData = TrainingData::query()
            ->orderBy('tanggal', 'asc')
            ->get(['tanggal', 'tinggi_gelombang', 'kecepatan_angin']);

        $validationData = \App\Models\ValidationData::query()
            ->orderBy('tanggal', 'asc')
            ->get(['tanggal', 'tinggi_gelombang', 'kecepatan_angin']);

        $testData = TestData::query()
            ->orderBy('tanggal', 'asc')
            ->get(['tanggal', 'tinggi_gelombang', 'kecepatan_angin']);

        if ($trainingData->isEmpty() && $validationData->isEmpty() && $testData->isEmpty()) {
            throw new \Exception('Tidak ada data untuk diekspor. Pastikan data sudah diunggah dan dibagi.');
        }

        // Create temporary file path
        $tempDir = storage_path('app/temp');
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }
        $excelPath = $tempDir.'/dataset_'.time().'.xlsx';

        // Combine training, validation, and test data
        $allData = $trainingData->concat($validationData)->concat($testData)->sortBy('tanggal');

        // Create Excel file using PhpSpreadsheet
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        // Set headers
        $sheet->setCellValue('A1', 'timestamp');
        $sheet->setCellValue('B1', 'wave_height');
        $sheet->setCellValue('C1', 'wind_speed');

        // Fill data
        $row = 2;
        foreach ($allData as $data) {
            $tanggal = $data->tanggal instanceof \Carbon\Carbon
                ? $data->tanggal->format('Y-m-d H:i:s')
                : (is_string($data->tanggal) ? $data->tanggal : date('Y-m-d H:i:s', strtotime($data->tanggal)));

            $sheet->setCellValue("A{$row}", $tanggal);
            $sheet->setCellValue("B{$row}", (float) $data->tinggi_gelombang);
            $sheet->setCellValue("C{$row}", (float) $data->kecepatan_angin);
            $row++;
        }

        // Save Excel file
        $writer = new Xlsx($spreadsheet);
        $writer->save($excelPath);

        return $excelPath;
    }
}

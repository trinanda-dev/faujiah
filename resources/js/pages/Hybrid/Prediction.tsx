/**
 * Komponen Halaman Prediksi Hybrid
 * 
 * Halaman ini digunakan untuk menghasilkan dan menampilkan prediksi tinggi gelombang
 * menggunakan model Hybrid ARIMAX-LSTM pada data uji (15% dari dataset).
 * 
 * Proses prediksi meliputi:
 * 1. Fit model ARIMAX pada data latih
 * 2. Hitung residual dari ARIMAX pada data latih
 * 3. Latih LSTM pada residual yang dinormalisasi
 * 4. Prediksi ARIMAX pada data uji
 * 5. Prediksi residual secara iteratif menggunakan LSTM
 * 6. Kombinasikan prediksi ARIMAX + residual LSTM = prediksi Hybrid
 * 
 * Fitur utama:
 * - Generate prediksi Hybrid ARIMAX-LSTM
 * - Menampilkan hasil prediksi dengan nilai aktual, prediksi ARIMAX, residual LSTM, dan prediksi Hybrid
 * - Menampilkan metrik MAPE untuk setiap prediksi dan MAPE keseluruhan
 */

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Brain, CheckCircle2, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { type FormEventHandler, useEffect } from 'react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { LoadingOverlay } from '@/components/loading-overlay';
import { TableSkeleton } from '@/components/table-skeleton';
import { useNavigationState } from '@/hooks/use-navigation-state';

// Breadcrumb untuk navigasi halaman
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Prediksi Hybrid',
        href: '#',
    },
];

/**
 * Interface untuk hasil prediksi hybrid
 */
interface HybridPrediction {
    nomor: number; // Nomor urut prediksi
    tanggal: string; // Tanggal dan waktu observasi
    tinggi_gelombang_aktual: number; // Nilai aktual tinggi gelombang dari data uji
    tinggi_gelombang_arimax: number; // Prediksi tinggi gelombang dari model ARIMAX
    residual_lstm: number; // Prediksi residual dari model LSTM
    tinggi_gelombang_hybrid: number; // Prediksi tinggi gelombang final dari model Hybrid (ARIMAX + residual LSTM)
    mape: number | null; // Mean Absolute Percentage Error untuk prediksi ini (opsional)
}

/**
 * Interface untuk metrik keseluruhan
 */
interface OverallMetrics {
    mape: number; // MAPE keseluruhan dari semua prediksi
}

/**
 * Props yang diterima oleh komponen HybridPrediction
 */
interface Props {
    predictions: HybridPrediction[]; // Array hasil prediksi hybrid
    totalData: number; // Total jumlah prediksi
    overallMetrics: OverallMetrics | null; // Metrik keseluruhan (MAPE)
}

/**
 * Komponen utama untuk halaman Prediksi Hybrid
 */
export default function HybridPrediction({ predictions, totalData, overallMetrics }: Props) {
    /**
     * Hook useForm dari Inertia untuk menangani form submission.
     * Digunakan untuk trigger generate prediksi.
     */
    const { post, processing } = useForm({});
    
    /**
     * Hook untuk mendeteksi apakah sedang ada navigasi atau proses yang berjalan
     */
    const isNavigating = useNavigationState();
    
    /**
     * State untuk menentukan apakah data sedang dimuat
     */
    const isLoading = isNavigating || processing;
    
    /**
     * Mengambil flash messages dan errors dari page props.
     * Flash messages digunakan untuk menampilkan pesan sukses/error setelah operasi.
     */
    const { flash, errors } = usePage().props as { flash?: { success?: string; error?: string }; errors?: Record<string, string> };

    /**
     * Handler untuk generate prediksi Hybrid.
     * Mengirim POST request ke endpoint /hybrid/prediction untuk memulai proses training dan prediksi.
     * Setelah berhasil, reload halaman untuk menampilkan hasil prediksi terbaru.
     * 
     * @param e - Event submit form
     */
    const handleGeneratePredictions: FormEventHandler = (e) => {
        e.preventDefault();
        post('/hybrid/prediction', {
            preserveScroll: true, // Pertahankan posisi scroll setelah submit
            onSuccess: () => {
                // Reload halaman untuk mendapatkan data prediksi terbaru
                router.visit('/hybrid/prediction', {
                    only: ['predictions', 'totalData', 'overallMetrics'], // Hanya reload props yang diperlukan
                    preserveState: false,
                });
            },
            onError: () => {
                // Error akan ditampilkan melalui flash message
            },
        });
    };

    /**
     * Auto-hide success message setelah 5 detik.
     * Menggunakan useEffect untuk mengatur timer yang akan reload halaman setelah 5 detik
     * jika ada flash message sukses.
     */
    useEffect(() => {
        if (flash?.success) {
            const timer = setTimeout(() => {
                router.reload({ only: [] }); // Reload semua props
            }, 5000);
            return () => clearTimeout(timer); // Cleanup timer jika component unmount
        }
    }, [flash?.success]);

    /**
     * Memformat tanggal dan waktu menjadi format Indonesia (DD/MM/YYYY HH:mm:ss).
     * Parse tanggal secara manual untuk menghindari konversi timezone.
     * Mendukung format ISO (YYYY-MM-DDTHH:mm:ss) dan format standar (YYYY-MM-DD HH:mm:ss).
     * 
     * @param dateString - String tanggal yang akan diformat
     * @returns String tanggal yang sudah diformat dalam format Indonesia
     */
    const formatDate = (dateString: string) => {
        // Parse tanggal secara manual untuk menghindari konversi timezone
        let date: Date;
        
        if (dateString.includes('T')) {
            // Format ISO: "2023-01-01T00:00:00.000000Z" atau "2023-01-01T00:00:00"
            const isoString = dateString.replace('Z', '').split('.')[0];
            const [datePart, timePart] = isoString.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute, second] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        } else {
            // Format: "2023-01-01 00:00:00" atau "2023-01-01"
            const parts = dateString.split(' ');
            const [year, month, day] = parts[0].split('-').map(Number);
            const [hour, minute, second] = parts[1] ? parts[1].split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        }
        
        // Format ke locale Indonesia dengan format 24 jam
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false, // Format 24 jam
        });
    };

    /**
     * Memformat angka menjadi format desimal dengan jumlah desimal yang ditentukan.
     * Menampilkan '-' jika nilai null.
     * 
     * @param value - Angka yang akan diformat (atau null)
     * @param decimals - Jumlah desimal (default: 4)
     * @returns String angka yang sudah diformat atau '-'
     */
    const formatNumber = (value: number | null, decimals: number = 4) => {
        if (value === null) {
            return '-';
        }
        return parseFloat(value.toString()).toFixed(decimals);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Prediksi Hybrid" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        Prediksi Hybrid
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Prediksi tinggi gelombang menggunakan model gabungan ARIMAX dan LSTM pada data uji (15% dari dataset)
                    </p>
                </div>

                {/* Success Message */}
                {flash?.success && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-green-900 dark:text-green-200">Berhasil</AlertTitle>
                        <AlertDescription className="text-green-800 dark:text-green-300">
                            {flash.success}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Error Message */}
                {(flash?.error || errors?.error) && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Terjadi Kesalahan</AlertTitle>
                        <AlertDescription>
                            {flash?.error || errors?.error}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Generate Predictions Section */}
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                            Generate Prediksi Hybrid ARIMAX-LSTM
                        </h2>
                        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                            Klik tombol di bawah untuk menghasilkan prediksi menggunakan data uji. Proses ini akan:
                            <br />
                            1. Fit model ARIMAX pada data latih
                            <br />
                            2. Hitung residual dari ARIMAX pada data latih
                            <br />
                            3. Latih LSTM pada residual yang dinormalisasi
                            <br />
                            4. Prediksi ARIMAX pada data uji
                            <br />
                            5. Prediksi residual secara iteratif menggunakan LSTM
                            <br />
                            6. Kombinasikan prediksi ARIMAX + residual LSTM = prediksi Hybrid
                        </p>
                    </div>
                    <form onSubmit={handleGeneratePredictions} className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                    Status Data
                                </p>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                    {totalData > 0
                                        ? `${totalData} prediksi tersedia`
                                        : 'Belum ada prediksi yang dihasilkan'}
                                </p>
                            </div>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                            >
                                {processing ? (
                                    <>
                                        <TrendingUp className="mr-2 h-4 w-4 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="mr-2 h-4 w-4" />
                                        Generate Prediksi
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Overall Metrics */}
                {overallMetrics && (
                    <div className="grid gap-4 md:grid-cols-1">
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-800 dark:bg-blue-900/20">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/40">
                                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-blue-900 dark:text-blue-200">MAPE</p>
                                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">
                                        {overallMetrics.mape.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Table Section */}
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                            Hasil Prediksi Hybrid (ARIMAX + LSTM)
                        </h2>
                    </div>

                    {predictions.length === 0 ? (
                        <div className="p-12 text-center">
                            <Brain className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
                            <p className="mt-4 text-sm font-medium text-neutral-900 dark:text-white">
                                Belum ada hasil prediksi
                            </p>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Klik tombol "Generate Prediksi" untuk menghasilkan prediksi Hybrid ARIMAX-LSTM dari data uji
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            No.
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Tanggal & Waktu
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Nilai Aktual (m)
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Prediksi ARIMAX (m)
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Residual LSTM (m)
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Prediksi Hybrid (m)
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            MAPE (%)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                    {predictions.map((prediction) => (
                                        <tr
                                            key={prediction.nomor}
                                            className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                                                {prediction.nomor}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900 dark:text-white">
                                                {formatDate(prediction.tanggal)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-neutral-900 dark:text-white font-mono">
                                                {formatNumber(prediction.tinggi_gelombang_aktual)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-neutral-900 dark:text-white font-mono">
                                                {formatNumber(prediction.tinggi_gelombang_arimax)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-neutral-900 dark:text-white font-mono">
                                                {formatNumber(prediction.residual_lstm)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400 font-mono">
                                                {formatNumber(prediction.tinggi_gelombang_hybrid)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-neutral-900 dark:text-white font-mono">
                                                {formatNumber(prediction.mape, 2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}


import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Brain, CheckCircle2, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { type FormEventHandler, useEffect } from 'react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

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

interface HybridPrediction {
    nomor: number;
    tanggal: string;
    tinggi_gelombang_aktual: number;
    tinggi_gelombang_arimax: number;
    residual_lstm: number;
    tinggi_gelombang_hybrid: number;
    mape: number | null;
    mae: number | null;
    rmse: number | null;
}

interface OverallMetrics {
    mape: number;
    mae: number;
    rmse: number;
}

interface Props {
    predictions: HybridPrediction[];
    totalData: number;
    overallMetrics: OverallMetrics | null;
}

export default function HybridPrediction({ predictions, totalData, overallMetrics }: Props) {
    const { post, processing } = useForm({});
    const { flash, errors } = usePage().props as { flash?: { success?: string; error?: string }; errors?: Record<string, string> };

    const handleGeneratePredictions: FormEventHandler = (e) => {
        e.preventDefault();
        post('/hybrid/prediction', {
            preserveScroll: true,
            onSuccess: () => {
                // Reload the page to get fresh data
                router.visit('/hybrid/prediction', {
                    only: ['predictions', 'totalData', 'overallMetrics'],
                    preserveState: false,
                });
            },
            onError: () => {
                // Error will be shown via flash message
            },
        });
    };

    // Auto-hide success message after 5 seconds
    useEffect(() => {
        if (flash?.success) {
            const timer = setTimeout(() => {
                router.reload({ only: [] });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    const formatDate = (dateString: string) => {
        // Parse date string manually to avoid timezone conversion
        let date: Date;
        
        if (dateString.includes('T')) {
            const isoString = dateString.replace('Z', '').split('.')[0];
            const [datePart, timePart] = isoString.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute, second] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        } else {
            const parts = dateString.split(' ');
            const [year, month, day] = parts[0].split('-').map(Number);
            const [hour, minute, second] = parts[1] ? parts[1].split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        }
        
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

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
                        Prediksi tinggi gelombang menggunakan model gabungan ARIMAX dan LSTM pada data uji (10% dari dataset)
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
                    <div className="grid gap-4 md:grid-cols-3">
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
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm dark:border-green-800 dark:bg-green-900/20">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/40">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-green-900 dark:text-green-200">MAE</p>
                                    <p className="text-lg font-semibold text-green-900 dark:text-green-200">
                                        {overallMetrics.mae.toFixed(4)} m
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 shadow-sm dark:border-purple-800 dark:bg-purple-900/20">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/40">
                                    <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-purple-900 dark:text-purple-200">RMSE</p>
                                    <p className="text-lg font-semibold text-purple-900 dark:text-purple-200">
                                        {overallMetrics.rmse.toFixed(4)} m
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
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            MAE (m)
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            RMSE (m)
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
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-neutral-900 dark:text-white font-mono">
                                                {formatNumber(prediction.mae)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-neutral-900 dark:text-white font-mono">
                                                {formatNumber(prediction.rmse)}
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


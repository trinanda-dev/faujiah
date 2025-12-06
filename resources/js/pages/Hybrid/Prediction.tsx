import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Head, useForm } from '@inertiajs/react';
import { Brain, TrendingUp } from 'lucide-react';
import { type FormEventHandler } from 'react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Prediksi Hybrid',
    },
];

interface HybridPrediction {
    id: number;
    tinggi_gelombang: string;
    kecepatan_angin: string;
    prediksi_arimax: string;
    prediksi_lstm_residual: string;
    prediksi_hybrid: string;
    mape_hybrid: string | null;
    timestamp_prediksi: string;
}

interface Props {
    predictions: HybridPrediction[];
}

export default function HybridPrediction({ predictions }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        tinggi_gelombang: '',
        kecepatan_angin: '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/hybrid/prediction', {
            onSuccess: () => {
                reset();
            },
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatNumber = (value: string | number | null, decimals: number = 2) => {
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
                        Prediksi tinggi gelombang menggunakan model gabungan ARIMAX dan LSTM
                    </p>
                </div>

                {/* Input Form Section */}
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                            Input Nilai Ketinggian Gelombang & Kecepatan Angin
                        </h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label
                                    htmlFor="tinggi_gelombang"
                                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                                >
                                    Input Tinggi Gelombang (M)
                                </label>
                                <Input
                                    id="tinggi_gelombang"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.tinggi_gelombang}
                                    onChange={(e) => setData('tinggi_gelombang', e.target.value)}
                                    placeholder="Masukkan tinggi gelombang"
                                    className="w-full"
                                />
                                {errors.tinggi_gelombang && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errors.tinggi_gelombang}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label
                                    htmlFor="kecepatan_angin"
                                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                                >
                                    Input Kecepatan Angin (M/S)
                                </label>
                                <Input
                                    id="kecepatan_angin"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.kecepatan_angin}
                                    onChange={(e) => setData('kecepatan_angin', e.target.value)}
                                    placeholder="Masukkan kecepatan angin"
                                    className="w-full"
                                />
                                {errors.kecepatan_angin && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errors.kecepatan_angin}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="mt-6">
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
                                        Prediksi Data
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

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
                                Masukkan nilai tinggi gelombang dan kecepatan angin untuk membuat prediksi
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
                                            Timestamp Prediksi
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Prediksi ARIMAX (M)
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Prediksi LSTM Residual (M)
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Prediksi Hybrid (M)
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            MAPE Hybrid (%)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                    {predictions.map((prediction, index) => (
                                        <tr
                                            key={prediction.id}
                                            className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                                                {index + 1}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900 dark:text-white">
                                                {formatDate(prediction.timestamp_prediksi)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-neutral-900 dark:text-white font-mono">
                                                {formatNumber(prediction.prediksi_arimax, 4)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-neutral-900 dark:text-white font-mono">
                                                {formatNumber(prediction.prediksi_lstm_residual, 4)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400 font-mono">
                                                {formatNumber(prediction.prediksi_hybrid, 4)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-neutral-900 dark:text-white font-mono">
                                                {formatNumber(prediction.mape_hybrid, 2)}
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


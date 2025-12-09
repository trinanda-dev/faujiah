import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Calendar, Clock, MapPin, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Prediksi Seminggu ke Depan',
        href: '#',
    },
];

interface ForecastDate {
    date: string;
    day: string;
    datetime: string;
}

interface Prediction {
    tanggal: string;
    hari: string;
    tanggal_format: string;
    prediksi_hybrid: number | null;
    prediksi_arimax: number | null;
    residual_lstm: number | null;
}

interface Props {
    currentDate: string;
    currentTime: string;
    currentDay: string;
    currentDateTime: string;
    timezone: string;
    forecastDates: ForecastDate[];
    predictions: Prediction[];
    hasModels: boolean;
    error: string | null;
    lastWindSpeed: number;
}

export default function WeeklyForecast({
    currentDate,
    currentTime,
    currentDay,
    currentDateTime,
    timezone,
    forecastDates,
    predictions,
    hasModels,
    error,
    lastWindSpeed,
}: Props) {
    // Prepare chart data
    const chartData = predictions.map((pred) => ({
        tanggal: pred.tanggal_format,
        hari: pred.hari,
        prediksi_hybrid: pred.prediksi_hybrid ?? 0,
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Prediksi Seminggu ke Depan" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        Prediksi Ketinggian Gelombang Seminggu ke Depan
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Prediksi ketinggian gelombang laut untuk 7 hari ke depan berdasarkan model Hybrid ARIMAX-LSTM yang telah dilatih
                    </p>
                </div>

                {/* Current Date/Time Info */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/40">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Tanggal Hari Ini</p>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                    {currentDay}, {currentDate}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/40">
                                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Waktu Saat Ini</p>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{currentTime}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/40">
                                <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Zona Waktu</p>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{timezone}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900/20 dark:bg-red-900/10">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-900 dark:text-red-200">Tidak Dapat Memuat Prediksi</p>
                                <p className="mt-1 text-sm text-red-800 dark:text-red-300">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Info */}
                {hasModels && !error && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm dark:border-green-900/20 dark:bg-green-900/10">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-green-900 dark:text-green-200">Model Tersedia</p>
                                <p className="mt-1 text-sm text-green-800 dark:text-green-300">
                                    Prediksi menggunakan model Hybrid ARIMAX-LSTM yang telah dilatih. Kecepatan angin terakhir yang digunakan: {lastWindSpeed.toFixed(2)} m/s
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chart */}
                {hasModels && !error && chartData.length > 0 && (
                    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="mb-4">
                            <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                Grafik Prediksi Ketinggian Gelombang
                            </h2>
                            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                Prediksi untuk 7 hari ke depan dari tanggal {currentDate}
                            </p>
                        </div>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-700" />
                                <XAxis
                                    dataKey="hari"
                                    className="text-xs text-neutral-600 dark:text-neutral-400"
                                    tick={{ fill: 'currentColor' }}
                                />
                                <YAxis
                                    label={{ value: 'Ketinggian Gelombang (m)', angle: -90, position: 'insideLeft' }}
                                    className="text-xs text-neutral-600 dark:text-neutral-400"
                                    tick={{ fill: 'currentColor' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '0.5rem',
                                        padding: '0.5rem',
                                    }}
                                    labelFormatter={(value) => {
                                        const dataPoint = chartData.find((item) => item.hari === value);
                                        return dataPoint ? `${dataPoint.tanggal} (${dataPoint.hari})` : value;
                                    }}
                                    formatter={(value: number) => [`${value.toFixed(4)} m`, 'Prediksi Hybrid']}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="prediksi_hybrid"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name="Prediksi Hybrid"
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Table */}
                {hasModels && !error && predictions.length > 0 && (
                    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                            <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                Tabel Prediksi Ketinggian Gelombang
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Hari
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Prediksi Hybrid (m)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                    {predictions.map((pred, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                        >
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                                    {pred.hari}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className="text-sm text-neutral-900 dark:text-white">
                                                    {pred.tanggal_format}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right">
                                                <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                                                    {pred.prediksi_hybrid !== null ? pred.prediksi_hybrid.toFixed(4) : '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!hasModels && !error && (
                    <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <TrendingUp className="mx-auto h-12 w-12 text-neutral-400" />
                        <h3 className="mt-4 text-sm font-medium text-neutral-900 dark:text-white">
                            Model Belum Tersedia
                        </h3>
                        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                            Silakan lakukan training model terlebih dahulu di halaman Prediksi Hybrid untuk dapat melihat prediksi seminggu ke depan.
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}


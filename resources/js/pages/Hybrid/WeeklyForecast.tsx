/**
 * Komponen Halaman Prediksi Satu Bulan ke Depan
 * 
 * Halaman ini menampilkan prediksi ketinggian gelombang untuk 30 hari (1 bulan) ke depan
 * berdasarkan model Hybrid ARIMAX-LSTM yang telah dilatih.
 * 
 * Prediksi dilakukan per 12 jam (2 kali per hari) untuk 30 hari ke depan,
 * menghasilkan total 60 prediksi. Setiap prediksi menggunakan kecepatan angin
 * terakhir yang tersedia dari data latih.
 * 
 * Fitur utama:
 * - Menampilkan tanggal, waktu, dan zona waktu saat ini
 * - Grafik prediksi ketinggian gelombang untuk 30 hari ke depan (per 12 jam)
 * - Tabel prediksi dengan detail tanggal, waktu, dan nilai prediksi
 * - Validasi ketersediaan model sebelum menampilkan prediksi
 */

import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Calendar, Clock, MapPin, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LoadingOverlay } from '@/components/loading-overlay';
import { TableSkeleton } from '@/components/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigationState } from '@/hooks/use-navigation-state';

// Breadcrumb untuk navigasi halaman
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Prediksi Satu Bulan ke Depan',
        href: '#',
    },
];

/**
 * Interface untuk tanggal prediksi
 */
interface ForecastDate {
    date: string; // Tanggal dalam format string
    day: string; // Nama hari (Senin, Selasa, dll)
    datetime: string; // Tanggal dan waktu lengkap
}

/**
 * Interface untuk hasil prediksi
 */
interface Prediction {
    tanggal: string; // Tanggal dalam format string
    hari: string; // Nama hari (Senin, Selasa, dll)
    tanggal_format: string; // Tanggal yang sudah diformat untuk ditampilkan
    prediksi_hybrid: number | null; // Prediksi tinggi gelombang dari model Hybrid
    prediksi_arimax: number | null; // Prediksi tinggi gelombang dari model ARIMAX (opsional)
    residual_lstm: number | null; // Prediksi residual dari model LSTM (opsional)
}

/**
 * Props yang diterima oleh komponen WeeklyForecast
 */
interface Props {
    currentDate: string; // Tanggal hari ini (format: DD/MM/YYYY)
    currentTime: string; // Waktu saat ini (format: HH:mm:ss)
    currentDay: string; // Nama hari ini (Senin, Selasa, dll)
    currentDateTime: string; // Tanggal dan waktu lengkap saat ini
    timezone: string; // Zona waktu (GMT+7)
    forecastDates: ForecastDate[]; // Array tanggal untuk 7 hari ke depan
    predictions: Prediction[]; // Array hasil prediksi untuk 7 hari ke depan
    hasModels: boolean; // Apakah model sudah tersedia (sudah dilatih)
    error: string | null; // Pesan error jika ada
    lastWindSpeed: number; // Kecepatan angin terakhir yang digunakan untuk prediksi
}

/**
 * Komponen utama untuk halaman Prediksi Seminggu ke Depan
 */
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
    /**
     * Menyiapkan data untuk grafik dari array predictions.
     * Mengkonversi prediksi menjadi format yang sesuai untuk Recharts LineChart.
     * Menggunakan nilai 0 jika prediksi_hybrid null.
     */
    const chartData = predictions.map((pred) => ({
        tanggal: pred.tanggal_format, // Tanggal yang sudah diformat
        hari: pred.hari, // Nama hari
        prediksi_hybrid: pred.prediksi_hybrid ?? 0, // Prediksi hybrid (default 0 jika null)
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Prediksi Satu Bulan ke Depan" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        Prediksi Ketinggian Gelombang Satu Bulan ke Depan
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Prediksi ketinggian gelombang laut untuk 30 hari (1 bulan) ke depan (per 12 jam) berdasarkan model Hybrid ARIMAX-LSTM yang telah dilatih
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
                                    Prediksi menggunakan model Hybrid ARIMAX-LSTM yang telah dilatih. Prediksi dilakukan per 12 jam untuk 30 hari (1 bulan) ke depan (total 60 prediksi). Kecepatan angin terakhir yang digunakan: {lastWindSpeed.toFixed(2)} m/s
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
                                Prediksi untuk 30 hari (1 bulan) ke depan (per 12 jam) dari tanggal {currentDate} - Total 60 prediksi
                            </p>
                        </div>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-700" />
                                <XAxis
                                    dataKey="tanggal"
                                    className="text-xs text-neutral-600 dark:text-neutral-400"
                                    tick={{ fill: 'currentColor' }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    interval="preserveStartEnd"
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
                                        const dataPoint = chartData.find((item) => item.tanggal === value);
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
                                            Tanggal & Waktu
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
                            Silakan lakukan training model terlebih dahulu di halaman Prediksi Hybrid untuk dapat melihat prediksi satu bulan ke depan (per 12 jam).
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
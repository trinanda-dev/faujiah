/**
 * Komponen Halaman Prediksi Satu Bulan ke Depan
 * 
 * Halaman ini menampilkan prediksi ketinggian gelombang untuk 30 hari (1 bulan) ke depan
 * berdasarkan model Hybrid ARIMAX-LSTM yang telah dilatih.
 * 
 * Fitur:
 * - Tab 1: Prediksi Otomatis - menggunakan tanggal setelah data terakhir dan kecepatan angin terakhir
 * - Tab 2: Prediksi Manual - user dapat memilih tanggal dan input kecepatan angin sendiri
 * 
 * Prediksi dilakukan per 12 jam (2 kali per hari).
 */

import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { TrendingUp, AlertCircle, CheckCircle2, Calendar, Wind } from 'lucide-react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LoadingOverlay } from '@/components/loading-overlay';
import { TableSkeleton } from '@/components/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigationState } from '@/hooks/use-navigation-state';
import { useState, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    currentDate: string; // Tanggal hari ini (format: DD/MM/YYYY) - tidak digunakan di UI
    currentTime: string; // Waktu saat ini (format: HH:mm:ss) - tidak digunakan di UI
    currentDay: string; // Nama hari ini (Senin, Selasa, dll) - tidak digunakan di UI
    currentDateTime: string; // Tanggal dan waktu lengkap saat ini - tidak digunakan di UI
    timezone: string; // Zona waktu (GMT+7) - tidak digunakan di UI
    forecastDates: ForecastDate[]; // Array tanggal untuk prediksi 30 hari ke depan
    predictions: Prediction[]; // Array hasil prediksi untuk 30 hari ke depan
    hasModels: boolean; // Apakah model sudah tersedia (sudah dilatih)
    error: string | null; // Pesan error jika ada
    lastWindSpeed: number; // Kecepatan angin terakhir yang digunakan untuk prediksi
    lastDataDate: string | null; // Tanggal data terakhir (untuk validasi prediksi manual)
    activeTab?: 'auto' | 'manual'; // Tab yang aktif (dari server)
}

/**
 * Komponen utama untuk halaman Prediksi Satu Bulan ke Depan
 */
export default function WeeklyForecast({
    currentDate: _currentDate,
    currentTime: _currentTime,
    currentDay: _currentDay,
    currentDateTime: _currentDateTime,
    timezone: _timezone,
    forecastDates,
    predictions,
    hasModels,
    error,
    lastWindSpeed,
    lastDataDate,
    activeTab: initialActiveTab = 'auto',
}: Props) {
    const isNavigating = useNavigationState();
    const [activeTab, setActiveTab] = useState<'auto' | 'manual'>(initialActiveTab);
    
    // Update activeTab ketika props berubah (setelah submit form)
    useEffect(() => {
        setActiveTab(initialActiveTab);
    }, [initialActiveTab]);
    
    // Helper functions untuk default dates (untuk prediksi manual)
    // Prediksi manual bisa diatur tanggalnya, tidak fixed seperti otomatis
    const getDefaultStartDate = () => {
        // Default: 1 Januari 2025 (sama seperti prediksi otomatis untuk konsistensi)
        return '2025-01-01';
    };

    const getDefaultEndDate = () => {
        // Default: 31 Januari 2025 (30 hari dari 1 Januari)
        return '2025-01-31';
    };
    
    // State untuk prediksi manual - inisialisasi dengan default values
    const [startDate, setStartDate] = useState(getDefaultStartDate());
    const [endDate, setEndDate] = useState(getDefaultEndDate());
    const [windSpeed, setWindSpeed] = useState(lastWindSpeed.toFixed(2));
    const [isGenerating, setIsGenerating] = useState(false);
    const [manualError, setManualError] = useState<string | null>(null);

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

    /**
     * Handle form submit untuk prediksi manual
     */
    const handleManualSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setManualError(null);
        setIsGenerating(true);

        try {
            // Ambil nilai dari form (bukan hanya state, karena bisa ada default value)
            const form = e.currentTarget;
            const formData = new FormData(form);
            const formStartDate = (formData.get('start_date') as string) || startDate || getDefaultStartDate();
            const formEndDate = (formData.get('end_date') as string) || endDate || getDefaultEndDate();
            const formWindSpeed = (formData.get('wind_speed') as string) || windSpeed || lastWindSpeed.toFixed(2);

            // Validasi input
            if (!formStartDate || !formEndDate || !formWindSpeed) {
                setManualError('Semua field harus diisi');
                setIsGenerating(false);
                return;
            }

            const start = new Date(formStartDate);
            const end = new Date(formEndDate);
            
            // Handle format desimal: ganti koma dengan titik untuk parseFloat
            const windSpeedNormalized = formWindSpeed.replace(',', '.');
            const windSpeedValue = parseFloat(windSpeedNormalized);

            if (isNaN(windSpeedValue) || windSpeedValue < 0) {
                setManualError('Kecepatan angin harus berupa angka positif (gunakan titik atau koma untuk desimal)');
                setIsGenerating(false);
                return;
            }

            if (start >= end) {
                setManualError('Tanggal mulai harus sebelum tanggal akhir');
                setIsGenerating(false);
                return;
            }

            // Hitung jumlah hari
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const nSteps = diffDays * 2; // 2 prediksi per hari (per 12 jam)

            if (nSteps > 120) {
                setManualError('Maksimal 60 hari (120 prediksi)');
                setIsGenerating(false);
                return;
            }

            // Redirect ke route yang akan handle prediksi manual
            router.post('/hybrid/manual-forecast', {
                start_date: formStartDate,
                end_date: formEndDate,
                wind_speed: windSpeedValue,
            }, {
                preserveState: false,
                preserveScroll: true,
                onError: (errors) => {
                    setManualError(errors.error || 'Terjadi kesalahan saat menghasilkan prediksi');
                    setIsGenerating(false);
                },
                onFinish: () => {
                    setIsGenerating(false);
                },
            });
        } catch (err) {
            setManualError('Terjadi kesalahan: ' + (err instanceof Error ? err.message : 'Unknown error'));
            setIsGenerating(false);
        }
    };

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
                        Prediksi ketinggian gelombang laut berdasarkan model Hybrid ARIMAX-LSTM yang telah dilatih. Pilih antara prediksi otomatis atau manual.
                    </p>
                </div>

                {/* Tabs */}
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b border-neutral-200 dark:border-neutral-800">
                        <div className="flex">
                            <button
                                type="button"
                                onClick={() => setActiveTab('auto')}
                                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                                    activeTab === 'auto'
                                        ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                                }`}
                            >
                                Prediksi Otomatis
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('manual')}
                                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                                    activeTab === 'manual'
                                        ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                                }`}
                            >
                                Prediksi Manual
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Tab Content: Prediksi Otomatis */}
                        {activeTab === 'auto' && (
                            <div className="space-y-6">
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
                                    Prediksi menggunakan model Hybrid ARIMAX-LSTM yang telah dilatih. Prediksi FIXED untuk periode 1-31 Januari 2025 (per 12 jam, total 60 prediksi). Kecepatan angin terakhir yang digunakan: {lastWindSpeed.toFixed(2)} m/s
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
                                                Prediksi FIXED untuk periode 1-31 Januari 2025 (per 12 jam) - Total 60 prediksi
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
                        )}

                        {/* Tab Content: Prediksi Manual */}
                        {activeTab === 'manual' && (
                            <div className="space-y-6">
                                {!hasModels ? (
                                    <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                        <TrendingUp className="mx-auto h-12 w-12 text-neutral-400" />
                                        <h3 className="mt-4 text-sm font-medium text-neutral-900 dark:text-white">
                                            Model Belum Tersedia
                                        </h3>
                                        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                                            Silakan lakukan training model terlebih dahulu di halaman Prediksi Hybrid.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Form Prediksi Manual */}
                                        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                            <h2 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
                                                Form Prediksi Manual
                                            </h2>
                                            <form onSubmit={handleManualSubmit} className="space-y-4">
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="start_date" className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4" />
                                                            Tanggal Mulai
                                                        </Label>
                                                        <Input
                                                            id="start_date"
                                                            name="start_date"
                                                            type="date"
                                                            value={startDate}
                                                            onChange={(e) => setStartDate(e.target.value)}
                                                            required
                                                            className="w-full"
                                                        />
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                            Pilih tanggal mulai prediksi
                                                        </p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="end_date" className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4" />
                                                            Tanggal Akhir
                                                        </Label>
                                                        <Input
                                                            id="end_date"
                                                            name="end_date"
                                                            type="date"
                                                            value={endDate}
                                                            onChange={(e) => setEndDate(e.target.value)}
                                                            required
                                                            min={startDate}
                                                            className="w-full"
                                                        />
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                            Pilih tanggal akhir prediksi (maksimal 60 hari)
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="wind_speed" className="flex items-center gap-2">
                                                        <Wind className="h-4 w-4" />
                                                        Kecepatan Angin (m/s)
                                                    </Label>
                                                    <Input
                                                        id="wind_speed"
                                                        name="wind_speed"
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={windSpeed}
                                                        onChange={(e) => {
                                                            // Allow both comma and dot as decimal separator
                                                            const value = e.target.value.replace(/[^0-9,.]/g, '');
                                                            setWindSpeed(value);
                                                        }}
                                                        required
                                                        placeholder={lastWindSpeed.toFixed(2)}
                                                        className="w-full"
                                                    />
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        Masukkan kecepatan angin yang akan digunakan untuk semua prediksi (dalam m/s)
                                                    </p>
                                                </div>

                                                {manualError && (
                                                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/20 dark:bg-red-900/10">
                                                        <p className="text-sm text-red-800 dark:text-red-300">{manualError}</p>
                                                    </div>
                                                )}

                                                <Button
                                                    type="submit"
                                                    disabled={isGenerating || isNavigating}
                                                    className="w-full"
                                                >
                                                    {isGenerating ? 'Membuat Prediksi...' : 'Buat Prediksi'}
                                                </Button>
                                            </form>
                                        </div>

                                        {/* Hasil Prediksi Manual (akan muncul setelah submit) */}
                                        {predictions.length > 0 && activeTab === 'manual' && (
                                            <>
                                                {/* Chart */}
                                                {chartData.length > 0 && (
                                                    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                                        <div className="mb-4">
                                                            <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                                                Grafik Prediksi Ketinggian Gelombang
                                                            </h2>
                                                            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                                                Prediksi manual untuk periode yang dipilih (per 12 jam)
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
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Loading Overlay */}
                <LoadingOverlay show={isNavigating || isGenerating} message={isGenerating ? 'Membuat prediksi...' : 'Memuat...'} />
            </div>
        </AppLayout>
    );
}

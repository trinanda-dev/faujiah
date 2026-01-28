/**
 * Komponen Halaman Prediksi Manual
 * 
 * Halaman ini menampilkan form untuk prediksi ketinggian gelombang berdasarkan model Hybrid ARIMAX-LSTM yang telah dilatih.
 * 
 * Fitur:
 * - Prediksi Manual - user dapat memilih tanggal dan input kecepatan angin sendiri
 * 
 * Prediksi dilakukan per 12 jam (2 kali per hari).
 */

import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
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
}: Props) {
    const isNavigating = useNavigationState();
    const page = usePage();

    // Handle errors from session (from backend redirect)
    useEffect(() => {
        // Access errors safely from page props
        // Using 'as any' to avoid TypeScript type issues with Inertia's error bag
        const pageProps = page.props as any;
        const pageErrors = pageProps?.errors;
        
        if (pageErrors && typeof pageErrors === 'object' && Object.keys(pageErrors).length > 0) {
            // Get first error message
            const firstErrorKey = Object.keys(pageErrors)[0];
            const firstError = pageErrors[firstErrorKey];
            
            if (Array.isArray(firstError) && firstError.length > 0) {
                setManualError(firstError[0]);
            } else if (typeof firstError === 'string') {
                setManualError(firstError);
            }
        }
    }, [page]);
    
    // Helper functions untuk default dates (untuk prediksi manual)
    // Default: mulai dari hari ini, sampai 30 hari ke depan
    const getDefaultStartDate = () => {
        // Default: hari ini
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.toISOString().split('T')[0];
    };

    const getDefaultEndDate = () => {
        // Default: 30 hari dari hari ini
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 30);
        return endDate.toISOString().split('T')[0];
    };
    
    // State untuk prediksi manual - inisialisasi dengan default values
    const [startDate, setStartDate] = useState(getDefaultStartDate());
    const [endDate, setEndDate] = useState(getDefaultEndDate());
    const [windSpeedMode, setWindSpeedMode] = useState<'constant' | 'time-varying'>('constant');
    const [windSpeed, setWindSpeed] = useState(lastWindSpeed.toFixed(2));
    const [windSpeedArray, setWindSpeedArray] = useState<Array<{ timestamp: string; value: string }>>([]);
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
     * Generate forecast timestamps untuk time-varying mode
     * Menghasilkan timestamps per 12 jam (00:00 dan 12:00) dari start date sampai end date
     */
    const generateForecastTimestamps = (start: string, end: string): Array<{ timestamp: string; datetime: string }> => {
        // Parse dates (format: YYYY-MM-DD)
        const startDate = new Date(start + 'T00:00:00');
        const endDate = new Date(end + 'T23:59:59');
        
        // Set start date ke 00:00
        startDate.setHours(0, 0, 0, 0);
        // Set end date ke 23:59:59 untuk include seluruh hari
        endDate.setHours(23, 59, 59, 999);
        
        const timestamps: Array<{ timestamp: string; datetime: string }> = [];
        const current = new Date(startDate);
        
        // Generate timestamps per 12 jam sampai endDate (sama dengan backend)
        // Mulai dari 00:00 tanggal mulai, lalu 12:00 tanggal mulai, dst
        while (current <= endDate) {
            const dateStr = current.toISOString().split('T')[0];
            const hour = current.getHours();
            
            // Hanya tambahkan jika waktu adalah 00:00 atau 12:00
            if (hour === 0 || hour === 12) {
                timestamps.push({
                    timestamp: `${dateStr}T${hour.toString().padStart(2, '0')}:00:00`,
                    datetime: current.toLocaleString('id-ID', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                });
            }
            
            // Tambah 12 jam untuk next timestamp
            current.setHours(current.getHours() + 12);
        }
        
        return timestamps;
    };

    /**
     * Update wind speed array ketika tanggal berubah (untuk time-varying mode)
     */
    useEffect(() => {
        if (windSpeedMode === 'time-varying' && startDate && endDate) {
            const timestamps = generateForecastTimestamps(startDate, endDate);
            // Initialize dengan nilai terakhir atau default
            const defaultWindSpeed = lastWindSpeed.toFixed(2);
            setWindSpeedArray(
                timestamps.map((ts) => ({
                    timestamp: ts.timestamp,
                    value: defaultWindSpeed,
                }))
            );
        }
    }, [startDate, endDate, windSpeedMode, lastWindSpeed]);

    /**
     * Handle form submit untuk prediksi manual
     */
    const handleManualSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setManualError(null);
        setIsGenerating(true);

        try {
            // Ambil nilai dari form
            const form = e.currentTarget;
            const formData = new FormData(form);
            const formStartDate = (formData.get('start_date') as string) || startDate || getDefaultStartDate();
            const formEndDate = (formData.get('end_date') as string) || endDate || getDefaultEndDate();

            // Validasi input
            if (!formStartDate || !formEndDate) {
                setManualError('Tanggal mulai dan akhir harus diisi');
                setIsGenerating(false);
                return;
            }

            const start = new Date(formStartDate);
            const end = new Date(formEndDate);

            if (start >= end) {
                setManualError('Tanggal mulai harus sebelum tanggal akhir');
                setIsGenerating(false);
                return;
            }

            // Hitung jumlah hari dan time steps
            // Gunakan perhitungan yang sama dengan backend untuk konsistensi
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 untuk include start dan end
            
            // Generate timestamps untuk menghitung nSteps yang akurat (sama dengan backend)
            const timestamps = generateForecastTimestamps(formStartDate, formEndDate);
            const nSteps = timestamps.length; // Gunakan jumlah timestamps yang di-generate

            // Validasi dan prepare wind speed data
            let windSpeedData: number[] = [];

            if (windSpeedMode === 'constant') {
                const formWindSpeed = (formData.get('wind_speed') as string) || windSpeed || lastWindSpeed.toFixed(2);
                
                if (!formWindSpeed) {
                    setManualError('Kecepatan angin harus diisi');
                    setIsGenerating(false);
                    return;
                }

                // Handle format desimal: ganti koma dengan titik untuk parseFloat
                const windSpeedNormalized = formWindSpeed.replace(',', '.');
                const windSpeedValue = parseFloat(windSpeedNormalized);

                if (isNaN(windSpeedValue) || windSpeedValue < 0) {
                    setManualError('Kecepatan angin harus berupa angka positif (gunakan titik atau koma untuk desimal)');
                    setIsGenerating(false);
                    return;
                }

                // Replicate untuk semua time steps
                windSpeedData = Array(nSteps).fill(windSpeedValue);
            } else {
                // Time-varying mode
                // Pastikan windSpeedArray sudah terisi (harus di-generate dari timestamps)
                if (!windSpeedArray || windSpeedArray.length === 0) {
                    setManualError('Array kecepatan angin belum terisi. Silakan refresh halaman dan coba lagi.');
                    setIsGenerating(false);
                    return;
                }
                
                if (windSpeedArray.length !== nSteps) {
                    setManualError(`Jumlah input kecepatan angin (${windSpeedArray.length}) harus sesuai dengan jumlah time step (${nSteps} input untuk ${diffDays} hari). Silakan refresh halaman dan coba lagi.`);
                    setIsGenerating(false);
                    return;
                }

                // Validate dan convert semua nilai
                windSpeedData = windSpeedArray.map((item, index) => {
                    // Handle empty string atau null
                    if (!item || !item.value || item.value.trim() === '') {
                        throw new Error(`Nilai kecepatan angin pada time step ${index + 1} tidak boleh kosong`);
                    }
                    
                    const normalized = item.value.replace(',', '.');
                    const value = parseFloat(normalized);
                    
                    if (isNaN(value) || value < 0) {
                        throw new Error(`Nilai kecepatan angin pada time step ${index + 1} tidak valid`);
                    }
                    
                    return value;
                });
            }

            // Debug: Log data yang akan dikirim (untuk debugging)
            if (windSpeedMode === 'time-varying') {
                console.log('Time-varying mode - Data to send:', {
                    start_date: formStartDate,
                    end_date: formEndDate,
                    wind_speed_array_length: windSpeedData.length,
                    nSteps: nSteps,
                    diffDays: diffDays,
                });
            }

            // Redirect ke route yang akan handle prediksi manual
            router.post('/hybrid/manual-forecast', {
                start_date: formStartDate,
                end_date: formEndDate,
                wind_speed_mode: windSpeedMode,
                wind_speed: windSpeedMode === 'constant' ? windSpeedData[0] : null,
                wind_speed_array: windSpeedMode === 'time-varying' ? windSpeedData : null,
            }, {
                preserveState: false,
                preserveScroll: false, // Don't preserve scroll to avoid redirect issues
                onError: (errors) => {
                    // Handle errors without redirecting
                    const errorMessage = errors.error 
                        || (Array.isArray(errors.error) ? errors.error[0] : null)
                        || Object.values(errors)[0]?.[0] // Get first error from first field
                        || 'Terjadi kesalahan saat menghasilkan prediksi';
                    setManualError(errorMessage);
                    setIsGenerating(false);
                },
                onSuccess: () => {
                    // Success - page will reload with new data
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
                        Prediksi Manual Ketinggian Gelombang
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Prediksi ketinggian gelombang laut berdasarkan model Hybrid ARIMAX-LSTM yang telah dilatih. Pilih tanggal dan input kecepatan angin untuk prediksi.
                    </p>
                </div>

                {/* Content */}
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="p-6">
                        {/* Prediksi Manual */}
                        <div className="space-y-6">
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
                                                            onChange={(e) => {
                                                                setStartDate(e.target.value);
                                                                // Pastikan tanggal akhir tidak lebih kecil dari tanggal mulai
                                                                const newStart = e.target.value;
                                                                if (endDate < newStart) {
                                                                    setEndDate(newStart);
                                                                }
                                                            }}
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
                                                            Pilih tanggal akhir prediksi
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Mode Input Kecepatan Angin */}
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="flex items-center gap-2">
                                                            <Wind className="h-4 w-4" />
                                                            Mode Input Kecepatan Angin
                                                        </Label>
                                                        <div className="flex gap-4">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="wind_speed_mode"
                                                                    value="constant"
                                                                    checked={windSpeedMode === 'constant'}
                                                                    onChange={(e) => setWindSpeedMode(e.target.value as 'constant' | 'time-varying')}
                                                                    className="w-4 h-4 text-blue-600"
                                                                />
                                                                <span className="text-sm text-neutral-700 dark:text-neutral-300">Konstan</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="wind_speed_mode"
                                                                    value="time-varying"
                                                                    checked={windSpeedMode === 'time-varying'}
                                                                    onChange={(e) => setWindSpeedMode(e.target.value as 'constant' | 'time-varying')}
                                                                    className="w-4 h-4 text-blue-600"
                                                                />
                                                                <span className="text-sm text-neutral-700 dark:text-neutral-300">Time-varying</span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Mode Konstan */}
                                                    {windSpeedMode === 'constant' && (
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
                                                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/20 dark:bg-blue-900/10">
                                                                <p className="text-xs text-blue-800 dark:text-blue-300">
                                                                    Jika menggunakan satu nilai kecepatan angin, sistem mengasumsikan angin bersifat konstan selama periode prediksi.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Mode Time-varying */}
                                                    {windSpeedMode === 'time-varying' && (
                                                        <div className="space-y-2">
                                                            <Label className="flex items-center gap-2">
                                                                <Wind className="h-4 w-4" />
                                                                Kecepatan Angin per Time Step (m/s)
                                                            </Label>
                                                            <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                                                                <div className="max-h-96 overflow-y-auto">
                                                                    <table className="w-full text-sm">
                                                                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 sticky top-0">
                                                                            <tr>
                                                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                                                    No
                                                                                </th>
                                                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                                                    Timestamp
                                                                                </th>
                                                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                                                    Kecepatan Angin (m/s)
                                                                                </th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                                                            {windSpeedArray.map((item, index) => {
                                                                                const date = new Date(item.timestamp);
                                                                                const formattedDate = date.toLocaleString('id-ID', {
                                                                                    year: 'numeric',
                                                                                    month: '2-digit',
                                                                                    day: '2-digit',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                });
                                                                                
                                                                                return (
                                                                                    <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                                                                        <td className="px-4 py-2 text-neutral-900 dark:text-white">
                                                                                            {index + 1}
                                                                                        </td>
                                                                                        <td className="px-4 py-2 text-neutral-900 dark:text-white">
                                                                                            {formattedDate}
                                                                                        </td>
                                                                                        <td className="px-4 py-2">
                                                                                            <Input
                                                                                                type="text"
                                                                                                inputMode="decimal"
                                                                                                value={item.value}
                                                                                                onChange={(e) => {
                                                                                                    const value = e.target.value.replace(/[^0-9,.]/g, '');
                                                                                                    const newArray = [...windSpeedArray];
                                                                                                    newArray[index].value = value;
                                                                                                    setWindSpeedArray(newArray);
                                                                                                }}
                                                                                                placeholder={lastWindSpeed.toFixed(2)}
                                                                                                className="w-32"
                                                                                                required
                                                                                            />
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                                Masukkan kecepatan angin untuk setiap time step (per 12 jam). Total: {windSpeedArray.length} time step untuk {Math.ceil(windSpeedArray.length / 2)} hari.
                                                            </p>
                                                            {windSpeedArray.length === 0 && (
                                                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                                                    Pilih tanggal mulai dan akhir terlebih dahulu untuk menampilkan form input.
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
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
                                        {predictions.length > 0 && (
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
                        </div>
                    </div>
                </div>

                {/* Loading Overlay */}
                <LoadingOverlay show={isNavigating || isGenerating} message={isGenerating ? 'Membuat prediksi...' : 'Memuat...'} />
            </div>
        </AppLayout>
    );
}

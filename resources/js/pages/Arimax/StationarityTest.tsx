/**
 * Komponen Halaman Uji Stasioneritas
 * 
 * Halaman ini menampilkan analisis kestasioneran data time series berdasarkan pola visual.
 * Analisis ini membantu menentukan apakah data sudah stasioner atau perlu transformasi differencing.
 * 
 * Fitur utama:
 * - Grafik Time Series: Menampilkan data asli sebelum transformasi untuk mengamati tren, musiman, dan variansi
 * - Grafik Differencing: Menampilkan perubahan antar nilai berurutan untuk menentukan kebutuhan differencing
 */

import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { LineChart, TrendingUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

// Breadcrumb untuk navigasi halaman
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Uji Stasioneritas',
        href: '#',
    },
];

/**
 * Interface untuk data point time series
 */
interface TimeSeriesDataPoint {
    tanggal: string; // Tanggal dan waktu observasi
    tinggi_gelombang: number; // Nilai tinggi gelombang
}

/**
 * Interface untuk data point differencing
 */
interface DifferencingDataPoint {
    tanggal: string; // Tanggal dan waktu observasi
    differencing: number; // Nilai differencing (selisih antara nilai saat ini dan sebelumnya)
}

/**
 * Props yang diterima oleh komponen StationarityTest
 */
interface Props {
    timeSeriesData: TimeSeriesDataPoint[]; // Data time series asli
    differencingData: DifferencingDataPoint[]; // Data differencing (perubahan antar nilai)
    totalData: number; // Total jumlah data
}


/**
 * Komponen utama untuk halaman Uji Stasioneritas
 */
export default function StationarityTest({
    timeSeriesData,
    differencingData,
    totalData,
}: Props) {
    /**
     * State untuk mengelola tab aktif ('time-series' atau 'differencing').
     * Default: 'time-series'.
     */
    const [activeTab, setActiveTab] = useState<'time-series' | 'differencing'>('time-series');
    
    /**
     * State untuk menandai apakah sedang loading saat pergantian tab.
     * Digunakan untuk menampilkan indikator loading saat transisi.
     */
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Handler untuk pergantian tab.
     * Menampilkan loading indicator selama transisi untuk UX yang lebih baik.
     * 
     * @param tab - Tab yang akan diaktifkan ('time-series' atau 'differencing')
     */
    const handleTabChange = (tab: 'time-series' | 'differencing') => {
        setIsLoading(true);
        setActiveTab(tab);
        // Delay kecil untuk memungkinkan transisi yang halus
        setTimeout(() => {
            setIsLoading(false);
        }, 100);
    };

    /**
     * Memformat tanggal untuk ditampilkan pada sumbu X grafik.
     * Format singkat (bulan dan hari saja) untuk menghemat ruang.
     * 
     * @param dateString - String tanggal yang akan diformat
     * @returns String tanggal yang sudah diformat (contoh: "15 Des")
     */
    const formatDate = (dateString: string) => {
        // Parse string tanggal secara manual untuk menghindari konversi timezone
        let date: Date;
        
        if (dateString.includes('T')) {
            // Format ISO (YYYY-MM-DDTHH:mm:ss)
            const isoString = dateString.replace('Z', '').split('.')[0];
            const [datePart, timePart] = isoString.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute, second] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        } else {
            // Format standar (YYYY-MM-DD HH:mm:ss)
            const parts = dateString.split(' ');
            const [year, month, day] = parts[0].split('-').map(Number);
            const [hour, minute, second] = parts[1] ? parts[1].split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        }
        
        // Format ke bahasa Indonesia dengan format singkat
        return date.toLocaleDateString('id-ID', {
            month: 'short', // Bulan singkat (Des, Jan, dll)
            day: 'numeric', // Hari
        });
    };

    /**
     * Memformat tanggal untuk ditampilkan pada tooltip grafik.
     * Format lengkap dengan tanggal, bulan, tahun, jam, menit, dan detik.
     * 
     * @param dateString - String tanggal yang akan diformat
     * @returns String tanggal lengkap yang sudah diformat (contoh: "15 Desember 2024, 12:00:00")
     */
    const formatTooltipDate = (dateString: string) => {
        // Parse string tanggal secara manual untuk menghindari konversi timezone
        let date: Date;
        
        if (dateString.includes('T')) {
            // Format ISO (YYYY-MM-DDTHH:mm:ss)
            const isoString = dateString.replace('Z', '').split('.')[0];
            const [datePart, timePart] = isoString.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute, second] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        } else {
            // Format standar (YYYY-MM-DD HH:mm:ss)
            const parts = dateString.split(' ');
            const [year, month, day] = parts[0].split('-').map(Number);
            const [hour, minute, second] = parts[1] ? parts[1].split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        }
        
        // Format ke bahasa Indonesia dengan format lengkap
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long', // Bulan lengkap (Desember, Januari, dll)
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false, // Format 24 jam
        });
    };

    /**
     * Menentukan apakah harus menampilkan titik (dots) pada grafik.
     * Hanya menampilkan dots untuk dataset kecil (≤ 100 titik) untuk menghindari clutter.
     * Menggunakan useMemo untuk optimasi performa.
     */
    const showDots = useMemo(() => {
        return timeSeriesData.length <= 100;
    }, [timeSeriesData.length]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Uji Stasioneritas - ARIMAX" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        Uji Stasioner Grafik - ARIMAX
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Analisis kestasioneran berdasarkan pola visual (tren, musiman, variansi) dari data latih sebelum transformasi
                    </p>
                </div>

                {/* Info Card */}
                <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-900/20">
                            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                Total Data Tersedia
                            </p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                {totalData} data latih (80% dari dataset) untuk analisis stasioneritas
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
                    <button
                        onClick={() => handleTabChange('time-series')}
                        disabled={isLoading}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'time-series'
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Grafik Time Series
                    </button>
                    <button
                        onClick={() => handleTabChange('differencing')}
                        disabled={isLoading}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'differencing'
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Differencing Grafik
                    </button>
                </div>

                {/* Chart Section */}
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                            {activeTab === 'time-series'
                                ? 'Grafik Time Series Data Latih (Sebelum Transformasi)'
                                : 'Grafik Differencing Data Latih'}
                        </h2>
                        {activeTab === 'time-series' && (
                            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                Visualisasi time series data latih untuk mengamati tren, musiman, dan fluktuasi sebelum transformasi differencing
                            </p>
                        )}
                        {activeTab === 'differencing' && (
                            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                Grafik differencing menunjukkan perubahan antar nilai berurutan. Gunakan untuk menentukan apakah diperlukan differencing untuk memenuhi asumsi kestasioneran ARIMAX
                            </p>
                        )}
                    </div>

                    {totalData === 0 ? (
                        <div className="p-12 text-center">
                            <LineChart className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
                            <p className="mt-4 text-sm font-medium text-neutral-900 dark:text-white">
                                Belum ada data untuk ditampilkan
                            </p>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Upload data terlebih dahulu untuk melihat grafik time series dan differencing
                            </p>
                        </div>
                    ) : isLoading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent dark:border-blue-400"></div>
                            <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                                Memuat grafik...
                            </p>
                        </div>
                    ) : (
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={500}>
                                {activeTab === 'time-series' ? (
                                    <RechartsLineChart
                                        data={timeSeriesData}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            className="stroke-neutral-200 dark:stroke-neutral-700"
                                        />
                                        <XAxis
                                            dataKey="tanggal"
                                            tickFormatter={formatDate}
                                            className="text-xs text-neutral-600 dark:text-neutral-400"
                                            stroke="currentColor"
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            label={{
                                                value: 'Ketinggian Gelombang (m)',
                                                angle: -90,
                                                position: 'insideLeft',
                                                className: 'text-xs fill-neutral-600 dark:fill-neutral-400',
                                            }}
                                            className="text-xs text-neutral-600 dark:text-neutral-400"
                                            stroke="currentColor"
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '0.5rem',
                                                padding: '0.5rem',
                                            }}
                                            labelFormatter={(value) => formatTooltipDate(value)}
                                            formatter={(value: number) => [
                                                `${value.toFixed(2)} m`,
                                                'Tinggi Gelombang',
                                            ]}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="tinggi_gelombang"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={showDots ? { r: 3 } : false}
                                            activeDot={{ r: 5 }}
                                            name="Tinggi Gelombang (m)"
                                            isAnimationActive={false}
                                        />
                                    </RechartsLineChart>
                                ) : (
                                    <RechartsLineChart
                                        data={differencingData}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            className="stroke-neutral-200 dark:stroke-neutral-700"
                                        />
                                        <XAxis
                                            dataKey="tanggal"
                                            tickFormatter={formatDate}
                                            className="text-xs text-neutral-600 dark:text-neutral-400"
                                            stroke="currentColor"
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            label={{
                                                value: 'Nilai Differencing (m)',
                                                angle: -90,
                                                position: 'insideLeft',
                                                className: 'text-xs fill-neutral-600 dark:fill-neutral-400',
                                            }}
                                            className="text-xs text-neutral-600 dark:text-neutral-400"
                                            stroke="currentColor"
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '0.5rem',
                                                padding: '0.5rem',
                                            }}
                                            labelFormatter={(value) => formatTooltipDate(value)}
                                            formatter={(value: number) => [
                                                `${value.toFixed(2)} m`,
                                                'Differencing',
                                            ]}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="differencing"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={showDots ? { r: 3 } : false}
                                            activeDot={{ r: 5 }}
                                            name="Differencing (m)"
                                            isAnimationActive={false}
                                        />
                                    </RechartsLineChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}


/**
 * Komponen Halaman Evaluasi Hybrid
 * 
 * Halaman ini menampilkan evaluasi kinerja model Hybrid ARIMAX-LSTM dengan membandingkan
 * performa model ARIMAX murni dan model Hybrid. Evaluasi dilakukan menggunakan metrik MAPE
 * dan visualisasi grafik perbandingan data aktual dengan prediksi.
 * 
 * Fitur utama:
 * - Perbandingan MAPE antara model ARIMAX dan Hybrid
 * - Grafik perbandingan data aktual, prediksi ARIMAX, dan prediksi Hybrid
 * - Tabel detail perbandingan prediksi dengan data aktual
 */

import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { BarChart3, TrendingUp } from 'lucide-react';
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
        title: 'Evaluasi Hybrid',
        href: '#',
    },
];

/**
 * Interface untuk data point pada grafik
 */
interface ChartDataPoint {
    tanggal: string; // Tanggal dan waktu observasi
    hari_ke: number; // Nomor hari ke- (untuk sumbu X grafik)
    data_aktual: number; // Nilai aktual tinggi gelombang
    prediksi_arimax: number; // Prediksi dari model ARIMAX
    prediksi_hybrid: number; // Prediksi dari model Hybrid (ARIMAX + LSTM)
}

/**
 * Interface untuk data point pada tabel
 */
interface TableDataPoint {
    nomor: number; // Nomor urut
    tanggal: string; // Tanggal dan waktu observasi
    data_aktual: number; // Nilai aktual tinggi gelombang
    prediksi_arimax: number; // Prediksi dari model ARIMAX
    prediksi_hybrid: number; // Prediksi dari model Hybrid
}

/**
 * Interface untuk metrik evaluasi
 */
interface Metrics {
    mape_arimax: number; // MAPE dari model ARIMAX (%)
    mape_hybrid: number; // MAPE dari model Hybrid (%)
    total_data: number; // Total jumlah data yang dievaluasi
}

/**
 * Props yang diterima oleh komponen HybridEvaluation
 */
interface Props {
    chartData: ChartDataPoint[]; // Data untuk grafik
    tableData: TableDataPoint[]; // Data untuk tabel
    metrics: Metrics; // Metrik evaluasi (MAPE)
}

/**
 * Komponen utama untuk halaman Evaluasi Hybrid
 */
export default function HybridEvaluation({ chartData, tableData, metrics }: Props) {
    /**
     * Memformat tanggal untuk ditampilkan pada sumbu X grafik.
     * Format singkat (bulan dan hari saja) untuk menghemat ruang.
     * Parse tanggal secara manual untuk menghindari konversi timezone.
     * 
     * @param dateString - String tanggal yang akan diformat
     * @returns String tanggal yang sudah diformat (contoh: "15 Des")
     */
    const formatDate = (dateString: string) => {
        // Parse tanggal secara manual untuk menghindari konversi timezone
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
        
        return date.toLocaleDateString('id-ID', {
            month: 'short',
            day: 'numeric',
        });
    };

    /**
     * Memformat tanggal untuk ditampilkan pada tooltip grafik.
     * Format lengkap dengan tanggal, bulan, tahun, jam, menit, dan detik.
     * Jika value adalah number (hari_ke), kembalikan format "Hari ke-X".
     * 
     * @param value - String tanggal atau number (hari_ke) yang akan diformat
     * @returns String tanggal lengkap yang sudah diformat atau "Hari ke-X"
     */
    const formatTooltipDate = (value: string | number) => {
        // Jika value adalah number, berarti itu adalah hari_ke
        if (typeof value === 'number') {
            return `Hari ke-${value}`;
        }
        
        // Parse tanggal secara manual untuk menghindari konversi timezone
        let date: Date;
        
        if (value.includes('T')) {
            // Format ISO: "2023-01-01T00:00:00.000000Z" atau "2023-01-01T00:00:00"
            const isoString = value.replace('Z', '').split('.')[0];
            const [datePart, timePart] = isoString.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute, second] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        } else {
            // Format: "2023-01-01 00:00:00" atau "2023-01-01"
            const parts = value.split(' ');
            const [year, month, day] = parts[0].split('-').map(Number);
            const [hour, minute, second] = parts[1] ? parts[1].split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        }
        
        // Format ke locale Indonesia dengan format lengkap
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
     * Memformat tanggal untuk ditampilkan pada tabel.
     * Format lengkap dengan tanggal, bulan, tahun, jam, menit, dan detik (DD/MM/YYYY HH:mm:ss).
     * Parse tanggal secara manual untuk menghindari konversi timezone.
     * 
     * @param dateString - String tanggal yang akan diformat
     * @returns String tanggal yang sudah diformat dalam format Indonesia
     */
    const formatTableDate = (dateString: string) => {
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
     * 
     * @param value - Angka yang akan diformat
     * @param decimals - Jumlah desimal (default: 2)
     * @returns String angka yang sudah diformat
     */
    const formatNumber = (value: number, decimals: number = 2) => {
        return value.toFixed(decimals);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Evaluasi Hybrid" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        Evaluasi Hybrid
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Evaluasi kinerja model gabungan ARIMAX–LSTM melalui perbandingan data aktual dan prediksi
                    </p>
                </div>

                {/* MAPE Comparison Table */}
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                            Evaluasi MAPE (Mean Absolute Percentage Error)
                        </h2>
                    </div>
                    <div className="p-6">
                        <table className="w-full">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                        Model
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                        MAPE (%)
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                                        ARIMAX
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-mono text-neutral-900 dark:text-white">
                                        {formatNumber(metrics.mape_arimax)}%
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm">
                                        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                                            Baseline
                                        </span>
                                    </td>
                                </tr>
                                <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                                        Hybrid (ARIMAX + LSTM)
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-mono font-semibold text-neutral-900 dark:text-white">
                                        {formatNumber(metrics.mape_hybrid)}%
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm">
                                        {metrics.mape_hybrid < metrics.mape_arimax ? (
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                ✓ Akurasi Meningkat
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                Tidak Ada Peningkatan
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        {metrics.mape_hybrid < metrics.mape_arimax && (
                            <div className="mt-4 rounded-md bg-green-50 p-3 dark:bg-green-900/20">
                                <p className="text-sm text-green-800 dark:text-green-200">
                                    <span className="font-semibold">Peningkatan Akurasi:</span> Model Hybrid menunjukkan peningkatan akurasi sebesar{' '}
                                    <span className="font-mono font-semibold">
                                        {formatNumber(metrics.mape_arimax - metrics.mape_hybrid)}%
                                    </span>{' '}
                                    dibandingkan dengan model ARIMAX murni.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chart Section */}
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                            Perbandingan Data Aktual, Prediksi ARIMAX, dan Hybrid
                        </h2>
                    </div>

                    {chartData.length === 0 ? (
                        <div className="p-12 text-center">
                            <BarChart3 className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
                            <p className="mt-4 text-sm font-medium text-neutral-900 dark:text-white">
                                Belum ada data untuk ditampilkan
                            </p>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Buat prediksi terlebih dahulu untuk melihat grafik evaluasi
                            </p>
                        </div>
                    ) : (
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={500}>
                                <RechartsLineChart
                                    data={chartData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        className="stroke-neutral-200 dark:stroke-neutral-700"
                                    />
                                    <XAxis
                                        dataKey="hari_ke"
                                        label={{
                                            value: 'Timestamp / Hari ke-',
                                            position: 'insideBottom',
                                            offset: -5,
                                            className: 'text-xs fill-neutral-600 dark:fill-neutral-400',
                                        }}
                                        className="text-xs text-neutral-600 dark:text-neutral-400"
                                        stroke="currentColor"
                                    />
                                    <YAxis
                                        label={{
                                            value: 'Ketinggian Gelombang (M)',
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
                                        labelFormatter={(value) => {
                                            // value is hari_ke (number)
                                            const dataPoint = chartData.find((d) => d.hari_ke === value);
                                            if (dataPoint) {
                                                return formatTooltipDate(dataPoint.tanggal);
                                            }
                                            return `Hari ke-${value}`;
                                        }}
                                        formatter={(value: number, name: string) => {
                                            // Map the dataKey to proper label
                                            let label = '';
                                            if (name === 'data_aktual' || name === 'Data Aktual') {
                                                label = 'Data Aktual';
                                            } else if (name === 'prediksi_arimax' || name === 'Prediksi ARIMAX') {
                                                label = 'Prediksi ARIMAX';
                                            } else if (name === 'prediksi_hybrid' || name === 'Prediksi Hybrid') {
                                                label = 'Prediksi Hybrid';
                                            } else {
                                                label = name;
                                            }
                                            return [`${value.toFixed(4)} m`, label];
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="data_aktual"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        name="Data Aktual"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="prediksi_arimax"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        name="Prediksi ARIMAX"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="prediksi_hybrid"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        name="Prediksi Hybrid"
                                    />
                                </RechartsLineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Table Section */}
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                            Hasil Perbandingan Data Aktual dan Prediksi Hybrid
                        </h2>
                    </div>

                    {tableData.length === 0 ? (
                        <div className="p-12 text-center">
                            <BarChart3 className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
                            <p className="mt-4 text-sm font-medium text-neutral-900 dark:text-white">
                                Belum ada data untuk ditampilkan
                            </p>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Buat prediksi terlebih dahulu untuk melihat tabel evaluasi
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
                                            Data Aktual (M)
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Prediksi ARIMAX (M)
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Prediksi Hybrid (M)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                    {tableData.map((row) => (
                                        <tr
                                            key={row.nomor}
                                            className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                                                {row.nomor}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900 dark:text-white">
                                                {formatTableDate(row.tanggal)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400 font-mono">
                                                {formatNumber(row.data_aktual, 4)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-neutral-900 dark:text-white font-mono">
                                                {formatNumber(row.prediksi_arimax, 4)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400 font-mono">
                                                {formatNumber(row.prediksi_hybrid, 4)}
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


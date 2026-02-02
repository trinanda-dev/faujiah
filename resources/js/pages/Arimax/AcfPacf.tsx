/**
 * Komponen Halaman ACF/PACF Analysis
 * 
 * Halaman ini menampilkan analisis Autocorrelation Function (ACF) dan Partial Autocorrelation Function (PACF)
 * dari data latih yang sudah stasioner. Analisis ini digunakan untuk mengidentifikasi orde parameter
 * AR (p) dan MA (q) dalam pemodelan ARIMAX.
 * 
 * Fitur utama:
 * - Grafik ACF dan PACF dengan batas kepercayaan 95%
 * - Tabel nilai ACF dan PACF dengan penanda lag signifikan
 */

import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { BarChart3 } from 'lucide-react';
import { useMemo } from 'react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';

// Breadcrumb untuk navigasi halaman
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'ACF/PACF',
        href: '#',
    },
];

/**
 * Interface untuk data point ACF/PACF pada grafik
 */
interface AcfPacfDataPoint {
    lag: number; // Lag (selisih waktu) antara observasi
    value: number; // Nilai ACF atau PACF pada lag tersebut
}

/**
 * Interface untuk data point pada tabel ACF/PACF
 */
interface TableDataPoint {
    lag: number; // Lag
    acf: number; // Nilai ACF
    pacf: number; // Nilai PACF
}

/**
 * Props yang diterima oleh komponen AcfPacf
 *
 * - original*: ACF/PACF dari data asli (d = 0), digunakan untuk mengevaluasi stasioneritas
 * - acfData/pacfData/tableData: ACF/PACF dari data akhir (stasioner) yang dipakai untuk identifikasi p dan q
 */
interface Props {
    // Data akhir (stasioner) yang digunakan untuk identifikasi p dan q
    acfData: AcfPacfDataPoint[];
    pacfData: AcfPacfDataPoint[];
    tableData: TableDataPoint[];
    totalData: number;

    // Data dari deret asli sebelum differencing (d = 0)
    originalAcfData: AcfPacfDataPoint[];
    originalPacfData: AcfPacfDataPoint[];
    originalTableData: TableDataPoint[];
    originalTotalData: number;

    // Informasi keputusan differencing
    differencingApplied: boolean;
    differencingOrder: number;
    differencingDecision: string;
}

/**
 * Komponen utama untuk halaman ACF/PACF Analysis
 */
export default function AcfPacf({
    acfData,
    pacfData,
    tableData,
    totalData,
    originalAcfData,
    originalPacfData,
    originalTableData,
    originalTotalData,
    differencingApplied,
    differencingOrder,
    differencingDecision,
}: Props) {
    /**
     * Menghitung batas kepercayaan 95% untuk interval kepercayaan.
     * Formula: ±1.96 / sqrt(n) untuk tingkat kepercayaan 95%.
     * Nilai ACF/PACF yang melampaui batas ini dianggap signifikan secara statistik.
     *
     * - confidenceBoundOriginal: untuk deret asli (d = 0)
     * - confidenceBoundFinal: untuk deret akhir (stasioner, bisa d = 0 atau d = 1)
     */
    const confidenceBoundOriginal =
        originalTotalData > 0 ? 1.96 / Math.sqrt(originalTotalData) : 0;
    const confidenceBoundFinal = totalData > 0 ? 1.96 / Math.sqrt(totalData) : 0;


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ACF/PACF - ARIMAX" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        ACF/PACF - ARIMAX
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Analisis Autocorrelation Function (ACF) dan Partial Autocorrelation Function
                        (PACF) dari data latih untuk mengecek stasioneritas dan mengidentifikasi orde
                        parameter AR (p), differencing (d), dan MA (q) pada model ARIMAX.
                    </p>
                </div>

                {/* Info Card */}
                <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-50 dark:bg-purple-900/20">
                            <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                Total Data Tersedia
                            </p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                {originalTotalData} data asli untuk analisis awal ACF/PACF (d = 0){' '}
                                <br />
                                {totalData} data digunakan sebagai deret akhir untuk identifikasi model
                                (d = {differencingOrder})
                            </p>
                        </div>
                    </div>
                </div>

                {/* Keputusan differencing */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
                    {differencingDecision}
                </div>

                {/* Charts Section */}
                {originalTotalData === 0 ? (
                    <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <BarChart3 className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
                        <p className="mt-4 text-sm font-medium text-neutral-900 dark:text-white">
                            Belum ada data untuk ditampilkan
                        </p>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Data akan muncul setelah proses pembagian dataset dan uji stasioneritas
                            selesai.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ACF dan PACF untuk data asli (d = 0) */}
                        <div className="space-y-4">
                            <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                                    <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                        ACF/PACF Data Asli (d = 0)
                                    </h2>
                                    <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                                        ACF dan PACF dari data time series asli digunakan untuk mengecek
                                        apakah data sudah stasioner atau perlu differencing. Jika ACF
                                        menunjukkan decay lambat dengan banyak lag signifikan, maka data
                                        cenderung tidak stasioner.
                                    </p>
                                </div>
                                <div className="grid gap-6 p-6 lg:grid-cols-2">
                                    {/* ACF Original */}
                                    <div>
                                        <ResponsiveContainer width="100%" height={360}>
                                            <BarChart
                                                data={originalAcfData}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    className="stroke-neutral-200 dark:stroke-neutral-700"
                                                />
                                                <XAxis
                                                    dataKey="lag"
                                                    label={{
                                                        value: 'Lag',
                                                        position: 'insideBottom',
                                                        offset: -5,
                                                        className:
                                                            'text-xs fill-neutral-600 dark:fill-neutral-400',
                                                    }}
                                                    className="text-xs text-neutral-600 dark:text-neutral-400"
                                                    stroke="currentColor"
                                                    interval="preserveStartEnd"
                                                />
                                                <YAxis
                                                    label={{
                                                        value: 'ACF',
                                                        angle: -90,
                                                        position: 'insideLeft',
                                                        className:
                                                            'text-xs fill-neutral-600 dark:fill-neutral-400',
                                                    }}
                                                    domain={[-1, 1]}
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
                                                    formatter={(value: number) => [value.toFixed(4), 'ACF']}
                                                />
                                                <Legend />
                                                <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
                                                <ReferenceLine
                                                    y={confidenceBoundOriginal}
                                                    stroke="#ef4444"
                                                    strokeDasharray="2 2"
                                                    label={{ value: 'Upper Bound', position: 'top' }}
                                                />
                                                <ReferenceLine
                                                    y={-confidenceBoundOriginal}
                                                    stroke="#ef4444"
                                                    strokeDasharray="2 2"
                                                    label={{ value: 'Lower Bound', position: 'bottom' }}
                                                />
                                                <Bar
                                                    dataKey="value"
                                                    fill="#3b82f6"
                                                    name="ACF"
                                                    radius={[4, 4, 0, 0]}
                                                    isAnimationActive={false}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* PACF Original */}
                                    <div>
                                        <ResponsiveContainer width="100%" height={360}>
                                            <BarChart
                                                data={originalPacfData}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    className="stroke-neutral-200 dark:stroke-neutral-700"
                                                />
                                                <XAxis
                                                    dataKey="lag"
                                                    label={{
                                                        value: 'Lag',
                                                        position: 'insideBottom',
                                                        offset: -5,
                                                        className:
                                                            'text-xs fill-neutral-600 dark:fill-neutral-400',
                                                    }}
                                                    className="text-xs text-neutral-600 dark:text-neutral-400"
                                                    stroke="currentColor"
                                                    interval="preserveStartEnd"
                                                />
                                                <YAxis
                                                    label={{
                                                        value: 'PACF',
                                                        angle: -90,
                                                        position: 'insideLeft',
                                                        className:
                                                            'text-xs fill-neutral-600 dark:fill-neutral-400',
                                                    }}
                                                    domain={[-1, 1]}
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
                                                    formatter={(value: number) => [value.toFixed(4), 'PACF']}
                                                />
                                                <Legend />
                                                <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
                                                <ReferenceLine
                                                    y={confidenceBoundOriginal}
                                                    stroke="#ef4444"
                                                    strokeDasharray="2 2"
                                                    label={{ value: 'Upper Bound', position: 'top' }}
                                                />
                                                <ReferenceLine
                                                    y={-confidenceBoundOriginal}
                                                    stroke="#ef4444"
                                                    strokeDasharray="2 2"
                                                    label={{ value: 'Lower Bound', position: 'bottom' }}
                                                />
                                                <Bar
                                                    dataKey="value"
                                                    fill="#10b981"
                                                    name="PACF"
                                                    radius={[4, 4, 0, 0]}
                                                    isAnimationActive={false}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Jika differencing dilakukan, tampilkan ACF/PACF deret hasil differencing */}
                            {differencingApplied && (
                                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                            ACF/PACF Data Setelah Differencing (d = 1)
                                        </h2>
                                        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                                            ACF dan PACF dari deret yang sudah stasioner (setelah
                                            differencing) digunakan sebagai dasar identifikasi orde AR
                                            (p) dan MA (q) dalam model ARIMAX.
                                        </p>
                                    </div>
                                    <div className="grid gap-6 p-6 lg:grid-cols-2">
                                        {/* ACF Final */}
                                        <div>
                                            <ResponsiveContainer width="100%" height={360}>
                                                <BarChart
                                                    data={acfData}
                                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                >
                                                    <CartesianGrid
                                                        strokeDasharray="3 3"
                                                        className="stroke-neutral-200 dark:stroke-neutral-700"
                                                    />
                                                    <XAxis
                                                        dataKey="lag"
                                                        label={{
                                                            value: 'Lag',
                                                            position: 'insideBottom',
                                                            offset: -5,
                                                            className:
                                                                'text-xs fill-neutral-600 dark:fill-neutral-400',
                                                        }}
                                                        className="text-xs text-neutral-600 dark:text-neutral-400"
                                                        stroke="currentColor"
                                                        interval="preserveStartEnd"
                                                    />
                                                    <YAxis
                                                        label={{
                                                            value: 'ACF',
                                                            angle: -90,
                                                            position: 'insideLeft',
                                                            className:
                                                                'text-xs fill-neutral-600 dark:fill-neutral-400',
                                                        }}
                                                        domain={[-1, 1]}
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
                                                        formatter={(value: number) => [value.toFixed(4), 'ACF']}
                                                    />
                                                    <Legend />
                                                    <ReferenceLine
                                                        y={0}
                                                        stroke="#6b7280"
                                                        strokeDasharray="2 2"
                                                    />
                                                    <ReferenceLine
                                                        y={confidenceBoundFinal}
                                                        stroke="#ef4444"
                                                        strokeDasharray="2 2"
                                                        label={{ value: 'Upper Bound', position: 'top' }}
                                                    />
                                                    <ReferenceLine
                                                        y={-confidenceBoundFinal}
                                                        stroke="#ef4444"
                                                        strokeDasharray="2 2"
                                                        label={{ value: 'Lower Bound', position: 'bottom' }}
                                                    />
                                                    <Bar
                                                        dataKey="value"
                                                        fill="#3b82f6"
                                                        name="ACF"
                                                        radius={[4, 4, 0, 0]}
                                                        isAnimationActive={false}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* PACF Final */}
                                        <div>
                                            <ResponsiveContainer width="100%" height={360}>
                                                <BarChart
                                                    data={pacfData}
                                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                >
                                                    <CartesianGrid
                                                        strokeDasharray="3 3"
                                                        className="stroke-neutral-200 dark:stroke-neutral-700"
                                                    />
                                                    <XAxis
                                                        dataKey="lag"
                                                        label={{
                                                            value: 'Lag',
                                                            position: 'insideBottom',
                                                            offset: -5,
                                                            className:
                                                                'text-xs fill-neutral-600 dark:fill-neutral-400',
                                                        }}
                                                        className="text-xs text-neutral-600 dark:text-neutral-400"
                                                        stroke="currentColor"
                                                        interval="preserveStartEnd"
                                                    />
                                                    <YAxis
                                                        label={{
                                                            value: 'PACF',
                                                            angle: -90,
                                                            position: 'insideLeft',
                                                            className:
                                                                'text-xs fill-neutral-600 dark:fill-neutral-400',
                                                        }}
                                                        domain={[-1, 1]}
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
                                                        formatter={(value: number) => [value.toFixed(4), 'PACF']}
                                                    />
                                                    <Legend />
                                                    <ReferenceLine
                                                        y={0}
                                                        stroke="#6b7280"
                                                        strokeDasharray="2 2"
                                                    />
                                                    <ReferenceLine
                                                        y={confidenceBoundFinal}
                                                        stroke="#ef4444"
                                                        strokeDasharray="2 2"
                                                        label={{ value: 'Upper Bound', position: 'top' }}
                                                    />
                                                    <ReferenceLine
                                                        y={-confidenceBoundFinal}
                                                        stroke="#ef4444"
                                                        strokeDasharray="2 2"
                                                        label={{ value: 'Lower Bound', position: 'bottom' }}
                                                    />
                                                    <Bar
                                                        dataKey="value"
                                                        fill="#10b981"
                                                        name="PACF"
                                                        radius={[4, 4, 0, 0]}
                                                        isAnimationActive={false}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Table Section */}
                        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                                <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                    Nilai ACF dan PACF (Deret Akhir untuk Identifikasi Model)
                                </h2>
                                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                                    Nilai yang melampaui batas kepercayaan (±
                                    {confidenceBoundFinal.toFixed(4)}) ditandai dengan warna. Tabel ini
                                    menggunakan deret akhir yang dianggap stasioner (d ={' '}
                                    {differencingOrder}) dan menjadi dasar pemilihan p dan q.
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                LAG
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                ACF
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                PACF
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                        {tableData.map((item) => {
                                            const isAcfSignificant =
                                                Math.abs(item.acf) > confidenceBoundFinal;
                                            const isPacfSignificant =
                                                Math.abs(item.pacf) > confidenceBoundFinal;
                                            return (
                                                <tr
                                                    key={item.lag}
                                                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                                >
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                                                        {item.lag}
                                                    </td>
                                                    <td
                                                        className={`whitespace-nowrap px-4 py-3 text-sm font-mono ${
                                                            isAcfSignificant
                                                                ? 'font-semibold text-blue-600 dark:text-blue-400'
                                                                : 'text-neutral-900 dark:text-white'
                                                        }`}
                                                    >
                                                        {item.acf.toFixed(4)}
                                                        {isAcfSignificant && (
                                                            <span className="ml-2 text-xs text-blue-500 dark:text-blue-400">
                                                                *
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td
                                                        className={`whitespace-nowrap px-4 py-3 text-sm font-mono ${
                                                            isPacfSignificant
                                                                ? 'font-semibold text-green-600 dark:text-green-400'
                                                                : 'text-neutral-900 dark:text-white'
                                                        }`}
                                                    >
                                                        {item.pacf.toFixed(4)}
                                                        {isPacfSignificant && (
                                                            <span className="ml-2 text-xs text-green-500 dark:text-green-400">
                                                                *
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}


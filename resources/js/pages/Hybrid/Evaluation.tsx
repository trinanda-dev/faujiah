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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Evaluasi Hybrid',
    },
];

interface ChartDataPoint {
    tanggal: string;
    hari_ke: number;
    data_aktual: number;
    prediksi_arimax: number;
    prediksi_lstm_residual: number;
    prediksi_hybrid: number;
}

interface TableDataPoint {
    nomor: number;
    tanggal: string;
    data_aktual: number;
    prediksi_arimax: number;
    prediksi_lstm_residual: number;
    prediksi_hybrid: number;
}

interface Metrics {
    mape: number;
    mae: number;
    rmse: number;
    total_data: number;
}

interface Props {
    chartData: ChartDataPoint[];
    tableData: TableDataPoint[];
    metrics: Metrics;
}

export default function HybridEvaluation({ chartData, tableData, metrics }: Props) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTooltipDate = (value: string | number) => {
        if (typeof value === 'number') {
            return `Hari ke-${value}`;
        }
        const date = new Date(value);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

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

                {/* Metrics Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-900/20">
                                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                    MAPE
                                </p>
                                <p className="text-lg font-semibold text-neutral-900 dark:text-white font-mono">
                                    {formatNumber(metrics.mape)}%
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-50 dark:bg-green-900/20">
                                <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                    MAE
                                </p>
                                <p className="text-lg font-semibold text-neutral-900 dark:text-white font-mono">
                                    {formatNumber(metrics.mae, 4)} m
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-50 dark:bg-purple-900/20">
                                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                    RMSE
                                </p>
                                <p className="text-lg font-semibold text-neutral-900 dark:text-white font-mono">
                                    {formatNumber(metrics.rmse, 4)} m
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                            Grafik Perbandingan Data Aktual dan Prediksi Hybrid (ARIMAX + LSTM)
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
                                        labelFormatter={formatTooltipDate}
                                        formatter={(value: number, name: string) => [
                                            `${value.toFixed(4)} m`,
                                            name === 'data_aktual'
                                                ? 'Data Aktual'
                                                : name === 'prediksi_arimax'
                                                  ? 'Prediksi ARIMAX'
                                                  : name === 'prediksi_lstm_residual'
                                                    ? 'Prediksi LSTM Residual'
                                                    : 'Prediksi Hybrid',
                                        ]}
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
                                        dataKey="prediksi_lstm_residual"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        name="Prediksi LSTM Residual"
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
                                            Tanggal
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Data Aktual (M)
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
                                                {formatDate(row.tanggal)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400 font-mono">
                                                {formatNumber(row.data_aktual, 4)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-neutral-900 dark:text-white font-mono">
                                                {formatNumber(row.prediksi_arimax, 4)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-neutral-900 dark:text-white font-mono">
                                                {formatNumber(row.prediksi_lstm_residual, 4)}
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


import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';
import { LineChart, TrendingUp } from 'lucide-react';
import { useState } from 'react';
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
        title: 'Uji Stasioneritas',
    },
];

interface TimeSeriesDataPoint {
    tanggal: string;
    tinggi_gelombang: number;
    tinggi_gelombang_normalized: number | null;
}

interface DifferencingDataPoint {
    tanggal: string;
    differencing: number;
}

interface Props {
    timeSeriesData: TimeSeriesDataPoint[];
    differencingData: DifferencingDataPoint[];
    totalData: number;
}

export default function StationarityTest({
    timeSeriesData,
    differencingData,
    totalData,
}: Props) {
    const [activeTab, setActiveTab] = useState<'time-series' | 'differencing'>('time-series');

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTooltipDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

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
                        Analisis pola pergerakan data tinggi gelombang dan hasil transformasi differencing untuk mencapai kestasioneran
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
                                {totalData} data untuk analisis stasioneritas
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
                    <button
                        onClick={() => setActiveTab('time-series')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'time-series'
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                        }`}
                    >
                        Grafik Time Series
                    </button>
                    <button
                        onClick={() => setActiveTab('differencing')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'differencing'
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                        }`}
                    >
                        Differencing Grafik
                    </button>
                </div>

                {/* Chart Section */}
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                            {activeTab === 'time-series'
                                ? 'Grafik Data Latih Ketinggian Gelombang'
                                : 'Grafik Differencing Data Latih Ketinggian Gelombang'}
                        </h2>
                        {activeTab === 'differencing' && (
                            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                Grafik menunjukkan perubahan antar nilai berurutan untuk mengidentifikasi kestasioneran data
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
                                Data akan muncul setelah proses normalisasi selesai
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
                                            dot={{ r: 3 }}
                                            name="Tinggi Gelombang (m)"
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
                                            dot={{ r: 3 }}
                                            name="Differencing (m)"
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


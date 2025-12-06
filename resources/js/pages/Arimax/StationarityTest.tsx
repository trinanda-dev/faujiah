import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';
import { LineChart, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
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
        href: '#',
    },
];

interface TimeSeriesDataPoint {
    tanggal: string;
    tinggi_gelombang: number;
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

// Maximum data points to display for optimal performance
const MAX_DATA_POINTS = 500;

/**
 * Sample data to reduce rendering load while maintaining visual accuracy
 */
function sampleData<T extends { tanggal: string }>(
    data: T[],
    maxPoints: number,
): T[] {
    if (data.length <= maxPoints) {
        return data;
    }

    const step = Math.ceil(data.length / maxPoints);
    const sampled: T[] = [];

    for (let i = 0; i < data.length; i += step) {
        sampled.push(data[i]);
    }

    // Always include the last point
    if (sampled[sampled.length - 1] !== data[data.length - 1]) {
        sampled.push(data[data.length - 1]);
    }

    return sampled;
}

export default function StationarityTest({
    timeSeriesData,
    differencingData,
    totalData,
}: Props) {
    const [activeTab, setActiveTab] = useState<'time-series' | 'differencing'>('time-series');
    const [isLoading, setIsLoading] = useState(false);

    // Memoize sampled data for performance
    const sampledTimeSeriesData = useMemo(() => {
        return sampleData(timeSeriesData, MAX_DATA_POINTS);
    }, [timeSeriesData]);

    const sampledDifferencingData = useMemo(() => {
        return sampleData(differencingData, MAX_DATA_POINTS);
    }, [differencingData]);

    const handleTabChange = (tab: 'time-series' | 'differencing') => {
        setIsLoading(true);
        setActiveTab(tab);
        // Small delay to allow smooth transition
        setTimeout(() => {
            setIsLoading(false);
        }, 100);
    };

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

    // Determine if we should show dots (only for smaller datasets)
    const showDots = useMemo(() => {
        return sampledTimeSeriesData.length <= 100;
    }, [sampledTimeSeriesData.length]);

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
                            {totalData > MAX_DATA_POINTS && (
                                <div className="mb-4 rounded-md bg-blue-50 p-3 text-xs text-blue-900 dark:bg-blue-900/20 dark:text-blue-200">
                                    <p>
                                        Menampilkan{' '}
                                        {activeTab === 'time-series'
                                            ? sampledTimeSeriesData.length
                                            : sampledDifferencingData.length}{' '}
                                        dari {totalData} data untuk performa optimal
                                    </p>
                                </div>
                            )}
                            <ResponsiveContainer width="100%" height={500}>
                                {activeTab === 'time-series' ? (
                                    <RechartsLineChart
                                        data={sampledTimeSeriesData}
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
                                        data={sampledDifferencingData}
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


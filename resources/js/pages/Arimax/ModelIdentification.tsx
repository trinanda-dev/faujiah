import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Award, CheckCircle2, Info, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Identifikasi Model',
        href: '#',
    },
];

interface AcceptedRegion {
    model: string;
    batasan: string;
    kondisi: string;
}

interface ParameterEstimation {
    parameter: string;
    estimasi: number;
    std_error: number;
    z_value: number;
    p_value: number;
}

interface ModelSummary {
    model: string;
    aic: number;
    bic: number;
    log_likelihood: number;
    sigma2: number;
    total_observations: number;
}

interface TestResult {
    nomor: number;
    ketinggian_gelombang: number;
    arimax_1_1_0: number;
    arimax_0_0_1: number;
    arimax_2_1_0: number;
}

interface ModelMetric {
    model: string;
    mape: number;
    mae: number;
    rmse: number;
}

interface BestModelSummary {
    model: string;
    mape: number;
    mae: number;
    rmse: number;
    description: string;
}

interface ParameterEvaluation {
    model: string;
    p: number;
    d: number;
    q: number;
    stability: boolean;
    invertibility: boolean;
    significance: boolean;
    aic: number | null;
    bic: number | null;
    status: 'Diterima' | 'Ditolak';
    alasan: string;
}

interface Props {
    acceptedRegions: AcceptedRegion[];
    parameterEvaluations?: ParameterEvaluation[];
    parameterEstimations: ParameterEstimation[];
    modelSummary: ModelSummary | null;
    testResults: TestResult[];
    modelMetrics: ModelMetric[];
    bestModelSummary: BestModelSummary | null;
}

export default function ModelIdentification({
    acceptedRegions,
    parameterEvaluations = [],
    parameterEstimations,
    modelSummary,
    testResults,
    modelMetrics,
    bestModelSummary,
}: Props) {
    const [activeTab, setActiveTab] = useState<'evaluation' | 'accepted' | 'estimation' | 'test-results'>('evaluation');
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Identifikasi Model - ARIMAX" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        Identifikasi Model - ARIMAX
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Batasan dan rentang parameter model yang secara statistik dianggap valid untuk pemodelan ARIMAX
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
                    <button
                        onClick={() => setActiveTab('evaluation')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'evaluation'
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                        }`}
                    >
                        Evaluasi Parameter
                    </button>
                    <button
                        onClick={() => setActiveTab('accepted')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'accepted'
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                        }`}
                    >
                        Daerah yang Diterima
                    </button>
                    <button
                        onClick={() => setActiveTab('estimation')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'estimation'
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                        }`}
                    >
                        Estimasi Parameter Model ARIMAX
                    </button>
                    <button
                        onClick={() => setActiveTab('test-results')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'test-results'
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                        }`}
                    >
                        Hasil Pengujian Model ARIMAX
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'evaluation' ? (
                    <>
                        {/* Info Card */}
                        <div className="rounded-lg border border-neutral-200 bg-blue-50 p-4 shadow-sm dark:border-blue-900/20 dark:bg-neutral-900">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/40">
                                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                                        Evaluasi Parameter Model ARIMAX
                                    </p>
                                    <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">
                                        Tabel berikut menampilkan hasil evaluasi setiap kombinasi parameter (p, d, q) berdasarkan kriteria stabilitas, invertibility, dan signifikansi statistik.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Parameter Evaluation Table */}
                        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                                <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                    Tabel Evaluasi Parameter Model ARIMAX
                                </h2>
                            </div>

                            {parameterEvaluations.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                        Belum ada data untuk evaluasi
                                    </p>
                                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                        Unggah data latih terlebih dahulu untuk melakukan evaluasi model
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                    Model
                                                </th>
                                                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                    Parameter (p,d,q)
                                                </th>
                                                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                    Stabilitas
                                                </th>
                                                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                    Invertibility
                                                </th>
                                                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                    Signifikansi
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                    AIC
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                    BIC
                                                </th>
                                                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                    Alasan
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                            {parameterEvaluations.map((evaluation, index) => {
                                                const isAccepted = evaluation.status === 'Diterima';
                                                return (
                                                    <tr
                                                        key={index}
                                                        className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${
                                                            isAccepted
                                                                ? 'bg-green-50/50 dark:bg-green-900/10'
                                                                : ''
                                                        }`}
                                                    >
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            <span className="text-sm font-medium font-mono text-neutral-900 dark:text-white">
                                                                {evaluation.model}
                                                            </span>
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-neutral-900 dark:text-white">
                                                            ({evaluation.p}, {evaluation.d}, {evaluation.q})
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-center">
                                                            {evaluation.stability ? (
                                                                <CheckCircle2 className="mx-auto h-5 w-5 text-green-600 dark:text-green-400" />
                                                            ) : (
                                                                <span className="text-sm text-red-600 dark:text-red-400">✗</span>
                                                            )}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-center">
                                                            {evaluation.invertibility ? (
                                                                <CheckCircle2 className="mx-auto h-5 w-5 text-green-600 dark:text-green-400" />
                                                            ) : (
                                                                <span className="text-sm text-red-600 dark:text-red-400">✗</span>
                                                            )}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-center">
                                                            {evaluation.significance ? (
                                                                <CheckCircle2 className="mx-auto h-5 w-5 text-green-600 dark:text-green-400" />
                                                            ) : (
                                                                <span className="text-sm text-red-600 dark:text-red-400">✗</span>
                                                            )}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-mono text-neutral-900 dark:text-white">
                                                            {evaluation.aic !== null ? evaluation.aic.toFixed(2) : '-'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-mono text-neutral-900 dark:text-white">
                                                            {evaluation.bic !== null ? evaluation.bic.toFixed(2) : '-'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-center">
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                                    isAccepted
                                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                                }`}
                                                            >
                                                                {evaluation.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-neutral-700 dark:text-neutral-300">
                                                            {evaluation.alasan}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                ) : activeTab === 'accepted' ? (
                    <>
                        {/* Info Card */}
                        <div className="rounded-lg border border-neutral-200 bg-blue-50 p-4 shadow-sm dark:border-blue-900/20 dark:bg-neutral-900">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/40">
                                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                                        Informasi Daerah yang Diterima
                                    </p>
                                    <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">
                                        Tabel berikut menunjukkan parameter, batasan, dan kondisi penerimaan untuk memastikan kombinasi parameter memenuhi kriteria kestabilan dan signifikansi model ARIMAX.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                                <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                    Daerah yang Diterima
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Model
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Batasan
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Kondisi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                        {acceptedRegions.map((region, index) => (
                                            <tr
                                                key={index}
                                                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                            >
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                                                        <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                                            {region.model}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-neutral-900 dark:text-white font-mono">
                                                        {region.batasan}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                                        {region.kondisi}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <h3 className="mb-4 text-base font-medium text-neutral-900 dark:text-white">
                                Penjelasan Konsep
                            </h3>
                            <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                                <div>
                                    <p className="font-medium text-neutral-900 dark:text-white mb-1">
                                        Stationarity (Kestasioneran)
                                    </p>
                                    <p>
                                        Model AR harus memenuhi kondisi stationarity, yaitu semua akar karakteristik dari persamaan polinomial AR berada di dalam unit circle (|φ| &lt; 1).
                                    </p>
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900 dark:text-white mb-1">
                                        Invertibility (Keterbalikan)
                                    </p>
                                    <p>
                                        Model MA harus memenuhi kondisi invertibility, yaitu semua akar karakteristik dari persamaan polinomial MA berada di dalam unit circle (|θ| &lt; 1).
                                    </p>
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900 dark:text-white mb-1">
                                        Signifikansi Statistik
                                    </p>
                                    <p>
                                        Parameter model harus signifikan secara statistik (|t-stat| &gt; 1.96 untuk α = 0.05) untuk memastikan parameter tersebut memberikan kontribusi yang berarti terhadap model.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : activeTab === 'estimation' ? (
                    <>
                        {/* Info Card */}
                        <div className="rounded-lg border border-neutral-200 bg-green-50 p-4 shadow-sm dark:border-green-900/20 dark:bg-neutral-900">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/40">
                                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-900 dark:text-green-200">
                                        Hasil Estimasi Parameter Model ARIMAX
                                    </p>
                                    <p className="mt-1 text-xs text-green-800 dark:text-green-300">
                                        Tabel berikut menampilkan nilai estimasi, standar error, z-value, dan p-value untuk menilai signifikansi masing-masing parameter dalam model.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Parameter Estimation Table */}
                        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                                <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                    Estimasi Parameter Model ARIMAX
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Parameter
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Estimasi
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Std Error
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Z-Value
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                P-Value
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                        {parameterEstimations.map((param, index) => {
                                            const isSignificant = param.p_value < 0.05;
                                            return (
                                                <tr
                                                    key={index}
                                                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                                >
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {isSignificant && (
                                                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                                                            )}
                                                            <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                                                {param.parameter}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-neutral-900 dark:text-white font-mono">
                                                        {param.estimasi.toFixed(4)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-neutral-700 dark:text-neutral-300 font-mono">
                                                        {param.std_error.toFixed(4)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-neutral-900 dark:text-white font-mono">
                                                        {param.z_value.toFixed(2)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right">
                                                        <span
                                                            className={`text-sm font-mono ${
                                                                isSignificant
                                                                    ? 'text-green-600 dark:text-green-400 font-semibold'
                                                                    : 'text-neutral-700 dark:text-neutral-300'
                                                            }`}
                                                        >
                                                            {param.p_value.toFixed(4)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Model Summary Section */}
                        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                                <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                    Ringkasan Model Terbaik
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                            Model
                                        </p>
                                        <p className="text-lg font-semibold text-neutral-900 dark:text-white font-mono">
                                            {modelSummary?.model ?? '-'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                            AIC
                                        </p>
                                        <p className="text-lg font-semibold text-neutral-900 dark:text-white font-mono">
                                            {modelSummary?.aic.toFixed(2) ?? '-'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                            BIC
                                        </p>
                                        <p className="text-lg font-semibold text-neutral-900 dark:text-white font-mono">
                                            {modelSummary?.bic.toFixed(2) ?? '-'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                            Log Likelihood
                                        </p>
                                        <p className="text-lg font-semibold text-neutral-900 dark:text-white font-mono">
                                            {modelSummary?.log_likelihood.toFixed(2) ?? '-'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                            Sigma²
                                        </p>
                                        <p className="text-lg font-semibold text-neutral-900 dark:text-white font-mono">
                                            {modelSummary?.sigma2.toFixed(4) ?? '-'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                                            Total Observasi
                                        </p>
                                        <p className="text-lg font-semibold text-neutral-900 dark:text-white font-mono">
                                            {modelSummary?.total_observations ?? '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Info Card */}
                        <div className="rounded-lg border border-neutral-200 bg-purple-50 p-4 shadow-sm dark:border-purple-900/20 dark:bg-neutral-900">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/40">
                                    <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                                        Hasil Pengujian Model ARIMAX
                                    </p>
                                    <p className="mt-1 text-xs text-purple-800 dark:text-purple-300">
                                        Perbandingan performa beberapa model ARIMAX menggunakan metrik MAPE, MAE, dan RMSE untuk menentukan model terbaik.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Test Results Table */}
                        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                                <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                    Hasil Pengujian Model ARIMAX
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                        <tr>
                                            <th
                                                rowSpan={2}
                                                className="border-r border-neutral-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
                                            >
                                                Nomor
                                            </th>
                                            <th
                                                rowSpan={2}
                                                className="border-r border-neutral-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
                                            >
                                                Ketinggian Gelombang (m)
                                            </th>
                                            <th
                                                colSpan={3}
                                                className="border-b border-neutral-200 px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
                                            >
                                                Model ARIMAX
                                            </th>
                                        </tr>
                                        <tr>
                                            {modelMetrics.map((metric, index) => (
                                                <th
                                                    key={index}
                                                    className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300 ${
                                                        index < modelMetrics.length - 1
                                                            ? 'border-r border-neutral-200 dark:border-neutral-700'
                                                            : ''
                                                    }`}
                                                >
                                                    <div className="space-y-1">
                                                        <div>{metric.model}</div>
                                                        <div className="text-[10px] font-normal text-neutral-500 dark:text-neutral-400">
                                                            MAPE: {metric.mape.toFixed(2)}%
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                        {testResults.map((result) => (
                                            <tr
                                                key={result.nomor}
                                                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                            >
                                                <td className="whitespace-nowrap border-r border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-900 dark:border-neutral-700 dark:text-white">
                                                    {result.nomor}
                                                </td>
                                                <td className="whitespace-nowrap border-r border-neutral-200 px-4 py-3 text-sm text-neutral-900 dark:border-neutral-700 dark:text-white">
                                                    {result.ketinggian_gelombang.toFixed(2)}
                                                </td>
                                                <td className="whitespace-nowrap border-r border-neutral-200 px-4 py-3 text-center text-sm text-neutral-900 dark:border-neutral-700 dark:text-white">
                                                    {result.arimax_1_1_0.toFixed(2)}
                                                </td>
                                                <td className="whitespace-nowrap border-r border-neutral-200 px-4 py-3 text-center text-sm text-neutral-900 dark:border-neutral-700 dark:text-white">
                                                    {result.arimax_0_0_1.toFixed(2)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-neutral-900 dark:text-white">
                                                    {result.arimax_2_1_0.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Model Metrics Summary */}
                        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                                <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                    Metrik Evaluasi Model
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Model
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                MAPE (%)
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                MAE (m)
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                RMSE (m)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                        {modelMetrics.map((metric, index) => {
                                            const isBest = bestModelSummary && metric.model === bestModelSummary.model;
                                            return (
                                                <tr
                                                    key={index}
                                                    className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${
                                                        isBest
                                                            ? 'bg-green-50 dark:bg-green-900/20'
                                                            : ''
                                                    }`}
                                                >
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {isBest && (
                                                                <Award className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                                                            )}
                                                            <span
                                                                className={`text-sm font-medium font-mono ${
                                                                    isBest
                                                                        ? 'text-green-700 dark:text-green-300'
                                                                        : 'text-neutral-900 dark:text-white'
                                                                }`}
                                                            >
                                                                {metric.model}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-mono text-neutral-900 dark:text-white">
                                                        {metric.mape.toFixed(2)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-mono text-neutral-900 dark:text-white">
                                                        {metric.mae.toFixed(3)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-mono text-neutral-900 dark:text-white">
                                                        {metric.rmse.toFixed(3)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Best Model Summary */}
                        {bestModelSummary && (
                            <div className="rounded-lg border border-green-200 bg-green-50 p-6 shadow-sm dark:border-green-800 dark:bg-green-900/20">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/40">
                                        <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="mb-2 text-base font-semibold text-green-900 dark:text-green-200">
                                            Ringkasan Model Terbaik
                                        </h3>
                                        <div className="mb-3 space-y-1">
                                            <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                                Model: <span className="font-mono">{bestModelSummary.model}</span>
                                            </p>
                                            <div className="grid grid-cols-3 gap-4 text-xs">
                                                <div>
                                                    <span className="text-green-700 dark:text-green-400">MAPE: </span>
                                                    <span className="font-mono font-semibold text-green-900 dark:text-green-200">
                                                        {bestModelSummary.mape.toFixed(2)}%
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-green-700 dark:text-green-400">MAE: </span>
                                                    <span className="font-mono font-semibold text-green-900 dark:text-green-200">
                                                        {bestModelSummary.mae.toFixed(3)} m
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-green-700 dark:text-green-400">RMSE: </span>
                                                    <span className="font-mono font-semibold text-green-900 dark:text-green-200">
                                                        {bestModelSummary.rmse.toFixed(3)} m
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-green-800 dark:text-green-300">
                                            {bestModelSummary.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}


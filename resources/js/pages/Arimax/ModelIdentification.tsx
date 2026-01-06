/**
 * Komponen Halaman Identifikasi Model ARIMAX
 * 
 * Halaman ini menampilkan hasil identifikasi dan evaluasi berbagai kombinasi parameter ARIMAX (p, d, q).
 * Tujuannya adalah menemukan model ARIMAX terbaik berdasarkan kriteria statistik dan performa prediksi.
 * 
 * Fitur utama:
 * - Evaluasi parameter: Menampilkan evaluasi setiap kombinasi (p, d, q) berdasarkan performa prediksi (MAPE)
 * - Daerah yang diterima: Menampilkan batasan dan kondisi penerimaan parameter
 * - Estimasi parameter: Menampilkan nilai estimasi, standar error, z-value, dan p-value untuk model terbaik
 * - Hasil pengujian: Membandingkan performa beberapa model ARIMAX menggunakan metrik MAPE
 * 
 * Catatan: Semua data (evaluasi parameter, estimasi parameter, hasil pengujian) diambil dari Python/FastAPI
 * yang menggunakan statsmodels untuk akurasi yang lebih tinggi. PHP hanya digunakan sebagai fallback jika Python tidak tersedia.
 */

import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Award, CheckCircle2, Info, TrendingUp, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { LoadingOverlay } from '@/components/loading-overlay';
import { TableSkeleton } from '@/components/table-skeleton';
import { CardSkeleton } from '@/components/card-skeleton';
import { useNavigationState } from '@/hooks/use-navigation-state';

// Breadcrumb untuk navigasi halaman
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

/**
 * Interface untuk daerah parameter yang diterima
 */
interface AcceptedRegion {
    model: string; // Nama model (misalnya: ARIMAX(1,1,0))
    batasan: string; // Batasan parameter (misalnya: |φ| < 1)
    kondisi: string; // Kondisi penerimaan (misalnya: Stationarity)
}

/**
 * Interface untuk estimasi parameter model
 */
interface ParameterEstimation {
    parameter: string; // Nama parameter (misalnya: ar.L1, ma.L1)
    estimasi: number; // Nilai estimasi parameter
    std_error: number; // Standar error dari estimasi
    z_value: number; // Z-value (statistik uji)
    p_value: number; // P-value (tingkat signifikansi)
}

/**
 * Interface untuk ringkasan model
 */
interface ModelSummary {
    model: string; // Nama model
    aic: number; // Akaike Information Criterion
    bic: number; // Bayesian Information Criterion
    log_likelihood: number; // Log likelihood
    sigma2: number; // Varians residual
    total_observations: number; // Total observasi yang digunakan
}

/**
 * Interface untuk hasil pengujian model pada data uji
 */
interface TestResult {
    nomor: number; // Nomor urut data uji
    ketinggian_gelombang: number; // Nilai aktual tinggi gelombang
    [key: string]: number | string | null; // Kolom dinamis untuk setiap model ARIMAX (contoh: arimax_0_1_1, arimax_1_1_0, dll)
}

/**
 * Interface untuk metrik evaluasi model
 */
interface ModelMetric {
    model: string; // Nama model
    mape_train: number | null; // MAPE pada data training (diagnostic only)
    mape_val: number | null; // MAPE pada data validasi (untuk tuning)
    mape: number; // MAPE pada data test (FINAL EVALUATION - generalization)
    gap_val_test?: number | null; // Gap antara validation dan test MAPE (stability indicator)
    complexity?: number; // Kompleksitas model (p+d+q) untuk parsimony
}

/**
 * Interface untuk ringkasan model terbaik
 */
interface BestModelSummary {
    model: string; // Nama model terbaik
    mape_train?: number | null; // MAPE training dari model terbaik
    mape_val?: number | null; // MAPE validation dari model terbaik
    mape: number; // MAPE test dari model terbaik (FINAL EVALUATION)
    gap_val_test?: number | null; // Gap antara validation dan test
    complexity?: number; // Kompleksitas model
    description: string; // Deskripsi mengapa model ini terbaik (dengan metodologi)
}


/**
 * Interface untuk evaluasi parameter model
 */
interface ParameterEvaluation {
    model: string; // Nama model
    p: number; // Orde AR
    d: number; // Orde differencing
    q: number; // Orde MA
    stability: boolean; // Apakah model stabil (stationarity)
    invertibility: boolean; // Apakah model invertible
    significance: boolean; // Apakah parameter signifikan secara statistik
    aic: number | null; // AIC (jika tersedia)
    bic: number | null; // BIC (jika tersedia)
    mape_train?: number | null; // MAPE pada data training (diagnostic only)
    mape_val?: number | null; // MAPE pada data validasi (untuk tuning parameter)
    status: 'Diterima' | 'Ditolak'; // Status penerimaan model
    alasan: string; // Alasan diterima atau ditolak
}

/**
 * Props yang diterima oleh komponen ModelIdentification
 */
interface Props {
    acceptedRegions: AcceptedRegion[]; // Daerah parameter yang diterima
    parameterEvaluations?: ParameterEvaluation[]; // Evaluasi setiap kombinasi parameter
    parameterEstimations: ParameterEstimation[]; // Estimasi parameter model terbaik
    modelSummary: ModelSummary | null; // Ringkasan model terbaik
    testResults: TestResult[]; // Hasil pengujian model pada data uji (dari Python)
    modelMetrics: ModelMetric[]; // Metrik evaluasi untuk setiap model (dari Python)
    bestModelSummary: BestModelSummary | null; // Ringkasan model terbaik berdasarkan MAPE (dari Python)
}

/**
 * Komponen utama untuk halaman Identifikasi Model ARIMAX
 */
export default function ModelIdentification({
    acceptedRegions,
    parameterEvaluations = [],
    parameterEstimations,
    modelSummary,
    testResults = [],
    modelMetrics = [],
    bestModelSummary = null,
}: Props) {
    /**
     * State untuk mengelola tab aktif (evaluation, accepted, estimation, test-results).
     * Default: 'evaluation' (tab Evaluasi Parameter).
     */
    const [activeTab, setActiveTab] = useState<'evaluation' | 'accepted' | 'estimation' | 'test-results'>('evaluation');
    
    /**
     * State untuk mengelola loading dan hasil training model.
     */
    const [trainingState, setTrainingState] = useState<{
        loading: boolean;
        result: { arimax_mape: number; order: { p: number; d: number; q: number } } | null;
        error: string | null;
    }>({
        loading: false,
        result: null,
        error: null,
    });
    
    /**
     * Mengambil flash messages dan errors dari page props.
     */
    const { flash, errors } = usePage().props as {
        flash?: { training_success?: boolean; arimax_mape?: number; training_order?: { p: number; d: number; q: number } };
        errors?: { training_error?: string };
    };
    
    /**
     * Effect untuk handle flash messages setelah training selesai.
     */
    useEffect(() => {
        // Check flash messages
        if (flash?.training_success) {
            setTrainingState({
                loading: false,
                result: {
                    arimax_mape: flash.arimax_mape || 0,
                    order: flash.training_order || { p: 0, d: 0, q: 0 },
                },
                error: null,
            });
            // Reload halaman untuk mendapatkan data terbaru setelah 1 detik
            setTimeout(() => {
                router.reload({ only: ['modelMetrics', 'bestModelSummary', 'testResults'] });
            }, 1000);
        }
        
        // Check errors - handle both object and array format
        if (errors && typeof errors === 'object') {
            const trainingError = (errors as any)?.training_error;
            if (trainingError) {
                const errorMessage = Array.isArray(trainingError) ? trainingError[0] : trainingError;
                setTrainingState({
                    loading: false,
                    result: null,
                    error: errorMessage,
                });
            }
        }
    }, [flash, errors]);
    
    /**
     * Handler untuk training model ARIMAX dan Hybrid.
     * Memanggil endpoint /train/hybrid/sync yang merupakan SINGLE SOURCE OF TRUTH.
     * Menggunakan router.post dari Inertia untuk handle CSRF token otomatis.
     * 
     * @param p Orde AR (opsional)
     * @param d Orde differencing (opsional)
     * @param q Orde MA (opsional)
     */
    const handleTrainModel = (p?: number, d?: number, q?: number) => {
        setTrainingState({ loading: true, result: null, error: null });
        
        const payload: { p?: number; d?: number; q?: number } = {};
        if (p !== undefined && d !== undefined && q !== undefined) {
            payload.p = p;
            payload.d = d;
            payload.q = q;
        }
        
        router.post('/arimax/train-model', payload, {
            preserveScroll: true,
            preserveState: false, // Set false agar flash messages bisa di-load
            onSuccess: () => {
                // Flash messages akan di-handle oleh useEffect
            },
            onError: (errors) => {
                setTrainingState({
                    loading: false,
                    result: null,
                    error: errors?.training_error || errors?.message || 'Training failed',
                });
            },
            onFinish: () => {
                // Fallback: jika setelah 2 detik masih loading, reset state
                setTimeout(() => {
                    setTrainingState(prev => {
                        if (prev.loading) {
                            return { ...prev, loading: false };
                        }
                        return prev;
                    });
                }, 2000);
            },
        });
    };
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
                                        Tabel berikut menampilkan hasil evaluasi setiap kombinasi parameter (p, d, q) berdasarkan performa prediksi (MAPE).
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
                                                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                    MAPE Training (%)
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                    MAPE Validasi (%)
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
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-mono text-neutral-500 dark:text-neutral-400">
                                                            {evaluation.mape_train !== null && evaluation.mape_train !== undefined
                                                                ? `${evaluation.mape_train.toFixed(2)}%`
                                                                : '-'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-mono text-neutral-900 dark:text-white">
                                                            {evaluation.mape_val !== null && evaluation.mape_val !== undefined
                                                                ? `${evaluation.mape_val.toFixed(2)}%`
                                                                : '-'}
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
                ) : activeTab === 'test-results' ? (
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
                                        Perbandingan performa beberapa model ARIMAX menggunakan metrik MAPE pada training, validation, dan test set. Hasil ini dihitung menggunakan model yang dilatih dengan statsmodels di Python untuk akurasi yang lebih tinggi.
                                    </p>
                                    <p className="mt-2 text-xs text-purple-700 dark:text-purple-400 italic">
                                        <strong>Metodologi Pemilihan Model:</strong> Model dipilih berdasarkan kombinasi Test MAPE (generalisasi), gap validation-test (stabilitas), dan kompleksitas (parsimony). Validation MAPE digunakan untuk tuning parameter, bukan final selection. Model sederhana dipilih jika performa test setara.
                                    </p>
                                    <p className="mt-1 text-xs text-purple-600 dark:text-purple-500 italic">
                                        Catatan: Klik tombol "Latih Model" untuk melakukan training ulang model dengan data terbaru. MAPE yang ditampilkan akan konsisten dengan halaman "Evaluasi Hybrid".
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Training Button Section */}
                        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-medium text-neutral-900 dark:text-white">
                                        Training Model
                                    </h3>
                                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                        Latih model ARIMAX dan Hybrid dengan data terbaru. MAPE ARIMAX akan ditampilkan setelah training selesai.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => handleTrainModel()}
                                    disabled={trainingState.loading}
                                    className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                                >
                                    {trainingState.loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Training...
                                        </>
                                    ) : (
                                        <>
                                            <TrendingUp className="mr-2 h-4 w-4" />
                                            Latih Model
                                        </>
                                    )}
                                </Button>
                            </div>
                            
                            {/* Training Result */}
                            {trainingState.result && (
                                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        <div>
                                            <p className="text-sm font-medium text-green-900 dark:text-green-200">
                                                Training Berhasil
                                            </p>
                                            <p className="mt-1 text-xs text-green-800 dark:text-green-300">
                                                Model: <span className="font-mono">ARIMAX({trainingState.result.order.p},{trainingState.result.order.d},{trainingState.result.order.q})</span> | MAPE: <span className="font-mono font-semibold">{trainingState.result.arimax_mape.toFixed(2)}%</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Training Error */}
                            {trainingState.error && (
                                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        <div>
                                            <p className="text-sm font-medium text-red-900 dark:text-red-200">
                                                Training Gagal
                                            </p>
                                            <p className="mt-1 text-xs text-red-800 dark:text-red-300">
                                                {trainingState.error}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Test Results Table */}
                        {testResults.length > 0 && modelMetrics.length > 0 ? (
                            <>
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
                                                        colSpan={modelMetrics.length}
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
                                                                    Test: {metric.mape.toFixed(2)}%
                                                                </div>
                                                                {metric.mape_val !== null && metric.mape_val !== undefined && (
                                                                    <div className="text-[10px] font-normal text-neutral-500 dark:text-neutral-400">
                                                                        Val: {metric.mape_val.toFixed(2)}%
                                                                    </div>
                                                                )}
                                                                {metric.mape_train !== null && metric.mape_train !== undefined && (
                                                                    <div className="text-[10px] font-normal text-neutral-400 dark:text-neutral-500">
                                                                        Train: {metric.mape_train.toFixed(2)}%
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                                {testResults.map((result) => {
                                                    // Fungsi helper untuk mengkonversi nama model ke key yang digunakan di testResult
                                                    // Contoh: "ARIMAX(0,1,1)" -> "arimax_0_1_1"
                                                    const modelToKey = (modelName: string): string => {
                                                        return modelName
                                                            .toLowerCase()
                                                            .replace(/\(/g, '_')
                                                            .replace(/\)/g, '')
                                                            .replace(/,/g, '_');
                                                    };

                                                    return (
                                                        <tr
                                                            key={result.nomor}
                                                            className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                                        >
                                                            <td className="whitespace-nowrap border-r border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-900 dark:border-neutral-700 dark:text-white">
                                                                {result.nomor}
                                                            </td>
                                                            <td className="whitespace-nowrap border-r border-neutral-200 px-4 py-3 text-sm text-neutral-900 dark:border-neutral-700 dark:text-white">
                                                                {result.ketinggian_gelombang !== null
                                                                    ? typeof result.ketinggian_gelombang === 'number'
                                                                        ? result.ketinggian_gelombang.toFixed(2)
                                                                        : result.ketinggian_gelombang
                                                                    : '-'}
                                                            </td>
                                                            {modelMetrics.map((metric, index) => {
                                                                const modelKey = modelToKey(metric.model);
                                                                const prediction = result[modelKey] as number | null | undefined;
                                                                const isLast = index === modelMetrics.length - 1;

                                                                return (
                                                                    <td
                                                                        key={index}
                                                                        className={`whitespace-nowrap px-4 py-3 text-center text-sm text-neutral-900 dark:text-white ${
                                                                            !isLast
                                                                                ? 'border-r border-neutral-200 dark:border-neutral-700'
                                                                                : ''
                                                                        }`}
                                                                    >
                                                                        {prediction !== null && prediction !== undefined
                                                                            ? typeof prediction === 'number'
                                                                                ? prediction.toFixed(2)
                                                                                : prediction
                                                                            : '-'}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
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
                                                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                                        MAPE Training (%)
                                                    </th>
                                                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                        MAPE Validasi (%)
                                                    </th>
                                                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-900 dark:text-neutral-100 font-semibold">
                                                        MAPE Test (%)
                                                    </th>
                                                    {modelMetrics.some(m => m.gap_val_test !== null && m.gap_val_test !== undefined) && (
                                                        <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                                            Gap Val-Test (%)
                                                        </th>
                                                    )}
                                                    {modelMetrics.some(m => m.complexity !== null && m.complexity !== undefined) && (
                                                        <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                                            Kompleksitas
                                                        </th>
                                                    )}
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
                                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-mono text-neutral-500 dark:text-neutral-400">
                                                                {metric.mape_train !== null && metric.mape_train !== undefined
                                                                    ? metric.mape_train.toFixed(2)
                                                                    : '-'}
                                                            </td>
                                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-mono text-neutral-700 dark:text-neutral-300">
                                                                {metric.mape_val !== null && metric.mape_val !== undefined
                                                                    ? metric.mape_val.toFixed(2)
                                                                    : '-'}
                                                            </td>
                                                            <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-mono font-semibold ${
                                                                isBest
                                                                    ? 'text-green-700 dark:text-green-300'
                                                                    : 'text-neutral-900 dark:text-white'
                                                            }`}>
                                                                {metric.mape.toFixed(2)}
                                                            </td>
                                                            {modelMetrics.some(m => m.gap_val_test !== null && m.gap_val_test !== undefined) && (
                                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-mono text-neutral-600 dark:text-neutral-400">
                                                                    {metric.gap_val_test !== null && metric.gap_val_test !== undefined
                                                                        ? metric.gap_val_test.toFixed(2)
                                                                        : '-'}
                                                                </td>
                                                            )}
                                                            {modelMetrics.some(m => m.complexity !== null && m.complexity !== undefined) && (
                                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm font-mono text-neutral-600 dark:text-neutral-400">
                                                                    {metric.complexity !== null && metric.complexity !== undefined
                                                                        ? metric.complexity
                                                                        : '-'}
                                                                </td>
                                                            )}
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
                                                <div className="mb-3 space-y-2">
                                                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                                        Model: <span className="font-mono">{bestModelSummary.model}</span>
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        {bestModelSummary.mape_train !== null && bestModelSummary.mape_train !== undefined && (
                                                            <div>
                                                                <span className="text-green-600 dark:text-green-400">MAPE Training: </span>
                                                                <span className="font-mono text-green-700 dark:text-green-300">
                                                                    {bestModelSummary.mape_train.toFixed(2)}%
                                                                </span>
                                                                <span className="text-green-500 dark:text-green-500 text-[10px] ml-1">(diagnostik)</span>
                                                            </div>
                                                        )}
                                                        {bestModelSummary.mape_val !== null && bestModelSummary.mape_val !== undefined && (
                                                            <div>
                                                                <span className="text-green-600 dark:text-green-400">MAPE Validasi: </span>
                                                                <span className="font-mono text-green-700 dark:text-green-300">
                                                                    {bestModelSummary.mape_val.toFixed(2)}%
                                                                </span>
                                                                <span className="text-green-500 dark:text-green-500 text-[10px] ml-1">(penyetelan)</span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="text-green-700 dark:text-green-400 font-semibold">MAPE Test: </span>
                                                            <span className="font-mono font-semibold text-green-900 dark:text-green-200">
                                                                {bestModelSummary.mape.toFixed(2)}%
                                                            </span>
                                                            <span className="text-green-500 dark:text-green-500 text-[10px] ml-1">(evaluasi akhir)</span>
                                                        </div>
                                                        {bestModelSummary.gap_val_test !== null && bestModelSummary.gap_val_test !== undefined && (
                                                            <div>
                                                                <span className="text-green-600 dark:text-green-400">Gap Val-Test: </span>
                                                                <span className="font-mono text-green-700 dark:text-green-300">
                                                                    {bestModelSummary.gap_val_test.toFixed(2)}%
                                                                </span>
                                                                <span className="text-green-500 dark:text-green-500 text-[10px] ml-1">(stabilitas)</span>
                                                            </div>
                                                        )}
                                                        {bestModelSummary.complexity !== null && bestModelSummary.complexity !== undefined && (
                                                            <div>
                                                                <span className="text-green-600 dark:text-green-400">Kompleksitas: </span>
                                                                <span className="font-mono text-green-700 dark:text-green-300">
                                                                    {bestModelSummary.complexity}
                                                                </span>
                                                                <span className="text-green-500 dark:text-green-500 text-[10px] ml-1">(p+d+q)</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-4 rounded-md bg-white/50 dark:bg-neutral-800/50 p-4">
                                                    <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-2">
                                                        Alasan Pemilihan Model:
                                                    </p>
                                                    <div className="text-sm text-green-800 dark:text-green-300 space-y-2">
                                                        <p>
                                                            Model <span className="font-mono font-semibold">{bestModelSummary.model}</span> dipilih sebagai model terbaik berdasarkan:
                                                        </p>
                                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                                            <li>
                                                                <strong>MAPE Test {bestModelSummary.mape.toFixed(2)}%</strong> - Kriteria utama untuk menilai kemampuan model dalam memprediksi data baru
                                                            </li>
                                                            {bestModelSummary.mape_val !== null && bestModelSummary.mape_val !== undefined && (
                                                                <li>
                                                                    <strong>MAPE Validasi {bestModelSummary.mape_val.toFixed(2)}%</strong> - Digunakan untuk menyetel parameter model
                                                                </li>
                                                            )}
                                                            {bestModelSummary.mape_train !== null && bestModelSummary.mape_train !== undefined && (
                                                                <li>
                                                                    <strong>MAPE Training {bestModelSummary.mape_train.toFixed(2)}%</strong> - Untuk melihat seberapa baik model mempelajari data latih
                                                                </li>
                                                            )}
                                                            {bestModelSummary.gap_val_test !== null && bestModelSummary.gap_val_test !== undefined && (
                                                                <li>
                                                                    <strong>Gap Val-Test {bestModelSummary.gap_val_test.toFixed(2)}%</strong> - Menunjukkan stabilitas model (semakin kecil semakin baik)
                                                                </li>
                                                            )}
                                                            {bestModelSummary.complexity !== null && bestModelSummary.complexity !== undefined && (
                                                                <li>
                                                                    <strong>Kompleksitas {bestModelSummary.complexity}</strong> - Model yang lebih sederhana dipilih jika performa setara
                                                                </li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <Award className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
                                <p className="mt-4 text-sm font-medium text-neutral-900 dark:text-white">
                                    Belum ada hasil pengujian
                                </p>
                                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                    Hasil pengujian akan muncul setelah model ARIMAX dievaluasi menggunakan Python
                                </p>
                            </div>
                        )}
                    </>
                ) : null}
            </div>
        </AppLayout>
    );
}

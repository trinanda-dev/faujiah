/**
 * Komponen Halaman Identifikasi Model ARIMAX
 * 
 * Halaman ini menampilkan hasil identifikasi dan evaluasi berbagai kombinasi parameter ARIMAX (p, d, q).
 * Tujuannya adalah menemukan model ARIMAX terbaik berdasarkan kriteria statistik dan performa prediksi.
 * 
 * Fitur utama:
 * - Evaluasi parameter: Menampilkan evaluasi setiap kombinasi (p, d, q) berdasarkan performa prediksi (MAPE)
 * - Daerah yang diterima: Menampilkan batasan dan kondisi penerimaan parameter
 * - Hasil pengujian: Membandingkan performa beberapa model ARIMAX menggunakan metrik MAPE
 * 
 * Catatan: Semua data (evaluasi parameter, estimasi parameter, hasil pengujian) diambil dari Python/FastAPI
 * yang menggunakan statsmodels untuk akurasi yang lebih tinggi. PHP hanya digunakan sebagai fallback jika Python tidak tersedia.
 */

import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Award, CheckCircle2, Info, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
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
 * Interface untuk estimasi parameter model (model terbaik)
 * Termasuk AR, MA, eksogen (ARMA/ARIMAX). Opsional: daerah_diterima, kondisi.
 */
interface ParameterEstimation {
    parameter: string;
    estimasi: number;
    std_error: number;
    z_value: number;
    p_value: number;
    daerah_diterima?: string;
    kondisi?: string;
    /** T-Tabel (nilai kritis) untuk Tabel 43 uji signifikansi */
    t_tabel?: number;
    /** Signifikan / Tidak Signifikan untuk Tabel 43 */
    signifikansi?: string;
}

/** Satu baris estimasi parameter dengan nama model (untuk tabel semua model) */
interface ParameterEstimationRow extends ParameterEstimation {
    model: string;
}

/**
 * Interface untuk ringkasan model (AIC, BIC, dll.)
 */
interface ModelSummary {
    model: string;
    aic: number;
    bic: number;
    log_likelihood: number;
    sigma2: number;
    total_observations: number;
}

/**
 * Satu baris residual training ARIMAX (data latih)
 */
interface TrainingResidualRow {
    nomor: number;
    tanggal: string;
    actual: number;
    fitted: number;
    residual: number;
}

/**
 * Props yang diterima oleh komponen ModelIdentification
 */
interface Props {
    acceptedRegions: AcceptedRegion[];
    parameterEvaluations?: ParameterEvaluation[];
    parameterEstimations?: ParameterEstimation[];
    /** Estimasi parameter untuk SEMUA model yang dievaluasi (untuk pengambilan keputusan parameter) */
    parameterEstimationsAllModels?: ParameterEstimationRow[];
    modelSummary: ModelSummary | null;
    testResults: TestResult[];
    modelMetrics: ModelMetric[];
    bestModelSummary: BestModelSummary | null;
    trainingResiduals?: TrainingResidualRow[];
}

/**
 * Komponen utama untuk halaman Identifikasi Model ARIMAX
 */
export default function ModelIdentification({
    acceptedRegions,
    parameterEvaluations = [],
    parameterEstimations = [],
    parameterEstimationsAllModels = [],
    modelSummary = null,
    testResults = [],
    modelMetrics = [],
    bestModelSummary = null,
    trainingResiduals = [],
}: Props) {
    /**
     * State untuk mengelola tab aktif.
     */
    const [activeTab, setActiveTab] = useState<'evaluation' | 'accepted' | 'test-results' | 'training-results'>('evaluation');
    
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
                <div className="flex flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
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
                        onClick={() => setActiveTab('test-results')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'test-results'
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                        }`}
                    >
                        Hasil Pengujian Model ARIMAX
                    </button>
                    <button
                        onClick={() => setActiveTab('training-results')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'training-results'
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                        }`}
                    >
                        Hasil Training
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
                                        Tabel berikut menunjukkan parameter, batasan, dan kondisi penerimaan untuk memastikan kombinasi parameter memenuhi kriteria kestabilan dan signifikansi model ARIMAX. Termasuk komponen <strong>AR(p)</strong>, <strong>MA(q)</strong>, dan <strong>ARMA(p,q)</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Daerah yang Diterima: AR(p), MA(q), ARMA(p,q), ARIMAX, Signifikansi */}
                        {(() => {
                            const defaultRegions: AcceptedRegion[] = [
                                { model: 'AR(p)', batasan: '|φ| < 1', kondisi: 'Semua akar karakteristik berada di dalam unit circle' },
                                { model: 'MA(q)', batasan: '|θ| < 1', kondisi: 'Semua akar karakteristik berada di dalam unit circle' },
                                { model: 'ARMA(p,q)', batasan: '|φ| < 1, |θ| < 1', kondisi: 'Kombinasi AR dan MA memenuhi kondisi invertibility dan stationarity' },
                                { model: 'ARIMAX(p,d,q)', batasan: '|φ| < 1, |θ| < 1, d ≥ 0', kondisi: 'Setelah differencing, model ARMA harus stasioner dan invertible' },
                                { model: 'Signifikansi Parameter', batasan: '|t-stat| > 1.96 (α = 0.05)', kondisi: 'Parameter signifikan secara statistik pada tingkat kepercayaan 95%' },
                            ];
                            const displayRegions = acceptedRegions.length >= 3
                                ? acceptedRegions
                                : defaultRegions;
                            const komponenLabel = (model: string) => {
                                if (model.startsWith('AR(p)')) return 'AR';
                                if (model.startsWith('MA(q)')) return 'MA';
                                if (model.startsWith('ARMA')) return 'ARMA';
                                if (model.startsWith('ARIMAX')) return 'ARIMAX';
                                if (model.toLowerCase().includes('signifikansi')) return 'Signifikansi';
                                return 'Lainnya';
                            };
                            return (
                                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                            Daerah yang Diterima
                                        </h2>
                                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                            Komponen AR, MA, dan ARMA beserta batasan dan kondisi penerimaan.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                        Komponen
                                                    </th>
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
                                                {displayRegions.map((region, index) => (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                                    >
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            <span className="inline-flex rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
                                                                {komponenLabel(region.model)}
                                                            </span>
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                                                                <span className="text-sm font-medium text-neutral-900 dark:text-white font-mono">
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
                            );
                        })()}

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
                ) : activeTab === 'test-results' ? (
                    <>
                        {/* Info Card */}
                        <div className="rounded-lg border border-neutral-200 bg-purple-50 p-4 shadow-sm dark:border-purple-900/20 dark:bg-neutral-900">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/40">
                                    <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                                            Hasil Pengujian Model ARIMAX
                                        </p>
                                        <p className="mt-1 text-xs text-purple-800 dark:text-purple-300">
                                            Perbandingan performa beberapa model ARIMAX menggunakan metrik MAPE pada training, validation, dan test set. Hasil ini dihitung menggunakan model yang dilatih dengan statsmodels di Python untuk akurasi yang lebih tinggi.
                                        </p>
                                    </div>
                                    
                                    <div className="rounded-md bg-white/60 dark:bg-neutral-800/60 p-3">
                                        <p className="text-xs font-semibold text-purple-900 dark:text-purple-200 mb-2">
                                            Konsep Pemilihan Model dan Parameter:
                                        </p>
                                        <div className="text-xs text-purple-800 dark:text-purple-300 space-y-2">
                                            <div>
                                                <p className="font-medium mb-1">Parameter Model ARIMAX (p, d, q):</p>
                                                <ul className="list-disc list-inside ml-2 space-y-0.5 text-[11px]">
                                                    <li><strong>p (AR)</strong>: Jumlah lag dari nilai sebelumnya yang digunakan</li>
                                                    <li><strong>d (Differencing)</strong>: Jumlah kali differencing untuk membuat data stasioner</li>
                                                    <li><strong>q (MA)</strong>: Jumlah lag dari error/residual yang digunakan</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="font-medium mb-1">Kriteria Pemilihan Model:</p>
                                                <ul className="list-disc list-inside ml-2 space-y-0.5 text-[11px]">
                                                    <li><strong>1. MAPE Validasi</strong> — Satu-satunya kriteria pemilihan (tuning/penyetelan)</li>
                                                    <li><strong>2. Kompleksitas</strong> — Tie-breaker jika MAPE Validasi sama (parsimony)</li>
                                                    <li><strong>3. Gap Val-Test</strong> — Tie-breaker jika MAPE Validasi sama (stabilitas)</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="font-medium mb-1">Metodologi:</p>
                                                <ul className="list-disc list-inside ml-2 space-y-0.5 text-[11px]">
                                                    <li>Pemilihan model <strong>hanya</strong> berdasarkan MAPE Validasi</li>
                                                    <li>Train/Test MAPE hanya diagnostik; tidak mempengaruhi keputusan model terbaik</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
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

                                {/* Peringatan jika gap Val–Test besar (Train/Val bagus, Test jelek) */}
                                {bestModelSummary &&
                                    bestModelSummary.gap_val_test != null &&
                                    bestModelSummary.gap_val_test >= 15 && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-900/20">
                                            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                                Gap Val–Test besar ({bestModelSummary.gap_val_test.toFixed(1)}%): Train/Val bagus, Test lebih jelek — wajar. Model dipilih berdasarkan MAPE Validasi.
                                            </p>
                                            <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                                                Kemungkinan: overfitting, beda periode/distribusi data test, atau align variabel eksogen. Lihat penjelasan di bawah.
                                            </p>
                                        </div>
                                    )}

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
                                                            Model <span className="font-mono font-semibold">{bestModelSummary.model}</span> dipilih <strong>hanya berdasarkan MAPE Validasi</strong>. Train/Test tidak dipakai untuk pemilihan.
                                                        </p>
                                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                                            {bestModelSummary.mape_val !== null && bestModelSummary.mape_val !== undefined && (
                                                                <li>
                                                                    <strong>MAPE Validasi {bestModelSummary.mape_val.toFixed(2)}%</strong> — satu-satunya kriteria pemilihan
                                                                </li>
                                                            )}
                                                            {bestModelSummary.mape_train !== null && bestModelSummary.mape_train !== undefined && (
                                                                <li>
                                                                    MAPE Training {bestModelSummary.mape_train.toFixed(2)}% — diagnostik saja
                                                                </li>
                                                            )}
                                                            <li>
                                                                MAPE Test {bestModelSummary.mape.toFixed(2)}% — evaluasi out-of-sample (diagnostik)
                                                            </li>
                                                            {bestModelSummary.gap_val_test !== null && bestModelSummary.gap_val_test !== undefined && (
                                                                <li>
                                                                    Gap Val-Test {bestModelSummary.gap_val_test.toFixed(2)}% — tie-breaker jika MAPE Validasi sama
                                                                </li>
                                                            )}
                                                            {bestModelSummary.complexity !== null && bestModelSummary.complexity !== undefined && (
                                                                <li>
                                                                    Kompleksitas {bestModelSummary.complexity} — tie-breaker jika MAPE Validasi sama (parsimony)
                                                                </li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Penjelasan: Mengapa Train/Val bagus tapi Test jelek? */}
                                {testResults.length > 0 && modelMetrics.length > 0 && (
                                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                                        <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">
                                            Mengapa Train/Val bagus tapi Test jelek?
                                        </h3>
                                        <p className="mb-3 text-xs text-neutral-600 dark:text-neutral-400">
                                            Ini wajar dan sering terjadi. Penyebab umum:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                                            <li>
                                                <strong>Overfitting</strong> — Model terlalu mengikuti pola train (dan val yang mirip); pola di data test berbeda sehingga Test jelek.
                                            </li>
                                            <li>
                                                <strong>Perbedaan distribusi/waktu</strong> — Data test dari periode lain (cuaca, musim, level gelombang beda). Train/Val dari periode mirip → bagus; Test dari periode lain → jelek.
                                            </li>
                                            <li>
                                                <strong>Variabel eksogen</strong> — Di test, nilai eksogen salah align (geser waktu) atau tidak tersedia → prediksi ARIMAX bisa meleset.
                                            </li>
                                            <li>
                                                <strong>Test kecil / noise</strong> — Test set kecil atau sangat berisik bisa membuat MAPE Test naik tajam dibanding Val.
                                            </li>
                                        </ul>
                                        <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400">
                                            Model terbaik dipilih berdasarkan <strong>MAPE Validasi</strong>. Train/Test hanya untuk diagnostik.
                                        </p>
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
                ) : activeTab === 'training-results' ? (
                    <>
                        {/* 1️⃣ Informasi Model */}
                        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                                <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                    1️⃣ Informasi Model
                                </h2>
                            </div>
                            <div className="p-6">
                                {modelSummary && modelSummary.model !== 'Tidak ada model yang diterima' ? (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div className="rounded-md bg-neutral-50 p-4 dark:bg-neutral-800/50">
                                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Model</p>
                                            <p className="mt-1 font-mono font-semibold text-neutral-900 dark:text-white">{modelSummary.model}</p>
                                        </div>
                                        <div className="rounded-md bg-neutral-50 p-4 dark:bg-neutral-800/50">
                                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Observasi</p>
                                            <p className="mt-1 font-mono text-neutral-900 dark:text-white">{modelSummary.total_observations}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Belum ada informasi model. Lakukan evaluasi parameter terlebih dahulu.</p>
                                )}
                            </div>
                        </div>

                        {/* 2️⃣ Parameter Model — SEMUA model (untuk pengambilan keputusan parameter) */}
                        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                                <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                    2️⃣ Parameter Model
                                </h2>
                                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                    Termasuk komponen AR, MA, dan eksogen (model ARMA/ARIMAX). Tabel ini menampilkan parameter <strong>semua model yang dievaluasi</strong> (bukan hanya model terbaik) untuk mendukung pengambilan keputusan parameter mana yang tepat.
                                </p>
                                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                    Bandingkan estimasi, daerah diterima, dan signifikansi tiap model (ARIMAX(3,1,1), (2,1,1), (3,1,0), (2,1,0), dll.) lalu pilih model terbaik berdasarkan MAPE Validasi.
                                </p>
                            </div>
                            {(() => {
                                const hasAllModels = parameterEstimationsAllModels.length > 0;
                                const rows: ParameterEstimationRow[] = hasAllModels
                                    ? parameterEstimationsAllModels
                                    : (parameterEstimations ?? []).map((est) => ({ ...est, model: bestModelSummary?.model ?? 'Model terbaik' }));
                                if (rows.length === 0) {
                                    return (
                                        <div className="p-6 text-center text-sm text-neutral-500 dark:text-neutral-400">Belum ada estimasi parameter. Lakukan evaluasi model terlebih dahulu (buka halaman Identifikasi Model dan pastikan data latih sudah diunggah).</div>
                                    );
                                }
                                    const hasDaerah = rows.some((e) => e.daerah_diterima != null);
                                    const hasTabel = rows.some((e) => e.t_tabel != null);
                                    return (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Model</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Parameter</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Nilai Estimasi</th>
                                                        {hasDaerah ? (
                                                            <>
                                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Daerah Diterima</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Kondisi</th>
                                                            </>
                                                        ) : null}
                                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Std Error</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">T-Hitung (Z)</th>
                                                        {hasTabel ? (
                                                            <>
                                                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">T-Tabel</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Signifikansi</th>
                                                            </>
                                                        ) : null}
                                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">P-Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                                    {rows.map((est, idx) => (
                                                            <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                                                <td className="whitespace-nowrap px-6 py-3 font-mono text-sm font-medium text-neutral-900 dark:text-white">{est.model}</td>
                                                                <td className="whitespace-nowrap px-6 py-3 font-mono text-sm text-neutral-900 dark:text-white">{est.parameter}</td>
                                                                <td className="whitespace-nowrap px-6 py-3 text-right font-mono text-sm text-neutral-900 dark:text-white">{est.estimasi}</td>
                                                                {hasDaerah ? (
                                                                    <>
                                                                        <td className="whitespace-nowrap px-6 py-3 text-sm text-neutral-700 dark:text-neutral-300">{est.daerah_diterima ?? '–'}</td>
                                                                        <td className="whitespace-nowrap px-6 py-3">
                                                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${est.kondisi === 'Diterima' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                                                                                {est.kondisi ?? '–'}
                                                                            </span>
                                                                        </td>
                                                                    </>
                                                                ) : null}
                                                                <td className="whitespace-nowrap px-6 py-3 text-right font-mono text-sm text-neutral-600 dark:text-neutral-400">{est.std_error}</td>
                                                                <td className="whitespace-nowrap px-6 py-3 text-right font-mono text-sm text-neutral-600 dark:text-neutral-400">{est.z_value}</td>
                                                                {hasTabel && est.t_tabel != null ? (
                                                                    <>
                                                                        <td className="whitespace-nowrap px-6 py-3 text-right font-mono text-sm text-neutral-600 dark:text-neutral-400">{est.t_tabel}</td>
                                                                        <td className="whitespace-nowrap px-6 py-3">
                                                                            <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${est.signifikansi === 'Signifikan' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                                                                                {est.signifikansi ?? '–'}
                                                                            </span>
                                                                        </td>
                                                                    </>
                                                                ) : hasTabel ? (
                                                                    <>
                                                                        <td className="whitespace-nowrap px-6 py-3 text-right font-mono text-sm text-neutral-400">–</td>
                                                                        <td className="whitespace-nowrap px-6 py-3 text-neutral-400">–</td>
                                                                    </>
                                                                ) : null}
                                                                <td className="whitespace-nowrap px-6 py-3 text-right font-mono text-sm text-neutral-600 dark:text-neutral-400">{est.p_value}</td>
                                                            </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                );
                            })()}
                        </div>

                        {/* 3️⃣ Metrics Evaluasi */}
                        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                                <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                    3️⃣ Metrics Evaluasi
                                </h2>
                            </div>
                            <div className="p-6">
                                {bestModelSummary ? (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        {bestModelSummary.mape_train != null && (
                                            <div className="rounded-md bg-neutral-50 p-4 dark:bg-neutral-800/50">
                                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">MAPE Training (%)</p>
                                                <p className="mt-1 font-mono text-lg font-semibold text-neutral-900 dark:text-white">{bestModelSummary.mape_train.toFixed(2)}</p>
                                            </div>
                                        )}
                                        {bestModelSummary.mape_val != null && (
                                            <div className="rounded-md bg-neutral-50 p-4 dark:bg-neutral-800/50">
                                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">MAPE Validasi (%)</p>
                                                <p className="mt-1 font-mono text-lg font-semibold text-neutral-900 dark:text-white">{bestModelSummary.mape_val.toFixed(2)}</p>
                                            </div>
                                        )}
                                        <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">MAPE Test (%)</p>
                                            <p className="mt-1 font-mono text-lg font-semibold text-blue-900 dark:text-blue-100">{bestModelSummary.mape.toFixed(2)}</p>
                                        </div>
                                        {bestModelSummary.gap_val_test != null && (
                                            <div className="rounded-md bg-neutral-50 p-4 dark:bg-neutral-800/50">
                                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Gap Val-Test (%)</p>
                                                <p className="mt-1 font-mono text-lg font-semibold text-neutral-900 dark:text-white">{bestModelSummary.gap_val_test.toFixed(2)}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Belum ada metrik evaluasi.</p>
                                )}
                            </div>
                        </div>

                        {/* 4️⃣ Grafik Actual vs Predicted (Data Latih) */}
                        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                                <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                                    4️⃣ Grafik Actual vs Predicted
                                </h2>
                                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                    Data latih: nilai aktual vs fitted ARIMAX (prediksi pada data latih) — model {bestModelSummary?.model ?? '-'}
                                </p>
                            </div>
                            <div className="p-6">
                                {trainingResiduals.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <RechartsLineChart
                                            data={trainingResiduals.map((r) => ({
                                                nomor: r.nomor,
                                                actual: r.actual,
                                                predicted: r.fitted,
                                            }))}
                                            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-700" />
                                            <XAxis dataKey="nomor" className="text-xs text-neutral-600 dark:text-neutral-400" stroke="currentColor" />
                                            <YAxis className="text-xs text-neutral-600 dark:text-neutral-400" stroke="currentColor" unit=" m" />
                                            <Tooltip
                                                formatter={(value: number) => [value.toFixed(4), '']}
                                                labelFormatter={(label) => `Nomor ${label}`}
                                            />
                                            <Legend />
                                            <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Actual (data latih)" />
                                            <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Fitted ARIMAX (data latih)" />
                                        </RechartsLineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <BarChart3 className="h-12 w-12 text-neutral-400 dark:text-neutral-600" />
                                        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">Belum ada data untuk grafik. Latih model terlebih dahulu (Train Model atau via Train Hybrid Sync).</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 5️⃣ Residual Train ARIMAX */}
                        <div className="rounded-lg border-2 border-neutral-300 bg-white shadow-sm dark:border-neutral-600 dark:bg-neutral-900">
                            <div className="border-b border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                    5️⃣ Residual Train ARIMAX
                                </h2>
                                <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                                    <strong>Residual</strong> = Nilai aktual (data latih) − Fitted ARIMAX (prediksi pada data latih). Residual ini digunakan untuk melatih LSTM pada model Hybrid.
                                </p>
                                <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                                    Data residual training dihitung saat proses pelatihan ARIMAX (fitting pada data latih) dan disimpan untuk training LSTM. Secara metodologis: <strong className="font-mono">residual_t = actual_t − ŷ_ARIMAX,t</strong> pada data training.
                                </p>
                            </div>
                            <div className="p-6">
                                {trainingResiduals.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">No.</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Tanggal</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Actual (m)</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Fitted ARIMAX (m)</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Residual (m)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                                {trainingResiduals.map((row) => (
                                                    <tr key={row.nomor} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900 dark:text-white">{row.nomor}</td>
                                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{row.tanggal}</td>
                                                        <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm text-neutral-900 dark:text-white">{row.actual.toFixed(4)}</td>
                                                        <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm text-neutral-900 dark:text-white">{row.fitted.toFixed(4)}</td>
                                                        <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm text-neutral-900 dark:text-white">{row.residual.toFixed(4)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        Tabel residual training akan muncul setelah model ARIMAX dilatih dan data latih tersedia. Latih model terlebih dahulu (Train Model atau via Train Hybrid Sync).
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </AppLayout>
    );
}

import {
    ArrowRight,
    BarChart3,
    Brain,
    Database,
    LineChart,
    TrendingUp,
} from 'lucide-react';

const workflowSteps = [
    {
        title: 'Pengambilan Data',
        description:
            'Data cuaca dan gelombang dikumpulkan dari sumber meteorologi terpercaya',
        icon: Database,
    },
    {
        title: 'Pemrosesan Model',
        description:
            'Model ARIMAX atau Hybrid ARIMAX–LSTM memproses data untuk analisis',
        icon: Brain,
    },
    {
        title: 'Prediksi Gelombang',
        description:
            'Sistem menghasilkan prediksi tinggi gelombang berdasarkan analisis model',
        icon: TrendingUp,
    },
    {
        title: 'Visualisasi Hasil',
        description:
            'Grafik dan hasil prediksi ditampilkan kepada pengguna untuk analisis',
        icon: BarChart3,
    },
];

export default function HowItWorksSection() {
    return (
        <section
            id="how-it-works"
            className="bg-neutral-50 py-16 md:py-24 lg:py-32 dark:bg-neutral-900"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
                        Cara Kerja
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                        Metode ilmiah yang digunakan untuk prediksi tinggi
                        gelombang laut dengan akurasi tinggi
                    </p>
                </div>

                {/* Diagram Alur 4 Langkah */}
                <div className="mt-16">
                    <h3 className="mb-8 text-center text-xl font-medium text-neutral-900 dark:text-white">
                        Diagram Alur Proses
                    </h3>
                    <div className="mx-auto max-w-5xl">
                        {/* Desktop Flow */}
                        <div className="hidden items-center justify-between lg:flex">
                            {workflowSteps.map((step, index) => {
                                const Icon = step.icon;
                                const isLast = index === workflowSteps.length - 1;
                                return (
                                    <div key={step.title} className="flex items-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                                                <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h4 className="mt-4 text-base font-medium text-neutral-900 dark:text-white">
                                                {step.title}
                                            </h4>
                                            <p className="mt-2 max-w-[140px] text-center text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                                                {step.description}
                                            </p>
                                        </div>
                                        {!isLast && (
                                            <div className="mx-6 flex items-center">
                                                <ArrowRight className="h-6 w-6 text-blue-400 dark:text-blue-600" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mobile Flow */}
                        <div className="space-y-6 lg:hidden">
                            {workflowSteps.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <div key={step.title}>
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                                                <Icon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                                        {String(index + 1).padStart(2, '0')}
                                                    </span>
                                                    <h4 className="text-base font-medium text-neutral-900 dark:text-white">
                                                        {step.title}
                                                    </h4>
                                                </div>
                                                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                        {index < workflowSteps.length - 1 && (
                                            <div className="ml-7 mt-4 flex items-center">
                                                <ArrowRight className="h-5 w-5 rotate-90 text-blue-400 dark:text-blue-600" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Penjelasan Model */}
                <div className="mt-20 grid gap-8 lg:grid-cols-2">
                    {/* Model ARIMAX */}
                    <div className="rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-800">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <LineChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
                                Model ARIMAX
                            </h3>
                        </div>
                        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                            Model statistik berbasis{' '}
                            <span className="font-medium text-neutral-900 dark:text-white">
                                autokorelasi
                            </span>{' '}
                            yang memanfaatkan pola historis data time series
                            ditambah{' '}
                            <span className="font-medium text-neutral-900 dark:text-white">
                                variabel eksternal
                            </span>{' '}
                            seperti kecepatan angin dan tekanan udara untuk
                            meningkatkan akurasi prediksi.
                        </p>
                    </div>

                    {/* Model Hybrid ARIMAX–LSTM */}
                    <div className="rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-800">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
                                Hybrid ARIMAX–LSTM
                            </h3>
                        </div>
                        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                            Kombinasi{' '}
                            <span className="font-medium text-neutral-900 dark:text-white">
                                model ARIMAX
                            </span>{' '}
                            untuk menangkap komponen linear dan{' '}
                            <span className="font-medium text-neutral-900 dark:text-white">
                                LSTM (Long Short-Term Memory)
                            </span>{' '}
                            untuk menangkap komponen non-linear, menghasilkan
                            prediksi yang lebih akurat untuk pola data yang
                            kompleks.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}



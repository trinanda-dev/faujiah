import {
    ArrowRight,
    BarChart3,
    Cloud,
    Database,
    Eye,
    RefreshCw,
} from 'lucide-react';

const processSteps = [
    {
        title: 'Input',
        description: 'Data meteorologi (angin, tekanan, suhu, curah hujan)',
        icon: Database,
    },
    {
        title: 'Preprocessing',
        description: 'Scaling, differencing, dan transformasi data',
        icon: RefreshCw,
    },
    {
        title: 'Model',
        description: 'ARIMAX atau Hybrid ARIMAX–LSTM',
        icon: Cloud,
    },
    {
        title: 'Prediksi',
        description: 'Generasi nilai prediksi tinggi gelombang',
        icon: Eye,
    },
    {
        title: 'Visualisasi',
        description: 'Grafik dan analisis hasil prediksi',
        icon: BarChart3,
    },
];

export default function InputDataSection() {
    return (
        <section
            id="input-data"
            className="bg-white py-16 md:py-24 lg:py-32 dark:bg-neutral-950"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
                        Cara Kerja
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                        Sistem mengambil data meteorologi secara otomatis dan
                        memprosesnya melalui pipeline prediksi yang terintegrasi
                    </p>
                </div>

                {/* Data Source Info */}
                <div className="mt-16">
                    <div className="mx-auto max-w-2xl rounded-lg border border-neutral-200 bg-neutral-50 p-8 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
                                    Data Otomatis dari API
                                </h3>
                                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                    Sistem mengambil data real-time meteorologi
                                    secara otomatis dari sumber terpercaya.
                                    Update dilakukan setiap 30 menit untuk
                                    memastikan akurasi prediksi.
                                </p>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Status API: Online
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Process Flow */}
                <div className="mt-16">
                    <h3 className="mb-8 text-center text-xl font-medium text-neutral-900 dark:text-white">
                        Alur Proses Prediksi
                    </h3>
                    <div className="mx-auto max-w-5xl">
                        {/* Desktop Flow */}
                        <div className="hidden items-center justify-between lg:flex">
                            {processSteps.map((step, index) => {
                                const Icon = step.icon;
                                const isLast = index === processSteps.length - 1;
                                return (
                                    <div key={step.title} className="flex items-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-800">
                                                <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h4 className="mt-4 text-sm font-medium text-neutral-900 dark:text-white">
                                                {step.title}
                                            </h4>
                                            <p className="mt-1 max-w-[120px] text-center text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                                                {step.description}
                                            </p>
                                        </div>
                                        {!isLast && (
                                            <div className="mx-4 flex items-center">
                                                <ArrowRight className="h-5 w-5 text-neutral-400 dark:text-neutral-600" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mobile Flow */}
                        <div className="space-y-4 lg:hidden">
                            {processSteps.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <div key={step.title} className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-800">
                                            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
                                                    {String(index + 1).padStart(2, '0')}
                                                </span>
                                                <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                                                    {step.title}
                                                </h4>
                                            </div>
                                            <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}


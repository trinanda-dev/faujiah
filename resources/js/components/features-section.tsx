import {
    BarChart3,
    Download,
    Eye,
    LineChart,
    Settings,
    TrendingUp,
} from 'lucide-react';

const features = [
    {
        title: 'Prediksi Tinggi Gelombang',
        description:
            'Input data cuaca (kecepatan angin, tekanan udara, dll.) dan dapatkan output berupa nilai prediksi serta grafik time series.',
        icon: TrendingUp,
    },
    {
        title: 'Pemilihan Model Prediksi',
        description:
            'Pilih antara Model ARIMAX atau Hybrid ARIMAX–LSTM dengan perbandingan otomatis akurasi kedua model.',
        icon: Settings,
    },
    {
        title: 'Visualisasi Interaktif',
        description:
            'Grafik data aktual vs prediksi, error plot (MAE, RMSE), dan trend gelombang harian/bulanan.',
        icon: LineChart,
    },
    {
        title: 'Dashboard Monitoring',
        description:
            'Pantau status model, data terbaru, dan log proses prediksi secara real-time.',
        icon: BarChart3,
    },
    {
        title: 'Export Hasil',
        description:
            'Download prediksi dalam format CSV atau PDF (laporan singkat) untuk analisis lebih lanjut.',
        icon: Download,
    },
];

export default function FeaturesSection() {
    return (
        <section
            id="features"
            className="bg-neutral-50 py-16 md:py-24 lg:py-32 dark:bg-neutral-900"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
                        Fitur Utama
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                        Fitur-fitur inti yang memudahkan prediksi dan analisis
                        tinggi gelombang laut
                    </p>
                </div>

                <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.title}
                                className="group relative rounded-lg border border-neutral-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-800 dark:hover:border-blue-700"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 transition-colors group-hover:bg-blue-100 dark:bg-blue-900/20 dark:group-hover:bg-blue-900/30">
                                            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-base font-medium text-neutral-900 dark:text-white">
                                                {feature.title}
                                            </h3>
                                        </div>
                                    </div>
                                    <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}


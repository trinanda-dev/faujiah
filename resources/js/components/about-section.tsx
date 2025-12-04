import { BarChart3, Brain, Database, LineChart, TrendingUp } from 'lucide-react';

export default function AboutSection() {
    return (
        <section
            id="about"
            className="bg-white py-20 md:py-28 dark:bg-neutral-950"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
                        Tentang WHIPS
                    </h2>
                    <p className="mt-4 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
                        Sistem prediksi tinggi gelombang laut yang memanfaatkan data
                        meteorologi untuk mendukung keselamatan pelayaran dan aktivitas
                        kelautan.
                    </p>
                </div>

                {/* Main Content */}
                <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Teknologi Inti */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                            Teknologi Inti
                        </h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                                    <LineChart className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">
                                        Model ARIMAX
                                    </h4>
                                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                        Model time series dengan variabel eksogen untuk
                                        prediksi akurat.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                                    <Brain className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">
                                        Model Hybrid ARIMAX–LSTM
                                    </h4>
                                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                        Kombinasi model statistik dan deep learning untuk
                                        performa optimal.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                                    <Database className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">
                                        Pipeline Data Preprocessing
                                    </h4>
                                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                        Scaling, differencing, dan transformasi data untuk
                                        kualitas prediksi optimal.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kegunaan Utama */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                            Kegunaan Utama
                        </h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                                    <TrendingUp className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">
                                        Prediksi Real-time
                                    </h4>
                                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                        Dapatkan prediksi tinggi gelombang secara real-time
                                        dengan update data terbaru.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                                    <BarChart3 className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">
                                        Prediksi Rentang Waktu
                                    </h4>
                                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                        Prediksi untuk periode waktu tertentu sesuai
                                        kebutuhan analisis.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                                    <BarChart3 className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">
                                        Analisis Perbandingan Model
                                    </h4>
                                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                        Bandingkan performa berbagai model untuk mendapatkan
                                        hasil terbaik.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

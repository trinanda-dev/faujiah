import { BarChart3, Cpu, Database, TrendingUp } from 'lucide-react';

export default function AboutSection() {
    return (
        <section
            id="about"
            className="bg-white py-16 md:py-24 lg:py-32 dark:bg-neutral-950"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
                        Tentang WHIPS
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                        Sistem prediksi tinggi gelombang laut yang memanfaatkan
                        data angin, tekanan udara, dan parameter meteorologi
                        lainnya. Dibangun untuk mendukung keselamatan pelayaran,
                        aktivitas nelayan, dan pemantauan cuaca ekstrem.
                    </p>
                </div>

                <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
                    {/* Teknologi Inti */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <Cpu className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-medium text-neutral-900 dark:text-white">
                                Teknologi Inti
                            </h3>
                        </div>
                        <div className="space-y-4">
                            <div className="group rounded-lg border border-neutral-200 bg-neutral-50 p-5 transition-all hover:border-blue-300 hover:bg-white hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-700 dark:hover:bg-neutral-800">
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                                            Model ARIMAX
                                        </h4>
                                        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                            Model time series dengan variabel eksogen
                                            untuk prediksi akurat
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="group rounded-lg border border-neutral-200 bg-neutral-50 p-5 transition-all hover:border-blue-300 hover:bg-white hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-700 dark:hover:bg-neutral-800">
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                                        <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                                            Model Hybrid ARIMAX–LSTM
                                        </h4>
                                        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                            Kombinasi model statistik dan deep learning
                                            untuk performa optimal
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="group rounded-lg border border-neutral-200 bg-neutral-50 p-5 transition-all hover:border-blue-300 hover:bg-white hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-700 dark:hover:bg-neutral-800">
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                                        <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                                            Pipeline Data Preprocessing
                                        </h4>
                                        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                            Scaling, differencing, dan transformasi data
                                            untuk kualitas prediksi optimal
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kegunaan Utama */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-medium text-neutral-900 dark:text-white">
                                Kegunaan Utama
                            </h3>
                        </div>
                        <div className="space-y-4">
                            <div className="group rounded-lg border border-neutral-200 bg-neutral-50 p-5 transition-all hover:border-blue-300 hover:bg-white hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-700 dark:hover:bg-neutral-800">
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                                            Prediksi Real-time
                                        </h4>
                                        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                            Dapatkan prediksi tinggi gelombang secara
                                            real-time dengan update data terbaru
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="group rounded-lg border border-neutral-200 bg-neutral-50 p-5 transition-all hover:border-blue-300 hover:bg-white hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-700 dark:hover:bg-neutral-800">
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                                        <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                                            Prediksi Rentang Waktu Tertentu
                                        </h4>
                                        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                            Prediksi untuk periode waktu tertentu sesuai
                                            kebutuhan analisis
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="group rounded-lg border border-neutral-200 bg-neutral-50 p-5 transition-all hover:border-blue-300 hover:bg-white hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-700 dark:hover:bg-neutral-800">
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                                        <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                                            Analisis Perbandingan Model
                                        </h4>
                                        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                            Bandingkan performa berbagai model untuk
                                            mendapatkan hasil terbaik
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}


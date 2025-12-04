import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { Link } from '@inertiajs/react';
import { CheckCircle2, FileText, TrendingUp } from 'lucide-react';

export default function HeroSection() {
    return (
        <section
            id="hero"
            className="relative overflow-hidden bg-white py-16 md:py-24 lg:py-32 dark:bg-neutral-950"
        >
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url('/images/bg-hero.jpg')",
                }}
            >
                {/* Overlay untuk readability */}
                <div className="absolute inset-0 bg-white/80 dark:bg-neutral-950/80"></div>
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    {/* Content */}
                    <div className="text-center">
                        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl md:text-6xl dark:text-white">
                            WHIPS
                        </h1>
                        <h2 className="mt-3 text-2xl font-light leading-relaxed text-neutral-700 sm:text-3xl md:text-4xl dark:text-neutral-300">
                            Sistem Prediksi Tinggi Gelombang Laut
                        </h2>
                        <p className="mt-8 text-base leading-relaxed text-neutral-600 sm:text-lg dark:text-neutral-400">
                            Prediksi akurat berbasis model{' '}
                            <span className="font-medium text-neutral-900 dark:text-neutral-200">
                                ARIMAX
                            </span>{' '}
                            dan{' '}
                            <span className="font-medium text-neutral-900 dark:text-neutral-200">
                                Hybrid ARIMAX–LSTM
                            </span>{' '}
                            untuk mendukung keselamatan maritim dan aktivitas
                            kelautan.
                        </p>

                        {/* CTA Buttons */}
                        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-center">
                            <Button
                                asChild
                                size="lg"
                                className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                            >
                                <Link href={dashboard()}>Mulai Prediksi</Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="rounded-md border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            >
                                <Link href="#about">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Lihat Dokumentasi
                                </Link>
                            </Button>
                        </div>

                        {/* Quick Highlights */}
                        <div className="mt-12 grid gap-6 sm:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                        Akurasi Tinggi
                                    </span>
                                </div>
                                <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                                    Model teruji dengan akurasi prediksi yang
                                    tinggi
                                </p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                        Prediksi Otomatis Harian
                                    </span>
                                </div>
                                <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                                    Update prediksi setiap hari secara otomatis
                                </p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                        Data Meteorologi
                                    </span>
                                </div>
                                <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                                    Berdasarkan data meteorologi terpercaya
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}


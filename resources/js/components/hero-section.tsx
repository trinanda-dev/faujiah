import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { Link } from '@inertiajs/react';
import { CheckCircle2, TrendingUp } from 'lucide-react';

export default function HeroSection() {
    return (
        <section
            id="hero"
            className="relative overflow-hidden bg-white py-20 md:py-28 lg:py-32 dark:bg-neutral-950"
        >
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url('/images/bg-hero.jpg')",
                }}
            >
                {/* Overlay untuk readability */}
                <div className="absolute inset-0 bg-white/85 dark:bg-neutral-950/85"></div>
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    {/* Content */}
                    <div className="text-center">
                        <h1 className="animate-fade-in text-5xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-6xl md:text-7xl dark:text-white">
                            WHIPS
                        </h1>
                        <h2 className="animate-slide-up mt-4 text-xl font-light leading-relaxed text-neutral-700 sm:text-2xl md:text-3xl dark:text-neutral-300">
                            Sistem Prediksi Tinggi Gelombang Laut
                        </h2>
                        <p className="animate-fade-in-delay mt-6 text-base leading-relaxed text-neutral-600 sm:text-lg dark:text-neutral-400">
                            Prediksi akurat berbasis model{' '}
                            <span className="font-medium text-neutral-900 dark:text-neutral-200">
                                ARIMAX
                            </span>{' '}
                            dan{' '}
                            <span className="font-medium text-neutral-900 dark:text-neutral-200">
                                Hybrid ARIMAX–LSTM
                            </span>{' '}
                            untuk mendukung keselamatan maritim dan aktivitas kelautan.
                        </p>

                        {/* CTA Button */}
                        <div className="animate-fade-in-delay-2 mt-10">
                            <Button
                                asChild
                                size="lg"
                                className="rounded-md bg-blue-600 px-8 py-6 text-base font-medium text-white transition-all hover:bg-blue-700 hover:shadow-lg dark:bg-blue-500 dark:hover:bg-blue-600"
                            >
                                <Link href={dashboard()}>Mulai Prediksi</Link>
                            </Button>
                        </div>

                        {/* Quick Highlights */}
                        <div className="animate-fade-in-delay-3 mt-16 grid gap-8 sm:grid-cols-3">
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                        Akurasi Tinggi
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                    Model teruji dengan akurasi tinggi
                                </p>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                        Update Otomatis
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                    Prediksi harian secara otomatis
                                </p>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                        Data Terpercaya
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                    Berdasarkan data meteorologi
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </section>
    );
}

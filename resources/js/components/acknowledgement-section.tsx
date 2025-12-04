import { BookOpen, GraduationCap, Heart, Users } from 'lucide-react';

export default function AcknowledgementSection() {
    return (
        <section
            id="contact"
            className="bg-white py-16 md:py-24 lg:py-32 dark:bg-neutral-950"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
                        Tentang Developer
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                        Informasi pembuat dan sumber referensi sistem WHIPS
                    </p>
                </div>

                <div className="mt-16 grid gap-12 lg:grid-cols-2">
                    {/* Developer Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-medium text-neutral-900 dark:text-white">
                                Informasi Pembuat
                            </h3>
                        </div>
                        <div className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
                            <div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Nama
                                </p>
                                <p className="mt-1 text-base font-medium text-neutral-900 dark:text-white">
                                    [Nama Developer]
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Instansi
                                </p>
                                <p className="mt-1 text-base font-medium text-neutral-900 dark:text-white">
                                    Universitas Maritim Raja Ali Haji (UMRAH)
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Program Studi
                                </p>
                                <p className="mt-1 text-base font-medium text-neutral-900 dark:text-white">
                                    [Program Studi]
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* References */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-medium text-neutral-900 dark:text-white">
                                Referensi
                            </h3>
                        </div>
                        <div className="space-y-4">
                            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
                                <h4 className="mb-2 text-sm font-medium text-neutral-900 dark:text-white">
                                    Dataset
                                </h4>
                                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                    Data meteorologi dan tinggi gelombang dari
                                    [Sumber Dataset]. Data digunakan untuk
                                    training dan validasi model prediksi.
                                </p>
                            </div>
                            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
                                <h4 className="mb-2 text-sm font-medium text-neutral-900 dark:text-white">
                                    Model
                                </h4>
                                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                    Model ARIMAX dan Hybrid ARIMAX–LSTM
                                    berdasarkan penelitian terkait time series
                                    forecasting dan deep learning untuk prediksi
                                    gelombang laut.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Acknowledgement */}
                <div className="mt-16">
                    <div className="mx-auto max-w-4xl">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <Heart className="h-5 w-5 text-red-500" />
                            <h3 className="text-xl font-medium text-neutral-900 dark:text-white">
                                Ucapan Terima Kasih
                            </h3>
                        </div>
                        <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-gradient-to-br from-blue-50 to-neutral-50 dark:border-neutral-800 dark:from-blue-950/20 dark:to-neutral-900">
                            <div className="relative p-8 md:p-12">
                                <div className="grid gap-8 md:grid-cols-2 md:items-center">
                                    <div className="space-y-4">
                                        <p className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                                            Terima kasih kepada semua pihak yang
                                            telah mendukung pengembangan sistem
                                            WHIPS ini, termasuk dosen pembimbing,
                                            rekan-rekan peneliti, dan instansi yang
                                            telah menyediakan data meteorologi.
                                        </p>
                                        <p className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                                            Sistem ini dikembangkan sebagai bagian
                                            dari penelitian skripsi dengan harapan
                                            dapat memberikan kontribusi dalam
                                            bidang keselamatan maritim dan
                                            pemantauan kondisi laut.
                                        </p>
                                    </div>
                                    <div className="relative h-64 overflow-hidden rounded-lg md:h-full">
                                        <img
                                            src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop"
                                            alt="Ocean research"
                                            className="h-full w-full object-cover"
                                        />
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



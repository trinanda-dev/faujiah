import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        Dashboard
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Kelola keseluruhan proses prediksi tinggi gelombang laut
                        dan monitoring status sistem
                    </p>
                </div>

                {/* Informasi Sistem dan Aplikasi */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left: Informasi Sistem */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                            Informasi Sistem
                        </h2>
                        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="mb-2 text-base font-semibold text-neutral-900 dark:text-white">
                                        WHIPS (Water High Prediction System)
                                    </h3>
                                    <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                        Sistem ini dikembangkan berdasarkan penelitian{' '}
                                        <span className="font-medium italic text-neutral-900 dark:text-white">
                                            "Implementasi Model Hybrid ARIMAX–LSTM dalam Prediksi Tinggi Gelombang Laut di Natuna Utara"
                                        </span>{' '}
                                        dengan tujuan mengimplementasikan model Hybrid ARIMAX–LSTM untuk menghasilkan estimasi tinggi gelombang laut yang lebih akurat.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Informasi Aplikasi */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                            Informasi Aplikasi
                        </h2>
                        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
                                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                            Nama Aplikasi:
                                        </span>
                                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                                            WHIPS – Water High Prediction System
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
                                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                            Bahasa Pemrograman:
                                        </span>
                                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                                            PHP
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
                                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                            Framework:
                                        </span>
                                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                                            Laravel 12
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between">
                                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                            Pengembang:
                                        </span>
                                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                                            Faujiah Decika
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

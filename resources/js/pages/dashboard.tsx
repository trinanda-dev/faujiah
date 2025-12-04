import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    ChartBar,
    Database,
    FileText,
    PlayCircle,
    TrendingUp,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const systemInfoCards = [
    {
        title: 'Versi Model ARIMAX',
        icon: ChartBar,
        value: 'v1.0.0',
        description: 'Model ARIMAX terbaru',
    },
    {
        title: 'Residual ARIMAX Stored',
        icon: Database,
        value: '1,234',
        description: 'Data residual tersimpan',
    },
    {
        title: 'Dataset Summary',
        icon: FileText,
        value: '5,678',
        description: 'Total data training',
    },
    {
        title: 'Status Training',
        icon: PlayCircle,
        value: 'Selesai',
        description: 'Model siap digunakan',
    },
];

const mainFeatures = [
    'Prediksi tinggi gelombang laut menggunakan model ARIMAX dan Hybrid ARIMAX-LSTM',
    'Visualisasi data time series dengan grafik interaktif',
    'Export hasil prediksi dalam format CSV dan PDF',
    'Monitoring status model dan data real-time',
    'Perbandingan akurasi antara model ARIMAX dan Hybrid',
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

                {/* Informasi Sistem Panel */}
                <div className="space-y-4">
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                        Informasi Sistem
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {systemInfoCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <div
                                    key={card.title}
                                    className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-900/20">
                                                    <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
                                                    {card.title}
                                                </h3>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                                                    {card.value}
                                                </p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                    {card.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Informasi Aplikasi Panel */}
                <div className="space-y-4">
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                        Informasi Aplikasi
                    </h2>
                    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <h3 className="mb-4 text-base font-medium text-neutral-900 dark:text-white">
                            Fitur Utama Sistem
                        </h3>
                        <ul className="space-y-3">
                            {mainFeatures.map((feature, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-400"
                                >
                                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                                        <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

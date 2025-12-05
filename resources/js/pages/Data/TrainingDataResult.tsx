import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head, router } from '@inertiajs/react';
import { Database } from 'lucide-react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Hasil Data Latih',
    },
];

interface TrainingDataItem {
    id: number;
    tanggal: string;
    tinggi_gelombang: string;
    kecepatan_angin: string;
    tinggi_gelombang_normalized: string | null;
    kecepatan_angin_normalized: string | null;
}

interface Props {
    trainingData: {
        data: TrainingDataItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    totalData: number;
}

export default function TrainingDataResult({ trainingData, totalData }: Props) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const formatNumber = (value: string | number | null) => {
        if (value === null) {
            return '-';
        }
        return parseFloat(value.toString()).toFixed(2);
    };

    const formatNormalized = (value: string | number | null) => {
        if (value === null) {
            return '-';
        }
        return parseFloat(value.toString()).toFixed(6);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Hasil Data Latih" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        Hasil Data Latih
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Data yang telah melalui proses pembersihan dan normalisasi untuk pelatihan model
                    </p>
                </div>

                {/* Info Card */}
                <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-900/20">
                            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                Total Data Tersedia
                            </p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                {totalData} data telah diproses dan siap digunakan
                            </p>
                        </div>
                    </div>
                </div>

                {/* Data Table Section */}
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                            Hasil Data Latih
                        </h2>
                    </div>

                    {trainingData.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <Database className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
                            <p className="mt-4 text-sm font-medium text-neutral-900 dark:text-white">
                                Belum ada data yang diproses
                            </p>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Data akan muncul setelah melalui proses normalisasi
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                No.
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Tanggal
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Tinggi Gelombang (M)
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Kecepatan Angin (M/S)
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Tinggi Gelombang (Normalized)
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Kecepatan Angin (Normalized)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                        {trainingData.data.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900 dark:text-white">
                                                    {(trainingData.current_page - 1) * trainingData.per_page + index + 1}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900 dark:text-white">
                                                    {formatDate(item.tanggal)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900 dark:text-white">
                                                    {formatNumber(item.tinggi_gelombang)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900 dark:text-white">
                                                    {formatNumber(item.kecepatan_angin)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    {formatNormalized(item.tinggi_gelombang_normalized)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    {formatNormalized(item.kecepatan_angin_normalized)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {trainingData.last_page > 1 && (
                                <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                            Menampilkan{' '}
                                            <span className="font-medium text-neutral-900 dark:text-white">
                                                {(trainingData.current_page - 1) * trainingData.per_page + 1}
                                            </span>{' '}
                                            sampai{' '}
                                            <span className="font-medium text-neutral-900 dark:text-white">
                                                {Math.min(
                                                    trainingData.current_page * trainingData.per_page,
                                                    trainingData.total,
                                                )}
                                            </span>{' '}
                                            dari{' '}
                                            <span className="font-medium text-neutral-900 dark:text-white">
                                                {trainingData.total}
                                            </span>{' '}
                                            data
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    router.get('/data/results', {
                                                        page: trainingData.current_page - 1,
                                                    })
                                                }
                                                disabled={trainingData.current_page === 1}
                                                className="border-neutral-300 dark:border-neutral-700"
                                            >
                                                Prev
                                            </Button>
                                            {Array.from({ length: trainingData.last_page }, (_, i) => i + 1)
                                                .filter(
                                                    (page) =>
                                                        page === 1 ||
                                                        page === trainingData.last_page ||
                                                        (page >= trainingData.current_page - 1 &&
                                                            page <= trainingData.current_page + 1),
                                                )
                                                .map((page, index, array) => (
                                                    <div key={page} className="flex items-center gap-1">
                                                        {index > 0 && array[index - 1] !== page - 1 && (
                                                            <span className="px-2 text-sm text-neutral-500">...</span>
                                                        )}
                                                        <Button
                                                            variant={
                                                                page === trainingData.current_page
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                router.get('/data/results', { page })
                                                            }
                                                            className={
                                                                page === trainingData.current_page
                                                                    ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                                                                    : 'border-neutral-300 dark:border-neutral-700'
                                                            }
                                                        >
                                                            {page}
                                                        </Button>
                                                    </div>
                                                ))}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    router.get('/data/results', {
                                                        page: trainingData.current_page + 1,
                                                    })
                                                }
                                                disabled={trainingData.current_page === trainingData.last_page}
                                                className="border-neutral-300 dark:border-neutral-700"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}


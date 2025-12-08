import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head, router } from '@inertiajs/react';
import { FileCheck } from 'lucide-react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Hasil Data Uji',
        href: '#',
    },
];

interface TestDataItem {
    id: number;
    tanggal: string;
    tinggi_gelombang: string;
    kecepatan_angin: string;
}

interface Props {
    testData: {
        data: TestDataItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    totalData: number;
}

export default function TestDataResult({ testData, totalData }: Props) {
    const formatDate = (dateString: string) => {
        // Parse date string manually to avoid timezone conversion
        let date: Date;
        
        if (dateString.includes('T')) {
            const isoString = dateString.replace('Z', '').split('.')[0];
            const [datePart, timePart] = isoString.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute, second] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        } else {
            const parts = dateString.split(' ');
            const [year, month, day] = parts[0].split('-').map(Number);
            const [hour, minute, second] = parts[1] ? parts[1].split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        }
        
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const formatNumber = (value: string | number) => {
        return parseFloat(value.toString()).toFixed(2);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Hasil Data Uji" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        Hasil Data Uji
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Data yang digunakan untuk pengujian model ARIMAX dan Hybrid ARIMAX–LSTM
                    </p>
                </div>

                {/* Info Card */}
                <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-50 dark:bg-green-900/20">
                            <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                Total Data Uji Tersedia
                            </p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                {totalData} data siap digunakan untuk evaluasi model
                            </p>
                        </div>
                    </div>
                </div>

                {/* Data Table Section */}
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                            Hasil Data Uji
                        </h2>
                    </div>

                    {testData.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileCheck className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
                            <p className="mt-4 text-sm font-medium text-neutral-900 dark:text-white">
                                Belum ada data uji
                            </p>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Data uji akan muncul setelah diunggah atau diproses
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
                                                Tanggal & Waktu
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Tinggi Gelombang (M)
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Kecepatan Angin (M/S)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                        {testData.data.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900 dark:text-white">
                                                    {(testData.current_page - 1) * testData.per_page + index + 1}
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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {testData.last_page > 1 && (
                                <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                            Menampilkan{' '}
                                            <span className="font-medium text-neutral-900 dark:text-white">
                                                {(testData.current_page - 1) * testData.per_page + 1}
                                            </span>{' '}
                                            sampai{' '}
                                            <span className="font-medium text-neutral-900 dark:text-white">
                                                {Math.min(
                                                    testData.current_page * testData.per_page,
                                                    testData.total,
                                                )}
                                            </span>{' '}
                                            dari{' '}
                                            <span className="font-medium text-neutral-900 dark:text-white">
                                                {testData.total}
                                            </span>{' '}
                                            data
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    router.get('/data/test-results', {
                                                        page: testData.current_page - 1,
                                                    })
                                                }
                                                disabled={testData.current_page === 1}
                                                className="border-neutral-300 dark:border-neutral-700"
                                            >
                                                Prev
                                            </Button>
                                            {Array.from({ length: testData.last_page }, (_, i) => i + 1)
                                                .filter(
                                                    (page) =>
                                                        page === 1 ||
                                                        page === testData.last_page ||
                                                        (page >= testData.current_page - 1 &&
                                                            page <= testData.current_page + 1),
                                                )
                                                .map((page, index, array) => (
                                                    <div key={page} className="flex items-center gap-1">
                                                        {index > 0 && array[index - 1] !== page - 1 && (
                                                            <span className="px-2 text-sm text-neutral-500">...</span>
                                                        )}
                                                        <Button
                                                            variant={
                                                                page === testData.current_page
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                router.get('/data/test-results', { page })
                                                            }
                                                            className={
                                                                page === testData.current_page
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
                                                    router.get('/data/test-results', {
                                                        page: testData.current_page + 1,
                                                    })
                                                }
                                                disabled={testData.current_page === testData.last_page}
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


/**
 * Komponen Halaman Hasil Data Validasi
 * 
 * Halaman ini menampilkan data validasi (15% dari dataset) yang digunakan untuk validasi model.
 * Data validasi digunakan untuk:
 * - Tuning hyperparameter
 * - Early stopping pada model LSTM
 * - Validasi performa model selama training
 * 
 * Fitur utama:
 * - Menampilkan data validasi dengan pagination
 * - Format tanggal dan waktu dalam format Indonesia
 * - Format angka dengan 2 desimal
 */

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head, router } from '@inertiajs/react';
import { FileCheck } from 'lucide-react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

// Breadcrumb untuk navigasi halaman
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Hasil Data Validasi',
        href: '#',
    },
];

/**
 * Interface untuk item data validasi
 */
interface ValidationDataItem {
    id: number; // ID unik data
    tanggal: string; // Tanggal dan waktu observasi
    tinggi_gelombang: string; // Tinggi gelombang (dalam meter)
    kecepatan_angin: string; // Kecepatan angin (dalam m/s)
}

/**
 * Props yang diterima oleh komponen ValidationDataResult
 */
interface Props {
    validationData: {
        data: ValidationDataItem[]; // Array data validasi untuk halaman saat ini
        current_page: number; // Halaman pagination saat ini
        last_page: number; // Halaman terakhir
        per_page: number; // Jumlah data per halaman
        total: number; // Total jumlah data
    };
    totalData: number; // Total jumlah data (untuk info card)
}

/**
 * Komponen utama untuk halaman Hasil Data Validasi
 */
export default function ValidationDataResult({ validationData, totalData }: Props) {
    /**
     * Memformat tanggal dan waktu menjadi format Indonesia (DD/MM/YYYY HH:mm:ss).
     * Parse tanggal secara manual untuk menghindari konversi timezone.
     * Mendukung format ISO (YYYY-MM-DDTHH:mm:ss) dan format standar (YYYY-MM-DD HH:mm:ss).
     * 
     * @param dateString - String tanggal yang akan diformat
     * @returns String tanggal yang sudah diformat dalam format Indonesia
     */
    const formatDate = (dateString: string) => {
        // Parse tanggal secara manual untuk menghindari konversi timezone
        let date: Date;
        
        if (dateString.includes('T')) {
            // Format ISO: "2023-01-01T00:00:00.000000Z" atau "2023-01-01T00:00:00"
            const isoString = dateString.replace('Z', '').split('.')[0];
            const [datePart, timePart] = isoString.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute, second] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        } else {
            // Format: "2023-01-01 00:00:00" atau "2023-01-01"
            const parts = dateString.split(' ');
            const [year, month, day] = parts[0].split('-').map(Number);
            const [hour, minute, second] = parts[1] ? parts[1].split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        }
        
        // Format ke locale Indonesia dengan format 24 jam
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false, // Format 24 jam
        });
    };

    /**
     * Memformat angka menjadi 2 desimal.
     * 
     * @param value - Nilai yang akan diformat (string atau number)
     * @returns String angka dengan 2 desimal
     */
    const formatNumber = (value: string | number) => {
        return parseFloat(value.toString()).toFixed(2);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Hasil Data Validasi" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        Hasil Data Validasi
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Data yang digunakan untuk validasi dan tuning model ARIMAX dan Hybrid ARIMAX–LSTM
                    </p>
                </div>

                {/* Info Card */}
                <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-900/20">
                            <FileCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                Total Data Validasi Tersedia
                            </p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                {totalData} data siap digunakan untuk validasi model
                            </p>
                        </div>
                    </div>
                </div>

                {/* Data Table Section */}
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                            Hasil Data Validasi
                        </h2>
                    </div>

                    {validationData.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileCheck className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
                            <p className="mt-4 text-sm font-medium text-neutral-900 dark:text-white">
                                Belum ada data validasi
                            </p>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Data validasi akan muncul setelah diunggah atau diproses
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
                                        {validationData.data.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900 dark:text-white">
                                                    {(validationData.current_page - 1) * validationData.per_page + index + 1}
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
                            {validationData.last_page > 1 && (
                                <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                            Menampilkan{' '}
                                            <span className="font-medium text-neutral-900 dark:text-white">
                                                {(validationData.current_page - 1) * validationData.per_page + 1}
                                            </span>{' '}
                                            sampai{' '}
                                            <span className="font-medium text-neutral-900 dark:text-white">
                                                {Math.min(
                                                    validationData.current_page * validationData.per_page,
                                                    validationData.total,
                                                )}
                                            </span>{' '}
                                            dari{' '}
                                            <span className="font-medium text-neutral-900 dark:text-white">
                                                {validationData.total}
                                            </span>{' '}
                                            data
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    router.get('/data/validation-results', {
                                                        page: validationData.current_page - 1,
                                                    })
                                                }
                                                disabled={validationData.current_page === 1}
                                                className="border-neutral-300 dark:border-neutral-700"
                                            >
                                                Prev
                                            </Button>
                                            {Array.from({ length: validationData.last_page }, (_, i) => i + 1)
                                                .filter(
                                                    (page) =>
                                                        page === 1 ||
                                                        page === validationData.last_page ||
                                                        (page >= validationData.current_page - 1 &&
                                                            page <= validationData.current_page + 1),
                                                )
                                                .map((page, index, array) => (
                                                    <div key={page} className="flex items-center gap-1">
                                                        {index > 0 && array[index - 1] !== page - 1 && (
                                                            <span className="px-2 text-sm text-neutral-500">...</span>
                                                        )}
                                                        <Button
                                                            variant={
                                                                page === validationData.current_page
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                router.get('/data/validation-results', { page })
                                                            }
                                                            className={
                                                                page === validationData.current_page
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
                                                    router.get('/data/validation-results', {
                                                        page: validationData.current_page + 1,
                                                    })
                                                }
                                                disabled={validationData.current_page === validationData.last_page}
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


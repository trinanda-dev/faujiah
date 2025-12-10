/**
 * Komponen Halaman Hasil Data Latih
 * 
 * Halaman ini menampilkan data latih (80% dari dataset) yang digunakan untuk pelatihan model.
 * Data latih mencakup nilai asli dan nilai yang sudah dinormalisasi (jika tersedia).
 * 
 * Fitur utama:
 * - Menampilkan data latih dengan pagination
 * - Menampilkan nilai asli dan nilai normalized (jika tersedia)
 * - Format tanggal dan waktu dalam format Indonesia
 * - Format angka dengan 2 desimal (nilai asli) dan 6 desimal (nilai normalized)
 */

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head, router } from '@inertiajs/react';
import { Database } from 'lucide-react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

// Breadcrumb untuk navigasi halaman
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Hasil Data Latih',
        href: '#',
    },
];

/**
 * Interface untuk item data latih
 */
interface TrainingDataItem {
    id: number; // ID unik data
    tanggal: string; // Tanggal dan waktu observasi
    tinggi_gelombang: string; // Tinggi gelombang asli (dalam meter)
    kecepatan_angin: string; // Kecepatan angin asli (dalam m/s)
    tinggi_gelombang_normalized: string | null; // Tinggi gelombang yang sudah dinormalisasi (opsional)
    kecepatan_angin_normalized: string | null; // Kecepatan angin yang sudah dinormalisasi (opsional)
}

/**
 * Props yang diterima oleh komponen TrainingDataResult
 */
interface Props {
    trainingData: {
        data: TrainingDataItem[]; // Array data latih untuk halaman saat ini
        current_page: number; // Halaman pagination saat ini
        last_page: number; // Halaman terakhir
        per_page: number; // Jumlah data per halaman
        total: number; // Total jumlah data
    };
    totalData: number; // Total jumlah data (untuk info card)
}

export default function TrainingDataResult({ trainingData, totalData }: Props) {
    /**
     * Fungsi untuk memformat tanggal dan waktu menjadi format Indonesia
     * Menghindari konversi timezone dengan parsing manual
     */
    const formatDate = (dateString: string) => {
        // Parse tanggal secara manual untuk menghindari konversi timezone
        let date: Date;
        
        // Jika format ISO (mengandung 'T'), parse sebagai ISO string
        if (dateString.includes('T')) {
            const isoString = dateString.replace('Z', '').split('.')[0];
            const [datePart, timePart] = isoString.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute, second] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        } else {
            // Jika format biasa (YYYY-MM-DD HH:mm:ss), parse secara manual
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
            hour12: false,
        });
    };

    /**
     * Fungsi untuk memformat angka menjadi 2 desimal
     * Menampilkan '-' jika nilai null
     */
    const formatNumber = (value: string | number | null) => {
        if (value === null) {
            return '-';
        }
        return parseFloat(value.toString()).toFixed(2);
    };

    /**
     * Fungsi untuk memformat nilai normalized menjadi 6 desimal
     * Menampilkan '-' jika nilai null
     */
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
                        Data latih (80% dari dataset) yang digunakan untuk pelatihan model ARIMAX dan Hybrid
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
                                {totalData} data latih tersedia (80% dari total dataset)
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

                    {/* Tampilkan pesan kosong jika tidak ada data */}
                    {trainingData.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <Database className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
                            <p className="mt-4 text-sm font-medium text-neutral-900 dark:text-white">
                                Belum ada data latih
                            </p>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Upload data terlebih dahulu untuk melihat data latih (80% dari dataset)
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Tabel data latih dengan scroll horizontal jika terlalu lebar */}
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
                                        {/* Render setiap baris data latih */}
                                        {trainingData.data.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                            >
                                                {/* Nomor urut dengan perhitungan pagination */}
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900 dark:text-white">
                                                    {(trainingData.current_page - 1) * trainingData.per_page + index + 1}
                                                </td>
                                                {/* Tanggal dan waktu yang sudah diformat */}
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900 dark:text-white">
                                                    {formatDate(item.tanggal)}
                                                </td>
                                                {/* Tinggi gelombang dengan 2 desimal */}
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900 dark:text-white">
                                                    {formatNumber(item.tinggi_gelombang)}
                                                </td>
                                                {/* Kecepatan angin dengan 2 desimal */}
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900 dark:text-white">
                                                    {formatNumber(item.kecepatan_angin)}
                                                </td>
                                                {/* Nilai normalized tinggi gelombang dengan 6 desimal */}
                                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    {formatNormalized(item.tinggi_gelombang_normalized)}
                                                </td>
                                                {/* Nilai normalized kecepatan angin dengan 6 desimal */}
                                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    {formatNormalized(item.kecepatan_angin_normalized)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination - hanya tampil jika lebih dari 1 halaman */}
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
                                            {/* Tombol Previous - disabled jika di halaman pertama */}
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
                                            {/* Generate tombol nomor halaman dengan logika ellipsis */}
                                            {Array.from({ length: trainingData.last_page }, (_, i) => i + 1)
                                                .filter(
                                                    (page) =>
                                                        // Tampilkan halaman pertama, terakhir, dan halaman sekitar halaman aktif
                                                        page === 1 ||
                                                        page === trainingData.last_page ||
                                                        (page >= trainingData.current_page - 1 &&
                                                            page <= trainingData.current_page + 1),
                                                )
                                                .map((page, index, array) => (
                                                    <div key={page} className="flex items-center gap-1">
                                                        {/* Tampilkan ellipsis jika ada gap antara halaman */}
                                                        {index > 0 && array[index - 1] !== page - 1 && (
                                                            <span className="px-2 text-sm text-neutral-500">...</span>
                                                        )}
                                                        {/* Tombol nomor halaman */}
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
                                            {/* Tombol Next - disabled jika di halaman terakhir */}
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


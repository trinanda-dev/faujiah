import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Head, router, useForm } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, FileUp, Trash2, Upload } from 'lucide-react';
import { type FormEventHandler, useState } from 'react';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Input Data Latih',
        href: '#',
    },
];

interface TrainingDataItem {
    id: number;
    tanggal: string;
    tinggi_gelombang: string;
    kecepatan_angin: string;
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

export default function InputData({ trainingData, totalData }: Props) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>('');

    const { data, setData, post, processing, errors, delete: deleteMethod } = useForm({
        file: null as File | null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setFileName(file.name);
            setData('file', file);
        }
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/data/upload', {
            forceFormData: true,
            onSuccess: () => {
                setSelectedFile(null);
                setFileName('');
                setData('file', null);
            },
        });
    };

    const handleDelete = () => {
        if (confirm('Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
            deleteMethod('/data/delete', {
                onSuccess: () => {
                    router.reload();
                },
            });
        }
    };

    const formatDate = (dateString: string) => {
        // Parse date string manually to avoid timezone conversion
        // Handle formats: "2023-01-01 00:00:00" or "2023-01-01T00:00:00" or ISO format
        let date: Date;
        
        if (dateString.includes('T')) {
            // ISO format: "2023-01-01T00:00:00.000000Z" or "2023-01-01T00:00:00"
            const isoString = dateString.replace('Z', '').split('.')[0];
            const [datePart, timePart] = isoString.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute, second] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
            date = new Date(year, month - 1, day, hour, minute, second);
        } else {
            // Format: "2023-01-01 00:00:00" or "2023-01-01"
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
            <Head title="Input Data Latih" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        Input Data Latih
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Unggah data CSV atau Excel untuk proses pelatihan dan pengujian model
                    </p>
                </div>

                {/* Upload Form Section */}
                <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h2 className="mb-4 text-lg font-medium text-neutral-900 dark:text-white">
                        Unggah Data CSV atau Excel
                    </h2>

                    {/* Instructions */}
                    <div className="mb-6 space-y-2 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                            <div className="space-y-1 text-sm text-blue-900 dark:text-blue-200">
                                <p className="font-medium">Format Data yang Diperlukan:</p>
                                <ul className="list-inside list-disc space-y-0.5">
                                    <li>
                                        <span className="font-semibold">Header yang diterima:</span>
                                        <ul className="ml-4 mt-1 list-inside list-disc space-y-0.5">
                                            <li>Tanggal: <code className="text-xs">tanggal</code>, <code className="text-xs">timestamp</code>, <code className="text-xs">date</code></li>
                                            <li>Tinggi Gelombang: <code className="text-xs">tinggi_gelombang</code>, <code className="text-xs">wave_height</code></li>
                                            <li>Kecepatan Angin: <code className="text-xs">kecepatan_angin</code>, <code className="text-xs">wind_speed</code></li>
                                        </ul>
                                    </li>
                                    <li>Pastikan tidak ada data kosong pada kolom yang diperlukan</li>
                                    <li>Format file yang didukung: CSV, Excel (.xlsx, .xls)</li>
                                    <li>Maksimal ukuran file: 5MB</li>
                                    <li>Format tanggal: YYYY-MM-DD atau YYYY-MM-DD HH:MM:SS (akan dinormalisasi)</li>
                                    <li>Format angka: menggunakan titik (.) atau koma (,) sebagai pemisah desimal</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* File Input */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="file"
                                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                            >
                                Pilih File CSV atau Excel
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <Input
                                        id="file"
                                        type="file"
                                        accept=".csv,.xlsx,.xls"
                                        onChange={handleFileChange}
                                        className="cursor-pointer"
                                    />
                                </div>
                                {fileName && (
                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                        {fileName}
                                    </span>
                                )}
                            </div>
                            {errors.file && (
                                <p className="text-sm text-red-600 dark:text-red-400">{errors.file}</p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <Button
                                type="submit"
                                disabled={!selectedFile || processing}
                                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                            >
                                {processing ? (
                                    <>
                                        <Upload className="mr-2 h-4 w-4 animate-spin" />
                                        Mengunggah...
                                    </>
                                ) : (
                                    <>
                                        <FileUp className="mr-2 h-4 w-4" />
                                        Unggah File
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={totalData === 0 || processing}
                                className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus Semua Data
                            </Button>
                        </div>
                    </form>

                    {/* Data Count */}
                    <div className="mt-6 space-y-2 rounded-md bg-neutral-50 p-3 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                Total Data: <span className="text-blue-600 dark:text-blue-400">{totalData}</span>
                            </span>
                        </div>
                        <div className="ml-6 text-xs text-neutral-600 dark:text-neutral-400">
                            Data akan dibagi menjadi 80% untuk data latih dan 20% untuk data uji
                        </div>
                    </div>
                </div>

                {/* Preview Table Section */}
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                            Preview Data
                        </h2>
                    </div>

                    {trainingData.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Belum ada data. Silakan unggah file CSV atau Excel untuk memulai.
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
                                        {trainingData.data.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
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
                                                router.get('/data/input', {
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
                                                                router.get('/data/input', { page })
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
                                                router.get('/data/input', {
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


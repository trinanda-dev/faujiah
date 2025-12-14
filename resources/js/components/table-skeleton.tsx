/**
 * Komponen Skeleton untuk Tabel
 * 
 * Menampilkan skeleton loading untuk tabel dengan jumlah baris dan kolom yang dapat dikustomisasi.
 */

import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
    /** Jumlah baris skeleton */
    rows?: number;
    /** Jumlah kolom skeleton */
    cols?: number;
    /** Apakah menampilkan header */
    showHeader?: boolean;
}

export function TableSkeleton({ rows = 5, cols = 4, showHeader = true }: TableSkeletonProps) {
    return (
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="overflow-x-auto">
                <table className="w-full">
                    {showHeader && (
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                            <tr>
                                {Array.from({ length: cols }).map((_, i) => (
                                    <th key={i} className="px-6 py-4">
                                        <Skeleton className="h-4 w-24" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    )}
                    <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <tr key={rowIndex}>
                                {Array.from({ length: cols }).map((_, colIndex) => (
                                    <td key={colIndex} className="px-6 py-4">
                                        <Skeleton className="h-4 w-full" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


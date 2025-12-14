/**
 * Komponen Skeleton untuk Card
 * 
 * Menampilkan skeleton loading untuk card dengan berbagai variasi.
 */

import { Skeleton } from '@/components/ui/skeleton';

interface CardSkeletonProps {
    /** Jumlah card skeleton */
    count?: number;
    /** Apakah menampilkan header */
    showHeader?: boolean;
    /** Apakah menampilkan footer */
    showFooter?: boolean;
}

export function CardSkeleton({ count = 1, showHeader = true, showFooter = false }: CardSkeletonProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                >
                    {showHeader && (
                        <div className="mb-4 space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    )}
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                    </div>
                    {showFooter && (
                        <div className="mt-4 flex gap-2">
                            <Skeleton className="h-9 w-24" />
                            <Skeleton className="h-9 w-24" />
                        </div>
                    )}
                </div>
            ))}
        </>
    );
}


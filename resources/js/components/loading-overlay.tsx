/**
 * Komponen Loading Overlay
 * 
 * Menampilkan overlay loading dengan spinner ketika halaman sedang loading atau ada proses yang berjalan.
 * Digunakan untuk memberikan feedback visual kepada user bahwa aplikasi sedang memproses sesuatu.
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
    /** Apakah overlay ditampilkan */
    show?: boolean;
    /** Pesan loading (opsional) */
    message?: string;
    /** Apakah overlay fullscreen atau hanya di container */
    fullscreen?: boolean;
    /** Class name tambahan */
    className?: string;
}

export function LoadingOverlay({ 
    show = false, 
    message, 
    fullscreen = false,
    className 
}: LoadingOverlayProps) {
    if (!show) {
        return null;
    }

    return (
        <div
            className={cn(
                'absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-neutral-900/80',
                fullscreen && 'fixed',
                className
            )}
        >
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                {message && (
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}


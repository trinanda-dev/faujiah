/**
 * Hook untuk mendeteksi state navigasi Inertia
 * 
 * Menggunakan Inertia's router untuk mendeteksi apakah sedang ada navigasi atau proses yang berjalan.
 */

import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/**
 * Hook untuk mendeteksi apakah sedang ada navigasi atau proses yang berjalan
 * 
 * @returns boolean - true jika sedang loading/navigating
 */
export function useNavigationState(): boolean {
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        // Listen to Inertia navigation events
        // Inertia v2 uses router.on() for event listeners
        const unsubscribeStart = router.on('start', () => {
            setIsNavigating(true);
        });

        const unsubscribeFinish = router.on('finish', () => {
            setIsNavigating(false);
        });

        const unsubscribeError = router.on('error', () => {
            setIsNavigating(false);
        });

        return () => {
            // Cleanup: unsubscribe from all events
            if (typeof unsubscribeStart === 'function') {
                unsubscribeStart();
            }
            if (typeof unsubscribeFinish === 'function') {
                unsubscribeFinish();
            }
            if (typeof unsubscribeError === 'function') {
                unsubscribeError();
            }
        };
    }, []);

    return isNavigating;
}


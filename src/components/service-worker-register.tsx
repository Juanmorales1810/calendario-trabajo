'use client';

import { useEffect, useState } from 'react';

export function ServiceWorkerRegister() {
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
    const [showUpdate, setShowUpdate] = useState(false);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker
            .register('/sw.js', { scope: '/', updateViaCache: 'none' })
            .then((registration) => {
                if (registration.waiting) {
                    setWaitingWorker(registration.waiting);
                    setShowUpdate(true);
                }

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            setWaitingWorker(newWorker);
                            setShowUpdate(true);
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });
    }, []);

    const handleUpdate = () => {
        waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
        setShowUpdate(false);
    };

    if (!showUpdate) return null;

    return (
        <div
            role="alert"
            className="bg-primary text-primary-foreground fixed right-4 bottom-4 z-[9999] flex items-center gap-3 rounded-lg px-5 py-3 shadow-lg">
            <span className="text-sm">Nueva versión disponible</span>
            <button
                onClick={handleUpdate}
                className="bg-primary-foreground text-primary cursor-pointer rounded px-3 py-1.5 text-sm font-medium">
                Actualizar
            </button>
        </div>
    );
}

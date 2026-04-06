'use client';

import { useEffect, useState } from 'react';
import { BellIcon, BellOffIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; i++) {
        view[i] = rawData.charCodeAt(i);
    }
    return view;
}

export function PushNotificationManager() {
    const [permission, setPermission] = useState<PermissionState>('default');
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    useEffect(() => {
        if (!('Notification' in window) || !('serviceWorker' in navigator) || !vapidKey) {
            setPermission('unsupported');
            return;
        }
        setPermission(Notification.permission as PermissionState);

        // Check if already subscribed
        navigator.serviceWorker.ready.then(async (reg) => {
            const sub = await reg.pushManager.getSubscription();
            setSubscribed(!!sub);
        });
    }, [vapidKey]);

    const subscribe = async () => {
        if (!vapidKey) return;
        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;

            // Request permission only after user gesture (this function is called on button click)
            const perm = await Notification.requestPermission();
            setPermission(perm as PermissionState);
            if (perm !== 'granted') return;

            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });

            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: btoa(
                            String.fromCharCode(
                                ...new Uint8Array(sub.getKey('p256dh') as ArrayBuffer)
                            )
                        ),
                        auth: btoa(
                            String.fromCharCode(
                                ...new Uint8Array(sub.getKey('auth') as ArrayBuffer)
                            )
                        ),
                    },
                }),
            });
            setSubscribed(true);
        } catch {
            // User closed the prompt or an error occurred
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (!sub) return;

            await fetch('/api/push/subscribe', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: sub.endpoint }),
            });
            await sub.unsubscribe();
            setSubscribed(false);
        } catch {
            // silenced
        } finally {
            setLoading(false);
        }
    };

    // Don't render if push not supported or VAPID key not configured
    if (permission === 'unsupported' || !vapidKey) return null;

    // Already denied — show a hint, no retry button possible
    if (permission === 'denied') {
        return (
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
                <BellOffIcon size={14} />
                Notificaciones bloqueadas. Habilitálas desde la configuración del navegador.
            </p>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={subscribed ? unsubscribe : subscribe}
            className="gap-2">
            {subscribed ? (
                <>
                    <BellOffIcon size={15} />
                    Desactivar notificaciones
                </>
            ) : (
                <>
                    <BellIcon size={15} />
                    Activar notificaciones
                </>
            )}
        </Button>
    );
}

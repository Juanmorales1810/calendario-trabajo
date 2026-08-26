'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Play, Square, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const IDB_DB = 'horaswork-sync';
const IDB_STORE = 'pending-clock-actions';
const SYNC_TAG = 'sync-clock-actions';

function openSyncDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(IDB_DB, 1);
        req.onupgradeneeded = (e) => {
            (e.target as IDBOpenDBRequest).result.createObjectStore(IDB_STORE, { keyPath: 'id' });
        };
        req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
        req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
    });
}

async function queueClockAction(action: string, clientTime: string): Promise<void> {
    const db = await openSyncDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const req = tx.objectStore(IDB_STORE).put({ id: Date.now(), action, clientTime });
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject((e.target as IDBRequest).error);
    });
}

type ClockStatus = 'idle' | 'clocked-in' | 'between-shifts' | 'clocked-in-2' | 'done';

interface ClockState {
    status: ClockStatus;
    entrada?: string;
    salida?: string;
    entrada2?: string;
    salida2?: string;
    entryId?: string;
}

interface ClockButtonProps {
    onClockAction?: () => void;
}

export function ClockButton({ onClockAction }: ClockButtonProps) {
    const [state, setState] = useState<ClockState>({ status: 'idle' });
    const [loading, setLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState('');

    // Live clock
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })
            );
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/clock');
            if (res.ok) {
                const data = await res.json();
                setState(data);
            }
        } catch {
            // silenced
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Listen for background-sync completion messages from the service worker
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'SYNC_COMPLETE') {
                fetchStatus();
                onClockAction?.();
                toast.success('Fichaje sincronizado correctamente');
            }
        };
        navigator.serviceWorker.addEventListener('message', handler);
        return () => navigator.serviceWorker.removeEventListener('message', handler);
    }, [fetchStatus, onClockAction]);

    const handleAction = useCallback(
        async (action: string) => {
            setLoading(true);
            const now = new Date();
            const hh = now.getHours().toString().padStart(2, '0');
            const mm = now.getMinutes().toString().padStart(2, '0');
            const clientTime = `${hh}:${mm}`;
            try {
                const res = await fetch('/api/clock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action, clientTime }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setState(data);
                    onClockAction?.();
                }
            } catch {
                // Network error — queue for background sync
                try {
                    await queueClockAction(action, clientTime);
                    if ('serviceWorker' in navigator && 'SyncManager' in window) {
                        const reg = await navigator.serviceWorker.ready;
                        await (
                            reg as ServiceWorkerRegistration & {
                                sync: { register(tag: string): Promise<void> };
                            }
                        ).sync.register(SYNC_TAG);
                        toast.info('Sin conexión. El fichaje se enviará en cuanto vuelva la red.');
                    } else {
                        toast.error(
                            'Sin conexión y sincronización no disponible en este navegador.'
                        );
                    }
                } catch {
                    toast.error('Error al registrar el fichaje.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onClockAction]
    );

    const statusConfig: Record<
        ClockStatus,
        {
            label: string;
            action: string;
            actionLabel: string;
            icon: typeof LogIn;
            variant: 'default' | 'destructive' | 'outline' | 'secondary';
            secondaryAction?: string;
            secondaryLabel?: string;
            secondaryIcon?: typeof Play;
        }
    > = {
        idle: {
            label: 'Sin fichar hoy',
            action: 'clock-in',
            actionLabel: 'Marcar entrada',
            icon: LogIn,
            variant: 'default',
        },
        'clocked-in': {
            label: `Entrada: ${state.entrada}`,
            action: 'clock-out',
            actionLabel: 'Marcar salida',
            icon: LogOut,
            variant: 'destructive',
        },
        'between-shifts': {
            label: 'Día completo',
            action: 'clock-in-2',
            actionLabel: 'Agregar turno 2',
            icon: Play,
            variant: 'secondary',
        },
        'clocked-in-2': {
            label: `T2 entrada: ${state.entrada2}`,
            action: 'clock-out-2',
            actionLabel: 'Salida turno 2',
            icon: Square,
            variant: 'destructive',
        },
        done: {
            label: 'Día completo',
            action: '',
            actionLabel: '',
            icon: Clock,
            variant: 'outline',
        },
    };

    const config = statusConfig[state.status];
    const Icon = config.icon;
    const isRunning = state.status === 'clocked-in' || state.status === 'clocked-in-2';
    const [hh = '--', mm = '--'] = currentTime.split(':');

    // Punch card: the day's four possible stamps, in order
    const steps = [
        { label: 'E1', value: state.entrada },
        { label: 'S1', value: state.salida },
        { label: 'E2', value: state.entrada2 },
        { label: 'S2', value: state.salida2 },
    ] as const;

    return (
        <div className="bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-xs">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-4">
                    {/* Live clock — LCD-style display */}
                    <div
                        className={cn(
                            'bg-foreground/[0.03] flex h-14 items-center justify-center rounded-md border px-3 dark:bg-black/40',
                            isRunning && 'border-primary/40 motion-safe:animate-pulse'
                        )}>
                        <span className="text-primary font-mono text-2xl font-semibold tracking-wider tabular-nums">
                            {hh}
                            <span className="motion-safe:animate-pulse">:</span>
                            {mm}
                        </span>
                    </div>

                    <div>
                        <p className="text-muted-foreground text-xs tracking-wide uppercase">
                            Fichaje del día
                        </p>
                        <p className="text-sm font-medium">{config.label}</p>
                        {state.status === 'done' && (
                            <p className="text-muted-foreground text-xs">
                                {state.entrada} - {state.salida}
                                {state.entrada2 && ` | ${state.entrada2} - ${state.salida2}`}
                            </p>
                        )}
                        {state.status === 'between-shifts' && (
                            <p className="text-muted-foreground text-xs">
                                {state.entrada} - {state.salida} · turno 2 opcional
                            </p>
                        )}
                        {state.status === 'clocked-in' && (
                            <p className="text-muted-foreground text-xs">
                                Trabajando desde las {state.entrada}...
                            </p>
                        )}
                        {state.status === 'clocked-in-2' && (
                            <p className="text-muted-foreground text-xs">
                                Turno 1: {state.entrada} - {state.salida}
                            </p>
                        )}
                    </div>
                </div>

                {state.status === 'idle' ||
                state.status === 'clocked-in' ||
                state.status === 'clocked-in-2' ? (
                    <Button
                        onClick={() => handleAction(config.action)}
                        disabled={loading}
                        variant={config.variant}
                        size="lg"
                        className="w-full min-w-[180px] sm:w-auto">
                        <Icon className="mr-2 h-4 w-4" />
                        {loading ? 'Procesando...' : config.actionLabel}
                    </Button>
                ) : (
                    <div className="flex flex-col items-center gap-1.5 sm:items-end">
                        <div className="border-primary/50 text-primary flex -rotate-6 items-center gap-1.5 rounded-md border-2 border-dashed px-3 py-1.5 text-xs font-bold tracking-widest uppercase">
                            <Clock className="h-3.5 w-3.5" />
                            Completo
                        </div>
                        {state.status === 'between-shifts' && (
                            <Button
                                onClick={() => handleAction(config.action)}
                                disabled={loading}
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground">
                                <Icon className="mr-1.5 h-3.5 w-3.5" />
                                {loading ? 'Procesando...' : config.actionLabel}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Punch card row — one stamp per clock event of the day */}
            <div className="flex items-center gap-1.5">
                {steps.map((step, i) => (
                    <Fragment key={step.label}>
                        {i > 0 && (
                            <div
                                className={cn(
                                    'h-px flex-1',
                                    steps[i - 1].value ? 'bg-primary/40' : 'bg-border'
                                )}
                            />
                        )}
                        <div
                            title={
                                step.value ? `${step.label}: ${step.value}` : `${step.label}: pendiente`
                            }
                            className={cn(
                                'flex h-6 min-w-11 items-center justify-center rounded-full border px-1.5 font-mono text-[10px] font-medium tabular-nums',
                                step.value
                                    ? 'border-primary/40 bg-primary/10 text-primary'
                                    : 'border-border text-muted-foreground border-dashed'
                            )}>
                            {step.value || '··:··'}
                        </div>
                    </Fragment>
                ))}
            </div>
        </div>
    );
}

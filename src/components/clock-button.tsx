'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Play, Square, Clock } from 'lucide-react';

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

    const handleAction = async (action: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/clock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            if (res.ok) {
                const data = await res.json();
                setState(data);
                onClockAction?.();
            }
        } catch {
            // silenced
        } finally {
            setLoading(false);
        }
    };

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
            label: `Turno 1: ${state.entrada} - ${state.salida}`,
            action: 'clock-in-2',
            actionLabel: 'Entrada turno 2',
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

    return (
        <div className="bg-card flex flex-col items-center gap-4 rounded-lg border p-5 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
                {/* Live clock */}
                <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
                    <span className="text-primary text-lg font-bold tabular-nums">
                        {currentTime.slice(0, 5)}
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
                            Puedes iniciar un segundo turno
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

            {state.status !== 'done' && (
                <Button
                    onClick={() => handleAction(config.action)}
                    disabled={loading}
                    variant={config.variant}
                    size="lg"
                    className="min-w-[180px]">
                    <Icon className="mr-2 h-4 w-4" />
                    {loading ? 'Procesando...' : config.actionLabel}
                </Button>
            )}
        </div>
    );
}

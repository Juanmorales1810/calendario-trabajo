'use client';

import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { WorkEntryForm } from '@/components/work-entry-form';
import { WorkEntryTable } from '@/components/work-entry-table';
import { MonthlySummary } from '@/components/monthly-summary';
import { ClockButton } from '@/components/clock-button';
import { Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface WorkEntry {
    _id: string;
    fecha: string;
    dia: string;
    entrada: string;
    salida: string;
    horasTurno: number;
    horasLaborales: number;
    horasExtras: number;
    ubicacion: string;
    entrada2?: string;
    salida2?: string;
    horasTurno2: number;
    observaciones?: string;
}

interface UserSettingsData {
    salarioMensual: number;
    horasJornada: number;
    trabajaSabados: boolean;
    moneda: string;
}

const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

export default function DashboardPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [entries, setEntries] = useState<WorkEntry[]>([]);
    const [settings, setSettings] = useState<UserSettingsData | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isPending && !session) {
            router.push('/login');
        }
    }, [session, isPending, router]);

    const fetchEntries = useCallback(async () => {
        try {
            const res = await fetch(`/api/work-entries?mes=${selectedMonth}&anio=${selectedYear}`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            }
        } catch {
            // silenced
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, selectedYear]);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch {
            // silenced
        }
    }, []);

    useEffect(() => {
        if (session) {
            fetchEntries();
            fetchSettings();
        }
    }, [session, fetchEntries, fetchSettings]);

    const handleEntryCreated = () => {
        setDialogOpen(false);
        setEditingEntry(null);
        fetchEntries();
    };

    const handleEdit = (entry: WorkEntry) => {
        setEditingEntry(entry);
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/work-entries/${id}`, { method: 'DELETE' });
        if (res.ok) fetchEntries();
    };

    if (isPending) {
        return (
            <div className="container mx-auto space-y-6 px-4 py-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-36" />
                </div>
                <Skeleton className="h-24 w-full rounded-lg" />
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-[150px]" />
                    <Skeleton className="h-10 w-[100px]" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-lg" />
                    ))}
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (!session) return null;

    const currentYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    return (
        <div className="container mx-auto space-y-6 px-4 py-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                        <Clock className="text-primary h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Control de Horas</h1>
                        <p className="text-muted-foreground text-sm">
                            Registra y gestiona tus horas de trabajo
                        </p>
                    </div>
                </div>

                <Dialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) setEditingEntry(null);
                    }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo registro
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingEntry ? 'Editar registro' : 'Nuevo registro de horas'}
                            </DialogTitle>
                        </DialogHeader>
                        <WorkEntryForm
                            entry={editingEntry}
                            horasJornada={settings?.horasJornada ?? 9}
                            trabajaSabados={settings?.trabajaSabados ?? false}
                            onSuccess={handleEntryCreated}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Clock In/Out */}
            <ClockButton onClockAction={fetchEntries} />

            {/* Month/Year filter */}
            <div className="flex items-center gap-3">
                <Select
                    value={selectedMonth.toString()}
                    onValueChange={(v) => setSelectedMonth(Number(v))}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {meses.map((mes, i) => (
                            <SelectItem key={i} value={(i + 1).toString()}>
                                {mes}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={selectedYear.toString()}
                    onValueChange={(v) => setSelectedYear(Number(v))}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {currentYears.map((y) => (
                            <SelectItem key={y} value={y.toString()}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Monthly Summary */}
            <MonthlySummary entries={entries} settings={settings} />

            {/* Table */}
            <WorkEntryTable
                entries={entries}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
}

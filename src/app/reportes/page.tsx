'use client';

import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { minutesToDisplay, calculateSalaryEstimate } from '@/lib/time-utils';
import { BarChart3, Clock, TrendingUp, DollarSign } from 'lucide-react';
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
    horasTurno2: number;
    observaciones?: string;
}

interface UserSettingsData {
    salarioMensual: number;
    horasJornada: number;
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

export default function ReportesPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [entries, setEntries] = useState<WorkEntry[]>([]);
    const [settings, setSettings] = useState<UserSettingsData | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isPending && !session) {
            router.push('/login');
        }
    }, [session, isPending, router]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [entriesRes, settingsRes] = await Promise.all([
                fetch(`/api/work-entries?mes=${selectedMonth}&anio=${selectedYear}`),
                fetch('/api/settings'),
            ]);
            if (entriesRes.ok) setEntries(await entriesRes.json());
            if (settingsRes.ok) setSettings(await settingsRes.json());
        } catch {
            // silenced
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        if (session) fetchData();
    }, [session, fetchData]);

    if (isPending) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-muted-foreground">Cargando...</div>
            </div>
        );
    }

    if (!session) return null;

    // Calculations
    const totalTurno1 = entries.reduce((s, e) => s + (e.horasTurno || 0), 0);
    const totalTurno2 = entries.reduce((s, e) => s + (e.horasTurno2 || 0), 0);
    const totalTrabajadas = totalTurno1 + totalTurno2;
    const totalExtras = entries.reduce((s, e) => s + (e.horasExtras || 0), 0);
    const totalLaborales = entries.reduce((s, e) => s + (e.horasLaborales || 0), 0);
    const diasTrabajados = entries.filter((e) => e.horasTurno > 0 || e.horasTurno2 > 0).length;

    // Group by week
    const weeklyData: Record<string, { horas: number; extras: number; dias: number }> = {};
    entries.forEach((e) => {
        const date = new Date(e.fecha);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay() + 1);
        const key = weekStart.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        if (!weeklyData[key]) weeklyData[key] = { horas: 0, extras: 0, dias: 0 };
        weeklyData[key].horas += (e.horasTurno || 0) + (e.horasTurno2 || 0);
        weeklyData[key].extras += e.horasExtras || 0;
        if (e.horasTurno > 0 || e.horasTurno2 > 0) weeklyData[key].dias++;
    });

    // Group by ubicacion
    const ubicacionData: Record<string, number> = {};
    entries.forEach((e) => {
        const ub = e.ubicacion || 'Sin ubicación';
        if (!ubicacionData[ub]) ubicacionData[ub] = 0;
        ubicacionData[ub] += (e.horasTurno || 0) + (e.horasTurno2 || 0);
    });

    const salary =
        settings?.salarioMensual && settings.salarioMensual > 0
            ? calculateSalaryEstimate(
                  settings.salarioMensual,
                  settings.horasJornada,
                  totalLaborales,
                  totalExtras
              )
            : null;

    const moneda = settings?.moneda || 'USD';
    const avgHorasPerDay = diasTrabajados > 0 ? totalTrabajadas / diasTrabajados : 0;
    const currentYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    return (
        <div className="container mx-auto space-y-6 px-4 py-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                        <BarChart3 className="text-primary h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Reportes</h1>
                        <p className="text-muted-foreground text-sm">
                            Resumen detallado de horas y facturación
                        </p>
                    </div>
                </div>
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
            </div>

            {loading ? (
                <div className="flex min-h-[40vh] items-center justify-center">
                    <p className="text-muted-foreground">Cargando reportes...</p>
                </div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="bg-card rounded-lg border p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Total horas</p>
                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                        {minutesToDisplay(totalTrabajadas)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-card rounded-lg border p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                    <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Horas extras</p>
                                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                        {minutesToDisplay(totalExtras)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-card rounded-lg border p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                    <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Promedio diario</p>
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                        {minutesToDisplay(Math.round(avgHorasPerDay))}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {salary && (
                            <div className="bg-card rounded-lg border p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                        <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">
                                            Estimado total
                                        </p>
                                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                            {moneda} {salary.totalEstimado.toLocaleString('es-ES')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Salary breakdown */}
                    {salary && (
                        <div className="bg-card rounded-lg border p-6">
                            <h2 className="mb-4 text-lg font-medium">Desglose salarial</h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                <div className="bg-muted/50 rounded-md p-4">
                                    <p className="text-muted-foreground text-xs">Salario diario</p>
                                    <p className="mt-1 text-lg font-bold">
                                        {moneda} {salary.salarioDiario.toLocaleString('es-ES')}
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-md p-4">
                                    <p className="text-muted-foreground text-xs">Salario/hora</p>
                                    <p className="mt-1 text-lg font-bold">
                                        {moneda} {salary.salarioHora.toLocaleString('es-ES')}
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-md p-4">
                                    <p className="text-muted-foreground text-xs">Salario base</p>
                                    <p className="mt-1 text-lg font-bold">
                                        {moneda} {salary.salarioBase.toLocaleString('es-ES')}
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-md p-4">
                                    <p className="text-muted-foreground text-xs">
                                        Pago extras (x1.5)
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-amber-600 dark:text-amber-400">
                                        {moneda} {salary.pagoExtras.toLocaleString('es-ES')}
                                    </p>
                                </div>
                                <div className="rounded-md bg-emerald-50 p-4 dark:bg-emerald-900/20">
                                    <p className="text-muted-foreground text-xs">Total estimado</p>
                                    <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                        {moneda} {salary.totalEstimado.toLocaleString('es-ES')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Weekly breakdown */}
                    <div className="bg-card rounded-lg border p-6">
                        <h2 className="mb-4 text-lg font-medium">Resumen por semana</h2>
                        {Object.keys(weeklyData).length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 border-b">
                                            <th className="px-4 py-2 text-left font-medium">
                                                Semana del
                                            </th>
                                            <th className="px-4 py-2 text-left font-medium">
                                                Días
                                            </th>
                                            <th className="px-4 py-2 text-left font-medium">
                                                Horas
                                            </th>
                                            <th className="px-4 py-2 text-left font-medium">
                                                Extras
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(weeklyData).map(([week, data]) => (
                                            <tr key={week} className="border-b last:border-b-0">
                                                <td className="px-4 py-2">{week}</td>
                                                <td className="px-4 py-2">{data.dias}</td>
                                                <td className="px-4 py-2">
                                                    {minutesToDisplay(data.horas)}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span
                                                        className={
                                                            data.extras > 0
                                                                ? 'font-medium text-amber-600 dark:text-amber-400'
                                                                : 'text-muted-foreground'
                                                        }>
                                                        {minutesToDisplay(data.extras)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No hay datos para este período
                            </p>
                        )}
                    </div>

                    {/* Location breakdown */}
                    <div className="bg-card rounded-lg border p-6">
                        <h2 className="mb-4 text-lg font-medium">Horas por ubicación</h2>
                        {Object.keys(ubicacionData).length > 0 ? (
                            <div className="space-y-3">
                                {Object.entries(ubicacionData)
                                    .filter(([_, mins]) => mins > 0)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([ubicacion, mins]) => {
                                        const pct =
                                            totalTrabajadas > 0
                                                ? (mins / totalTrabajadas) * 100
                                                : 0;
                                        return (
                                            <div key={ubicacion}>
                                                <div className="mb-1 flex justify-between text-sm">
                                                    <span>{ubicacion}</span>
                                                    <span className="text-muted-foreground">
                                                        {minutesToDisplay(mins)} ({Math.round(pct)}
                                                        %)
                                                    </span>
                                                </div>
                                                <div className="bg-muted h-2 overflow-hidden rounded-full">
                                                    <div
                                                        className="bg-primary h-full rounded-full transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No hay datos para este período
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

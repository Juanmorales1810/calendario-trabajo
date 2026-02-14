'use client';

import { minutesToDisplay, calculateSalaryEstimate } from '@/lib/time-utils';
import { Clock, DollarSign, TrendingUp, Calendar } from 'lucide-react';

interface WorkEntry {
    _id: string;
    horasTurno: number;
    horasLaborales: number;
    horasExtras: number;
    horasTurno2: number;
}

interface UserSettingsData {
    salarioMensual: number;
    horasJornada: number;
    moneda: string;
}

interface MonthlySummaryProps {
    entries: WorkEntry[];
    settings: UserSettingsData | null;
}

export function MonthlySummary({ entries, settings }: MonthlySummaryProps) {
    const totalTurno1 = entries.reduce((sum, e) => sum + (e.horasTurno || 0), 0);
    const totalTurno2 = entries.reduce((sum, e) => sum + (e.horasTurno2 || 0), 0);
    const totalTrabajadas = totalTurno1 + totalTurno2;
    const totalExtras = entries.reduce((sum, e) => sum + (e.horasExtras || 0), 0);
    const totalLaborales = entries.reduce((sum, e) => sum + (e.horasLaborales || 0), 0);
    const diasTrabajados = entries.filter((e) => e.horasTurno > 0 || e.horasTurno2 > 0).length;

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

    const cards = [
        {
            title: 'Días trabajados',
            value: diasTrabajados.toString(),
            icon: Calendar,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            title: 'Horas totales',
            value: minutesToDisplay(totalTrabajadas),
            icon: Clock,
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-100 dark:bg-green-900/30',
        },
        {
            title: 'Horas extras',
            value: minutesToDisplay(totalExtras),
            icon: TrendingUp,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-100 dark:bg-amber-900/30',
        },
    ];

    if (salary) {
        cards.push({
            title: 'Estimado total',
            value: `${moneda} ${salary.totalEstimado.toLocaleString('es-ES')}`,
            icon: DollarSign,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        });
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <div key={card.title} className="bg-card rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                            <card.icon className={`h-5 w-5 ${card.color}`} />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">{card.title}</p>
                            <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                        </div>
                    </div>
                </div>
            ))}

            {salary && (
                <div className="bg-card col-span-full rounded-lg border p-4">
                    <h3 className="mb-3 text-sm font-medium">Desglose salarial estimado</h3>
                    <div className="grid gap-2 text-sm sm:grid-cols-4">
                        <div>
                            <span className="text-muted-foreground">Salario/hora:</span>
                            <span className="ml-2 font-medium">
                                {moneda} {salary.salarioHora.toLocaleString('es-ES')}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Salario/día:</span>
                            <span className="ml-2 font-medium">
                                {moneda} {salary.salarioDiario.toLocaleString('es-ES')}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Base mes:</span>
                            <span className="ml-2 font-medium">
                                {moneda} {salary.salarioBase.toLocaleString('es-ES')}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Pago extras:</span>
                            <span className="ml-2 font-medium text-amber-600 dark:text-amber-400">
                                {moneda} {salary.pagoExtras.toLocaleString('es-ES')}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { memo, useMemo } from 'react';
import { minutesToDisplay, calculateSalaryEstimate } from '@/lib/time-utils';
import { Clock, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export const MonthlySummary = memo(function MonthlySummary({
    entries,
    settings,
}: MonthlySummaryProps) {
    // js-combine-iterations: single pass instead of 4 reduce + 1 filter
    const {
        totalTurno1,
        totalTurno2,
        totalTrabajadas,
        totalExtras,
        totalLaborales,
        diasTrabajados,
    } = useMemo(() => {
        let t1 = 0,
            t2 = 0,
            extras = 0,
            laborales = 0,
            dias = 0;
        for (const e of entries) {
            const eT1 = e.horasTurno || 0;
            const eT2 = e.horasTurno2 || 0;
            t1 += eT1;
            t2 += eT2;
            extras += e.horasExtras || 0;
            laborales += e.horasLaborales || 0;
            if (eT1 > 0 || eT2 > 0) dias++;
        }
        return {
            totalTurno1: t1,
            totalTurno2: t2,
            totalTrabajadas: t1 + t2,
            totalExtras: extras,
            totalLaborales: laborales,
            diasTrabajados: dias,
        };
    }, [entries]);

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
    const fmt = (n: number) => n.toLocaleString('es-ES');

    const stats = [
        { title: 'Días trabajados', value: diasTrabajados.toString(), icon: Calendar },
        { title: 'Horas totales', value: minutesToDisplay(totalTrabajadas), icon: Clock },
        {
            title: 'Horas extras',
            value: minutesToDisplay(totalExtras),
            icon: TrendingUp,
            emphasis: totalExtras > 0,
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* Time ledger strip */}
            <div className="bg-card divide-border grid divide-y rounded-xl border shadow-xs sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {stats.map((stat) => (
                    <div key={stat.title} className="flex items-center gap-3 px-5 py-4">
                        <stat.icon className="text-muted-foreground h-4 w-4 shrink-0" />
                        <div>
                            <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
                                {stat.title}
                            </p>
                            <p
                                className={cn(
                                    'font-mono text-xl font-semibold tabular-nums',
                                    stat.emphasis && 'text-primary'
                                )}>
                                {stat.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Salary receipt */}
            {salary && (
                <div className="bg-card rounded-xl border p-5 shadow-xs">
                    <div className="mb-3 flex items-center gap-2">
                        <DollarSign className="text-muted-foreground h-4 w-4" />
                        <h3 className="text-sm font-medium">Desglose salarial estimado</h3>
                    </div>
                    <dl className="space-y-2 text-sm">
                        {[
                            { label: 'Salario/hora', value: salary.salarioHora },
                            { label: 'Salario/día', value: salary.salarioDiario },
                            { label: 'Base mes', value: salary.salarioBase },
                            { label: 'Pago extras', value: salary.pagoExtras },
                        ].map((row) => (
                            <div key={row.label} className="flex items-baseline gap-2">
                                <dt className="text-muted-foreground shrink-0">{row.label}</dt>
                                <span
                                    aria-hidden
                                    className="border-border mb-1 h-px flex-1 border-b border-dotted"
                                />
                                <dd className="font-mono font-medium tabular-nums">
                                    {moneda} {fmt(row.value)}
                                </dd>
                            </div>
                        ))}
                        <div className="border-border flex items-baseline gap-2 border-t pt-2">
                            <dt className="font-medium">Total estimado</dt>
                            <span aria-hidden className="h-px flex-1" />
                            <dd className="text-primary font-mono text-lg font-bold tabular-nums">
                                {moneda} {fmt(salary.totalEstimado)}
                            </dd>
                        </div>
                    </dl>
                </div>
            )}
        </div>
    );
});

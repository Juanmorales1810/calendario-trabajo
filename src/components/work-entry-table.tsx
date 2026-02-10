'use client';

import { minutesToDisplay } from '@/lib/time-utils';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';

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

interface WorkEntryTableProps {
    entries: WorkEntry[];
    loading: boolean;
    onEdit: (entry: WorkEntry) => void;
    onDelete: (id: string) => void;
}

export function WorkEntryTable({ entries, loading, onEdit, onDelete }: WorkEntryTableProps) {
    if (loading) {
        return (
            <div className="bg-card rounded-lg border p-8 text-center">
                <p className="text-muted-foreground">Cargando registros...</p>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="bg-card rounded-lg border p-8 text-center">
                <p className="text-muted-foreground">
                    No hay registros para este período. Añade uno con el botón &quot;Nuevo
                    registro&quot;.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-card overflow-hidden rounded-lg border">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/50 border-b">
                            <th className="px-4 py-3 text-left font-medium">Fecha</th>
                            <th className="px-4 py-3 text-left font-medium">Día</th>
                            <th className="px-4 py-3 text-left font-medium">Entrada</th>
                            <th className="px-4 py-3 text-left font-medium">Salida</th>
                            <th className="px-4 py-3 text-left font-medium">Turno</th>
                            <th className="px-4 py-3 text-left font-medium">Laboral</th>
                            <th className="px-4 py-3 text-left font-medium">Extras</th>
                            <th className="px-4 py-3 text-left font-medium">Ubicación</th>
                            <th className="px-4 py-3 text-left font-medium">Turno 2</th>
                            <th className="px-4 py-3 text-left font-medium">Obs.</th>
                            <th className="px-4 py-3 text-right font-medium">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => {
                            const fecha = new Date(entry.fecha);
                            const isWeekend = fecha.getDay() === 0 || fecha.getDay() === 6;

                            return (
                                <tr
                                    key={entry._id}
                                    className={`border-b last:border-b-0 ${
                                        isWeekend ? 'bg-muted/30' : ''
                                    } ${entry.horasExtras > 0 ? 'border-l-2 border-l-amber-500' : ''}`}>
                                    <td className="px-4 py-2.5">
                                        {fecha.toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                        })}
                                    </td>
                                    <td className="px-4 py-2.5 capitalize">{entry.dia}</td>
                                    <td className="px-4 py-2.5">{entry.entrada || '-'}</td>
                                    <td className="px-4 py-2.5">{entry.salida || '-'}</td>
                                    <td className="px-4 py-2.5">
                                        {minutesToDisplay(entry.horasTurno)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        {minutesToDisplay(entry.horasLaborales)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span
                                            className={
                                                entry.horasExtras > 0
                                                    ? 'font-medium text-amber-600 dark:text-amber-400'
                                                    : 'text-muted-foreground'
                                            }>
                                            {minutesToDisplay(entry.horasExtras)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5">{entry.ubicacion || '-'}</td>
                                    <td className="px-4 py-2.5">
                                        {entry.horasTurno2 > 0
                                            ? minutesToDisplay(entry.horasTurno2)
                                            : '-'}
                                    </td>
                                    <td className="text-muted-foreground max-w-[120px] truncate px-4 py-2.5">
                                        {entry.observaciones || '-'}
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => onEdit(entry)}>
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive h-7 w-7"
                                                onClick={() => onDelete(entry._id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

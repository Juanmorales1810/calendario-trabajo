'use client';

import { memo } from 'react';
import { minutesToDisplay } from '@/lib/time-utils';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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

export const WorkEntryTable = memo(function WorkEntryTable({
    entries,
    loading,
    onEdit,
    onDelete,
}: WorkEntryTableProps) {
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
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="px-4 py-3">Fecha</TableHead>
                        <TableHead className="px-4 py-3">Día</TableHead>
                        <TableHead className="px-4 py-3">Entrada</TableHead>
                        <TableHead className="px-4 py-3">Salida</TableHead>
                        <TableHead className="px-4 py-3">Turno</TableHead>
                        {/* <TableHead className="px-4 py-3">Laboral</TableHead> */}
                        <TableHead className="px-4 py-3">Extras</TableHead>
                        {/* <TableHead className="px-4 py-3">Ubicación</TableHead> */}
                        <TableHead className="px-4 py-3">Turno 2</TableHead>
                        {/* <TableHead className="px-4 py-3">Obs.</TableHead> */}
                        <TableHead className="px-4 py-3 text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.map((entry) => {
                        const fecha = new Date(entry.fecha);
                        const isWeekend = fecha.getDay() === 0 || fecha.getDay() === 6;

                        return (
                            <TableRow
                                key={entry._id}
                                className={`${isWeekend ? 'bg-muted/30' : ''} ${
                                    entry.horasExtras > 0 ? 'border-l-2 border-l-amber-500' : ''
                                }`}>
                                <TableCell className="px-4 py-2.5">
                                    {fecha.toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit',
                                    })}
                                </TableCell>
                                <TableCell className="px-4 py-2.5 capitalize">
                                    {entry.dia}
                                </TableCell>
                                <TableCell className="px-4 py-2.5">
                                    {entry.entrada || '-'}
                                </TableCell>
                                <TableCell className="px-4 py-2.5">{entry.salida || '-'}</TableCell>
                                <TableCell className="px-4 py-2.5">
                                    {minutesToDisplay(entry.horasTurno)}
                                </TableCell>
                                {/* <TableCell className="px-4 py-2.5">
                                    {minutesToDisplay(entry.horasLaborales)}
                                </TableCell> */}
                                <TableCell className="px-4 py-2.5">
                                    <span
                                        className={
                                            entry.horasExtras > 0
                                                ? 'font-medium text-amber-600 dark:text-amber-400'
                                                : 'text-muted-foreground'
                                        }>
                                        {minutesToDisplay(entry.horasExtras)}
                                    </span>
                                </TableCell>
                                {/* <TableCell className="px-4 py-2.5">
                                    {entry.ubicacion || '-'}
                                </TableCell> */}
                                <TableCell className="px-4 py-2.5">
                                    {entry.horasTurno2 > 0
                                        ? minutesToDisplay(entry.horasTurno2)
                                        : '-'}
                                </TableCell>
                                {/* <TableCell className="text-muted-foreground max-w-[120px] truncate px-4 py-2.5">
                                    {entry.observaciones || '-'}
                                </TableCell> */}
                                <TableCell className="px-4 py-2.5 text-right">
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
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
});

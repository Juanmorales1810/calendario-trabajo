'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workEntrySchema, type WorkEntryFormData } from '@/lib/schemas';
import { calculateTimeDiff, getDayName } from '@/lib/time-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

interface WorkEntryFormProps {
    entry?: {
        _id: string;
        fecha: string;
        dia: string;
        entrada: string;
        salida: string;
        horasLaborales: number;
        ubicacion: string;
        entrada2?: string;
        salida2?: string;
        observaciones?: string;
    } | null;
    horasJornada: number;
    onSuccess: () => void;
}

export function WorkEntryForm({ entry, horasJornada, onSuccess }: WorkEntryFormProps) {
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<WorkEntryFormData>({
        resolver: zodResolver(workEntrySchema),
        defaultValues: entry
            ? {
                  fecha: entry.fecha.split('T')[0],
                  dia: entry.dia,
                  entrada: entry.entrada,
                  salida: entry.salida,
                  horasLaborales: entry.horasLaborales,
                  ubicacion: entry.ubicacion,
                  entrada2: entry.entrada2 || '',
                  salida2: entry.salida2 || '',
                  observaciones: entry.observaciones || '',
              }
            : {
                  fecha: new Date().toISOString().split('T')[0],
                  dia: getDayName(new Date()),
                  entrada: '',
                  salida: '',
                  horasLaborales: horasJornada * 60,
                  ubicacion: 'Oficina',
                  entrada2: '',
                  salida2: '',
                  observaciones: '',
              },
    });

    const fechaValue = watch('fecha');
    const entradaValue = watch('entrada');
    const salidaValue = watch('salida');
    const entrada2Value = watch('entrada2');
    const salida2Value = watch('salida2');

    // Auto-calculate day name when fecha changes
    const handleFechaChange = (value: string) => {
        if (value) {
            const date = new Date(value + 'T12:00:00');
            setValue('dia', getDayName(date));
        }
    };

    const onSubmit = async (data: WorkEntryFormData) => {
        setSubmitting(true);
        try {
            const turno1 = calculateTimeDiff(data.entrada, data.salida);
            const turno2 =
                data.entrada2 && data.salida2 ? calculateTimeDiff(data.entrada2, data.salida2) : 0;

            const totalMinutes = turno1 + turno2;
            const extras = Math.max(0, totalMinutes - data.horasLaborales);

            const payload = {
                fecha: new Date(data.fecha + 'T12:00:00'),
                dia: data.dia,
                entrada: data.entrada,
                salida: data.salida,
                horasTurno: turno1,
                horasLaborales: data.horasLaborales,
                horasExtras: extras,
                ubicacion: data.ubicacion,
                entrada2: data.entrada2,
                salida2: data.salida2,
                horasTurno2: turno2,
                observaciones: data.observaciones,
            };

            const url = entry ? `/api/work-entries/${entry._id}` : '/api/work-entries';
            const method = entry ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                onSuccess();
            }
        } finally {
            setSubmitting(false);
        }
    };

    const previewTurno1 =
        entradaValue && salidaValue ? calculateTimeDiff(entradaValue, salidaValue) : 0;
    const previewTurno2 =
        entrada2Value && salida2Value ? calculateTimeDiff(entrada2Value, salida2Value) : 0;
    const previewTotal = previewTurno1 + previewTurno2;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input
                        id="fecha"
                        type="date"
                        {...register('fecha', {
                            onChange: (e) => handleFechaChange(e.target.value),
                        })}
                    />
                    {errors.fecha && (
                        <p className="text-destructive text-xs">{errors.fecha.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dia">Día</Label>
                    <Input id="dia" {...register('dia')} readOnly className="bg-muted" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="entrada">Entrada</Label>
                    <Input id="entrada" type="time" {...register('entrada')} />
                    {errors.entrada && (
                        <p className="text-destructive text-xs">{errors.entrada.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="salida">Salida</Label>
                    <Input id="salida" type="time" {...register('salida')} />
                    {errors.salida && (
                        <p className="text-destructive text-xs">{errors.salida.message}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="ubicacion">Ubicación</Label>
                    <Select
                        defaultValue={entry?.ubicacion || 'Oficina'}
                        onValueChange={(v) => setValue('ubicacion', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Oficina">Oficina</SelectItem>
                            <SelectItem value="Remoto">Remoto</SelectItem>
                            <SelectItem value="Campo">Campo</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="horasLaborales">Horas jornada (min)</Label>
                    <Input
                        id="horasLaborales"
                        type="number"
                        {...register('horasLaborales', { valueAsNumber: true })}
                    />
                </div>
            </div>

            {/* Second shift */}
            <div className="border-border space-y-3 rounded-md border p-3">
                <p className="text-muted-foreground text-sm font-medium">
                    Segundo turno (opcional)
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="entrada2">Entrada 2</Label>
                        <Input id="entrada2" type="time" {...register('entrada2')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="salida2">Salida 2</Label>
                        <Input id="salida2" type="time" {...register('salida2')} />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea id="observaciones" {...register('observaciones')} rows={2} />
            </div>

            {/* Preview */}
            {previewTotal > 0 && (
                <div className="bg-muted rounded-md p-3 text-sm">
                    <span className="font-medium">Vista previa: </span>
                    Turno 1: {Math.floor(previewTurno1 / 60)}h {previewTurno1 % 60}m
                    {previewTurno2 > 0 && (
                        <>
                            {' '}
                            | Turno 2: {Math.floor(previewTurno2 / 60)}h {previewTurno2 % 60}m
                        </>
                    )}{' '}
                    | Total: {Math.floor(previewTotal / 60)}h {previewTotal % 60}m
                </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Guardando...' : entry ? 'Actualizar registro' : 'Guardar registro'}
            </Button>
        </form>
    );
}

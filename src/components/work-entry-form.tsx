'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workEntrySchema, type WorkEntryFormData } from '@/lib/schemas';
import { calculateTimeDiff, calculateExtras, getDayName } from '@/lib/time-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimePicker } from '@/components/ui/time-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    trabajaSabados: boolean;
    onSuccess: () => void;
}

function isWeekend(dia: string): boolean {
    const d = dia.toLowerCase();
    return d === 'domingo' || d === 'sábado' || d === 'sabado';
}

export function WorkEntryForm({
    entry,
    horasJornada,
    trabajaSabados,
    onSuccess,
}: WorkEntryFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [dateOpen, setDateOpen] = useState(false);

    const initialDate = entry ? new Date(entry.fecha.split('T')[0] + 'T12:00:00') : new Date();
    const initialDia = entry ? entry.dia : getDayName(initialDate);

    const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

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
                  ubicacion: 'Oficina',
                  entrada2: '',
                  salida2: '',
                  observaciones: '',
              },
    });

    const diaValue = watch('dia');
    const entradaValue = watch('entrada');
    const salidaValue = watch('salida');
    const entrada2Value = watch('entrada2');
    const salida2Value = watch('salida2');

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date);
            const fechaStr = format(date, 'yyyy-MM-dd');
            const dia = getDayName(date);
            setValue('fecha', fechaStr);
            setValue('dia', dia);
            setDateOpen(false);
        }
    };

    // Calcula horasLaborales automáticamente según el día
    function getJornadaMinutos(dia: string): number {
        const d = dia.toLowerCase();
        if (d === 'domingo') return 0;
        if (d === 'sábado' || d === 'sabado') {
            return trabajaSabados ? 4 * 60 : 0;
        }
        return horasJornada * 60;
    }

    const onSubmit = async (data: WorkEntryFormData) => {
        setSubmitting(true);
        try {
            const turno1 = calculateTimeDiff(data.entrada, data.salida);
            const turno2 =
                data.entrada2 && data.salida2 ? calculateTimeDiff(data.entrada2, data.salida2) : 0;

            const totalMinutes = turno1 + turno2;
            const jornadaMin = getJornadaMinutos(data.dia);
            const extras = calculateExtras(totalMinutes, jornadaMin, data.dia, trabajaSabados);

            const payload = {
                fecha: new Date(data.fecha + 'T12:00:00'),
                dia: data.dia,
                entrada: data.entrada,
                salida: data.salida,
                horasTurno: turno1,
                horasLaborales: jornadaMin,
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
    const previewJornada = getJornadaMinutos(diaValue || '');
    const previewExtras = previewTotal > 0 ? Math.max(0, previewTotal - previewJornada) : 0;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid">
                <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !selectedDate && 'text-muted-foreground'
                                )}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate
                                    ? format(selectedDate, 'PPP', { locale: es })
                                    : 'Seleccionar fecha'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                defaultMonth={selectedDate}
                                locale={es}
                            />
                        </PopoverContent>
                    </Popover>
                    <input type="hidden" {...register('fecha')} />
                    <input type="hidden" {...register('dia')} />
                    {errors.fecha && (
                        <p className="text-destructive text-xs">{errors.fecha.message}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="entrada">Entrada</Label>
                    <TimePicker
                        value={entradaValue}
                        onChange={(v) => setValue('entrada', v)}
                        placeholder="Hora de entrada"
                    />
                    <input type="hidden" {...register('entrada')} />
                    {errors.entrada && (
                        <p className="text-destructive text-xs">{errors.entrada.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="salida">Salida</Label>
                    <TimePicker
                        value={salidaValue}
                        onChange={(v) => setValue('salida', v)}
                        placeholder="Hora de salida"
                    />
                    <input type="hidden" {...register('salida')} />
                    {errors.salida && (
                        <p className="text-destructive text-xs">{errors.salida.message}</p>
                    )}
                </div>
            </div>

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

            {/* Second shift */}
            <div className="border-border space-y-3 rounded-md border p-3">
                <p className="text-muted-foreground text-sm font-medium">
                    Segundo turno (opcional)
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="entrada2">Entrada 2</Label>
                        <TimePicker
                            value={entrada2Value}
                            onChange={(v) => setValue('entrada2', v)}
                            placeholder="Hora de entrada"
                        />
                        <input type="hidden" {...register('entrada2')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="salida2">Salida 2</Label>
                        <TimePicker
                            value={salida2Value}
                            onChange={(v) => setValue('salida2', v)}
                            placeholder="Hora de salida"
                        />
                        <input type="hidden" {...register('salida2')} />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea id="observaciones" {...register('observaciones')} rows={2} />
            </div>

            {/* Preview */}
            {previewTotal > 0 && (
                <div className="bg-muted space-y-1 rounded-md p-3 text-sm">
                    <div>
                        <span className="font-medium">Turno 1: </span>
                        {Math.floor(previewTurno1 / 60)}h {previewTurno1 % 60}m
                        {previewTurno2 > 0 && (
                            <>
                                <span className="mx-2">|</span>
                                <span className="font-medium">Turno 2: </span>
                                {Math.floor(previewTurno2 / 60)}h {previewTurno2 % 60}m
                            </>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <span>
                            <span className="font-medium">Total: </span>
                            {Math.floor(previewTotal / 60)}h {previewTotal % 60}m
                        </span>
                        {previewExtras > 0 && (
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                                +{Math.floor(previewExtras / 60)}h {previewExtras % 60}m extras
                            </span>
                        )}
                    </div>
                    <div className="text-muted-foreground text-xs">
                        Jornada: {Math.floor(previewJornada / 60)}h {previewJornada % 60}m
                        {isWeekend(diaValue || '') && ' (fin de semana)'}
                    </div>
                </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Guardando...' : entry ? 'Actualizar registro' : 'Guardar registro'}
            </Button>
        </form>
    );
}

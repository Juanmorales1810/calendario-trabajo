'use client';

import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settingsSchema, type SettingsFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConfiguracionPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<SettingsFormData>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            salarioMensual: 0,
            horasJornada: 9,
            trabajaSabados: false,
            moneda: 'ARS',
        },
    });

    useEffect(() => {
        if (!isPending && !session) {
            router.push('/login');
        }
    }, [session, isPending, router]);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                reset({
                    salarioMensual: data.salarioMensual || 0,
                    horasJornada: data.horasJornada || 9,
                    trabajaSabados: data.trabajaSabados ?? false,
                    moneda: data.moneda || 'ARS',
                });
            }
        } catch {
            // silenced
        } finally {
            setLoading(false);
        }
    }, [reset]);

    useEffect(() => {
        if (session) fetchSettings();
    }, [session, fetchSettings]);

    const onSubmit = async (data: SettingsFormData) => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toast.success('Configuración guardada correctamente');
            } else {
                toast.error('Error al guardar la configuración');
            }
        } catch {
            toast.error('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    if (isPending || loading) {
        return (
            <div className="container mx-auto max-w-2xl px-4 py-8">
                <div className="mb-8 flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="space-y-6 rounded-lg border p-6">
                        <Skeleton className="h-6 w-36" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-44" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-52" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-20 w-full rounded-md" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8">
            <div className="mb-8 flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Settings className="text-primary h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Configuración</h1>
                    <p className="text-muted-foreground text-sm">
                        Configura tu salario y jornada laboral
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-card space-y-6 rounded-lg border p-6">
                    <h2 className="text-lg font-medium">Datos salariales</h2>

                    <div className="space-y-2">
                        <Label htmlFor="salarioMensual">Salario mensual (30 días)</Label>
                        <Input
                            id="salarioMensual"
                            type="number"
                            step="0.01"
                            placeholder="Ej: 1500"
                            {...register('salarioMensual', { valueAsNumber: true })}
                        />
                        {errors.salarioMensual && (
                            <p className="text-destructive text-xs">
                                {errors.salarioMensual.message}
                            </p>
                        )}
                        <p className="text-muted-foreground text-xs">
                            Este valor se divide en 30 días para calcular tu salario diario
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="horasJornada">Horas de jornada laboral</Label>
                        <Select
                            defaultValue="9"
                            onValueChange={(v) =>
                                setValue('horasJornada', Number(v), { shouldValidate: true })
                            }>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="8">8 horas</SelectItem>
                                <SelectItem value="9">9 horas</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.horasJornada && (
                            <p className="text-destructive text-xs">
                                {errors.horasJornada.message}
                            </p>
                        )}
                        <p className="text-muted-foreground text-xs">
                            Las horas que excedan tu jornada se contarán como extras
                        </p>
                    </div>

                    <div className="flex items-center space-x-3 rounded-md border p-4">
                        <Checkbox
                            id="trabajaSabados"
                            checked={watch('trabajaSabados')}
                            onCheckedChange={(checked) =>
                                setValue('trabajaSabados', checked === true, {
                                    shouldValidate: true,
                                })
                            }
                        />
                        <div className="space-y-1">
                            <Label htmlFor="trabajaSabados" className="cursor-pointer">
                                Trabajo los sábados
                            </Label>
                            <p className="text-muted-foreground text-xs">
                                Si está activo, los sábados cuentan como media jornada (4 hs). Si
                                no, todas las horas del sábado son extras. Los domingos siempre se
                                cuentan como horas extras.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="moneda">Moneda</Label>
                        <Select
                            defaultValue="ARS"
                            onValueChange={(v) => setValue('moneda', v, { shouldValidate: true })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD">USD - Dólar</SelectItem>
                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                                <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                                <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                                <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                                <SelectItem value="BRL">BRL - Real Brasileño</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.moneda && (
                            <p className="text-destructive text-xs">{errors.moneda.message}</p>
                        )}
                    </div>
                </div>

                {/* Preview */}
                <div className="bg-muted/50 rounded-lg border p-6">
                    <h3 className="mb-3 text-sm font-medium">Vista previa de cálculos</h3>
                    <div className="text-muted-foreground space-y-1 text-sm">
                        <p>
                            Si tu salario es de <strong>X</strong> al mes:
                        </p>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>Salario por hora = Salario mensual / 176 horas</li>
                            <li>Salario diario = Salario/hora × Horas de jornada</li>
                            <li>Pago horas extras = Horas extras × Salario/hora</li>
                        </ul>
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar configuración'}
                </Button>
            </form>
        </div>
    );
}

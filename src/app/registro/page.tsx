'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '@/lib/schemas';
import { signUp, useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClockIcon } from 'lucide-react';
import Link from 'next/link';

export default function RegistroPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    useEffect(() => {
        if (!isPending && session) {
            router.push('/');
        }
    }, [session, isPending, router]);

    const onSubmit = async (data: RegisterFormData) => {
        setSubmitting(true);
        setError('');
        try {
            const result = await signUp.email({
                email: data.email,
                password: data.password,
                name: data.name,
            });
            if (result.error) {
                setError(result.error.message || 'Error al registrarse');
            } else {
                router.push('/');
            }
        } catch {
            setError('Error al registrarse');
        } finally {
            setSubmitting(false);
        }
    };

    if (isPending) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">Cargando...</p>
            </div>
        );
    }

    if (session) return null;

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="bg-primary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                        <ClockIcon className="text-primary h-7 w-7" />
                    </div>
                    <h1 className="text-2xl font-bold">Crear Cuenta</h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Regístrate para empezar a controlar tus horas
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" placeholder="Tu nombre" {...register('name')} />
                        {errors.name && (
                            <p className="text-destructive text-xs">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-destructive text-xs">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="text-destructive text-xs">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            {...register('confirmPassword')}
                        />
                        {errors.confirmPassword && (
                            <p className="text-destructive text-xs">
                                {errors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
                    </Button>
                </form>

                <p className="text-muted-foreground text-center text-sm">
                    ¿Ya tienes cuenta?{' '}
                    <Link href="/login" className="text-primary hover:underline">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}

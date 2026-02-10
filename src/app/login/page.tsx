'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/schemas';
import { signIn, useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClockIcon } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    useEffect(() => {
        if (!isPending && session) {
            router.push('/');
        }
    }, [session, isPending, router]);

    const onSubmit = async (data: LoginFormData) => {
        setSubmitting(true);
        setError('');
        try {
            const result = await signIn.email({
                email: data.email,
                password: data.password,
            });
            if (result.error) {
                setError(result.error.message || 'Credenciales inválidas');
            } else {
                router.push('/');
            }
        } catch {
            setError('Error al iniciar sesión');
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
                    <h1 className="text-2xl font-bold">Iniciar Sesión</h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Accede a tu control de horas de trabajo
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                            {error}
                        </div>
                    )}

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

                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? 'Ingresando...' : 'Iniciar Sesión'}
                    </Button>
                </form>

                <p className="text-muted-foreground text-center text-sm">
                    ¿No tienes cuenta?{' '}
                    <Link href="/registro" className="text-primary hover:underline">
                        Regístrate
                    </Link>
                </p>
            </div>
        </div>
    );
}

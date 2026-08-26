'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/schemas';
import { signIn, useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClockIcon } from 'lucide-react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon } from '@hugeicons/core-free-icons';
import PixelBlast from '@/components/PixelBlast';
import { getLiquidGlassFilter, supportsBackdropFilterUrl } from '@/lib/liquid-glass';

const GLASS_RADIUS = 12; // matches Card's rounded-xl

export default function LoginPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const glassRef = useRef<HTMLDivElement>(null);
    const [glassBackdropFilter, setGlassBackdropFilter] = useState<string>();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    useEffect(() => {
        const el = glassRef.current;
        if (!el || !supportsBackdropFilterUrl()) return;

        const redraw = () => {
            const { width, height } = el.getBoundingClientRect();
            if (!width || !height) return;
            const filter = getLiquidGlassFilter({ width, height, radius: GLASS_RADIUS });
            setGlassBackdropFilter(`blur(2px) url('${filter}') saturate(160%) brightness(1.08)`);
        };

        redraw();
        const observer = new ResizeObserver(redraw);
        observer.observe(el);
        return () => observer.disconnect();
    }, [isPending]);

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

    if (session) return null;

    return (
        <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
            <PixelBlast
                variant="square"
                pixelSize={4}
                color="#84CC16"
                patternScale={2}
                patternDensity={1}
                pixelSizeJitter={0}
                enableRipples
                rippleSpeed={0.4}
                rippleThickness={0.12}
                rippleIntensityScale={1.5}
                liquid={false}
                liquidStrength={0.12}
                liquidRadius={1.2}
                liquidWobbleSpeed={5}
                speed={0.5}
                edgeFade={0.25}
                transparent
            />
            <div
                ref={glassRef}
                className="relative z-10 w-full max-w-lg space-y-2.5 overflow-hidden rounded-2xl border-white/25 bg-white/10 p-0 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_0_0_1px_rgba(255,255,255,0.08)] dark:border-white/10 dark:bg-white/5"
                style={{
                    backdropFilter: glassBackdropFilter ?? 'blur(24px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                }}>
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
                        {submitting ? (
                            <>
                                Ingresando...{' '}
                                <HugeiconsIcon icon={Loading02Icon} className="ml-2 animate-spin" />
                            </>
                        ) : (
                            'Iniciar Sesión'
                        )}
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

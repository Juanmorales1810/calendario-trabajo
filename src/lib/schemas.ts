import { z } from 'zod';

export const workEntrySchema = z.object({
    fecha: z.string().min(1, 'La fecha es requerida'),
    dia: z.string().min(1, 'El día es requerido'),
    entrada: z.string().min(1, 'La hora de entrada es requerida'),
    salida: z.string().min(1, 'La hora de salida es requerida'),
    horasLaborales: z.number().min(0).optional(),
    ubicacion: z.string(),
    entrada2: z.string(),
    salida2: z.string(),
    observaciones: z.string(),
});

export type WorkEntryFormData = z.infer<typeof workEntrySchema>;

export const settingsSchema = z.object({
    salarioMensual: z.number().min(0, 'El salario debe ser positivo'),
    horasJornada: z.number().min(1).max(24, 'Máximo 24 horas'),
    trabajaSabados: z.boolean(),
    moneda: z.string().min(1, 'La moneda es requerida'),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
    .object({
        name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        email: z.string().email('Email inválido'),
        password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
    });

export type RegisterFormData = z.infer<typeof registerSchema>;

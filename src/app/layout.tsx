import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/styles/globals.css';
import Navbar from '@/components/interfaces/navbar';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'HorasWork - Control de Horas de Trabajo',
    description: 'Aplicación para controlar horas de trabajo y horas extras',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <Navbar />
                <main className="min-h-[calc(100vh-4rem)]">{children}</main>
                <Toaster />
            </body>
        </html>
    );
}

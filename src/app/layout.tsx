import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { Navbar } from '@/components/interfaces/navbar';
import { Footer } from '@/components/interfaces/footer';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Plantilla Next.JS | Devanthos',
    description: 'Agrega una descripción atractiva para mejorar el SEO de tu página.',
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
                {children}
                <Footer />
            </body>
        </html>
    );
}

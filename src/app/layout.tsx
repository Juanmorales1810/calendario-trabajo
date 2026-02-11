import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import Navbar from '@/components/interfaces/navbar';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import '@/styles/globals.css';

const ibmPlexSans = IBM_Plex_Sans({
    variable: '--font-ibm-plex-sans',
    subsets: ['latin'],
});

export const viewport: Viewport = {
    themeColor: [
        { color: '#1962cf', media: '(prefers-color-scheme: light)' },
        { color: '#1c2433', media: '(prefers-color-scheme: dark)' },
    ],
};
const siteConfig = {
    name: 'HorasWork - Control de Horas de Trabajo',
    description: 'Aplicación para controlar horas de trabajo y horas extras',
};

export const metadata: Metadata = {
    title: {
        default: siteConfig.name,
        template: `%s - ${siteConfig.name}`,
    },
    description: siteConfig.description,
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-icon.png',
        shortcut: '/icon1.png',
    },
    manifest: '/manifest.json',
    creator: 'Juan Morales',
    openGraph: {
        title: siteConfig.name,
        description: siteConfig.description,
        url: 'https://calendario-trabajo.vercel.app',
        siteName: 'HorasWork',
        images: [
            {
                url: 'https://calendario-trabajo.vercel.app/metadata.jpg',
                width: 1200,
                height: 630,
            },
        ],
        locale: 'es_AR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: siteConfig.name,
        description: siteConfig.description,
        siteId: '1467726470533754880',
        creator: '@Juanmora1810',
        creatorId: '1467726470533754880',
        images: ['https://calendario-trabajo.vercel.app/metadata.jpg'],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={`${ibmPlexSans.variable} font-mono antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange>
                    <Navbar />
                    <main className="min-h-[calc(100vh-4rem)]">{children}</main>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}

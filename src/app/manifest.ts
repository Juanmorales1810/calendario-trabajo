import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'HorasWork - Control de Horas de Trabajo',
        short_name: 'HorasWork',
        description: 'Aplicación para controlar horas de trabajo y horas extras',
        start_url: '/',
        display: 'standalone',
        background_color: '#1c2433',
        theme_color: '#1c2433',
        icons: [
            {
                src: '/web-app-manifest-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/web-app-manifest-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/web-app-manifest-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    };
}

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6 text-center">
                <div className="bg-muted mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                    <WifiOff className="text-muted-foreground h-8 w-8" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">Sin conexión</h1>
                    <p className="text-muted-foreground">
                        No se pudo conectar a Internet. Revisa tu conexión e intentá de nuevo.
                    </p>
                </div>
            </div>
        </div>
    );
}

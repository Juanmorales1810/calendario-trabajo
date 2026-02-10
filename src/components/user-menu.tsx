'use client';

import { LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession, signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserMenu() {
    const { data: session } = useSession();
    const router = useRouter();

    if (!session) return null;

    const initials = session.user.name
        ? session.user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : 'U';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="h-auto p-0 hover:bg-transparent" variant="ghost">
                    <Avatar>
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-w-64">
                <DropdownMenuLabel className="flex min-w-0 flex-col">
                    <span className="text-foreground truncate text-sm font-medium">
                        {session.user.name}
                    </span>
                    <span className="text-muted-foreground truncate text-xs font-normal">
                        {session.user.email}
                    </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/configuracion">
                        <SettingsIcon aria-hidden="true" className="opacity-60" size={16} />
                        <span>Configuración</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={async () => {
                        await signOut();
                        router.push('/login');
                    }}>
                    <LogOutIcon aria-hidden="true" className="opacity-60" size={16} />
                    <span>Cerrar sesión</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

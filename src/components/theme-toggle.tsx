'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Toggle } from '@/components/ui/toggle';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Before mount, use neutral defaults that match the server render (rendering-hydration-no-flicker)
    const isDark = mounted && theme === 'dark';

    return (
        <div>
            <Toggle
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                className="group text-muted-foreground data-[state=on]:text-muted-foreground data-[state=on]:hover:bg-muted data-[state=on]:hover:text-foreground size-8 rounded-full border-none shadow-none data-[state=on]:bg-transparent"
                onPressedChange={() => setTheme(isDark ? 'light' : 'dark')}
                pressed={isDark}
                variant="outline">
                {/* Note: After dark mode implementation, rely on dark: prefix rather than group-data-[state=on]: */}
                <MoonIcon
                    aria-hidden="true"
                    className="shrink-0 scale-0 opacity-0 transition-all group-data-[state=on]:scale-100 group-data-[state=on]:opacity-100"
                    size={16}
                />
                <SunIcon
                    aria-hidden="true"
                    className="absolute shrink-0 scale-100 opacity-100 transition-all group-data-[state=on]:scale-0 group-data-[state=on]:opacity-0"
                    size={16}
                />
            </Toggle>
        </div>
    );
}

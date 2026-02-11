'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const CENTER_OFFSET = Math.floor(VISIBLE_ITEMS / 2);

interface ScrollColumnProps {
    count: number;
    selectedIndex: number;
    onSelect: (index: number) => void;
}

function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
}

function ScrollColumn({ count, selectedIndex, onSelect }: ScrollColumnProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const offsetRef = React.useRef(0); // fractional pixel offset for smooth animation
    const currentIndexRef = React.useRef(selectedIndex); // the "center" logical index
    const animFrameRef = React.useRef<number>(0);
    const velocityRef = React.useRef(0);
    const lastTouchY = React.useRef(0);
    const isTouching = React.useRef(false);
    const [, forceRender] = React.useState(0);

    // Sync when selectedIndex prop changes externally
    React.useEffect(() => {
        currentIndexRef.current = selectedIndex;
        offsetRef.current = 0;
        forceRender((n) => n + 1);
    }, [selectedIndex]);

    const snapToNearest = React.useCallback(() => {
        // Animate offset toward 0 (snap to nearest item)
        const animate = () => {
            const offset = offsetRef.current;
            if (Math.abs(offset) < 0.5) {
                offsetRef.current = 0;
                forceRender((n) => n + 1);
                onSelect(mod(currentIndexRef.current, count));
                return;
            }
            offsetRef.current = offset * 0.75;
            forceRender((n) => n + 1);
            animFrameRef.current = requestAnimationFrame(animate);
        };
        animFrameRef.current = requestAnimationFrame(animate);
    }, [count, onSelect]);

    const applyDelta = React.useCallback(
        (deltaY: number) => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
                animFrameRef.current = 0;
            }

            offsetRef.current += deltaY;

            // When offset exceeds item height, shift the index
            while (offsetRef.current >= ITEM_HEIGHT) {
                offsetRef.current -= ITEM_HEIGHT;
                currentIndexRef.current = mod(currentIndexRef.current + 1, count);
            }
            while (offsetRef.current <= -ITEM_HEIGHT) {
                offsetRef.current += ITEM_HEIGHT;
                currentIndexRef.current = mod(currentIndexRef.current - 1, count);
            }

            forceRender((n) => n + 1);
        },
        [count]
    );

    // Momentum animation
    const startMomentum = React.useCallback(() => {
        const animate = () => {
            const vel = velocityRef.current;
            if (Math.abs(vel) < 0.5) {
                velocityRef.current = 0;
                snapToNearest();
                return;
            }
            applyDelta(vel);
            velocityRef.current = vel * 0.92;
            animFrameRef.current = requestAnimationFrame(animate);
        };
        animFrameRef.current = requestAnimationFrame(animate);
    }, [applyDelta, snapToNearest]);

    // Mouse wheel
    const handleWheel = React.useCallback(
        (e: React.WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            applyDelta(e.deltaY * 0.5);

            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
            }
            // Debounced snap
            velocityRef.current = 0;
            animFrameRef.current = requestAnimationFrame(() => {
                snapToNearest();
            });
        },
        [applyDelta, snapToNearest]
    );

    // Touch handlers
    const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
        isTouching.current = true;
        velocityRef.current = 0;
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = 0;
        }
        lastTouchY.current = e.touches[0].clientY;
    }, []);

    const handleTouchMove = React.useCallback(
        (e: React.TouchEvent) => {
            if (!isTouching.current) return;
            e.preventDefault();
            const currentY = e.touches[0].clientY;
            const delta = lastTouchY.current - currentY;
            velocityRef.current = delta;
            lastTouchY.current = currentY;
            applyDelta(delta);
        },
        [applyDelta]
    );

    const handleTouchEnd = React.useCallback(() => {
        isTouching.current = false;
        startMomentum();
    }, [startMomentum]);

    // Click on an item to select it
    const handleItemClick = React.useCallback(
        (offsetFromCenter: number) => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
                animFrameRef.current = 0;
            }
            const newIndex = mod(currentIndexRef.current + offsetFromCenter, count);
            currentIndexRef.current = newIndex;
            offsetRef.current = 0;
            onSelect(newIndex);
            forceRender((n) => n + 1);
        },
        [count, onSelect]
    );

    // Cleanup
    React.useEffect(() => {
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, []);

    // Render items around the current center
    const renderItems = () => {
        const items: React.ReactNode[] = [];
        const offset = offsetRef.current;
        const centerIndex = currentIndexRef.current;

        for (let i = -CENTER_OFFSET; i <= CENTER_OFFSET; i++) {
            const itemIndex = mod(centerIndex + i, count);
            const y = (i + CENTER_OFFSET) * ITEM_HEIGHT - offset;
            const distFromCenter = Math.abs(y - CENTER_OFFSET * ITEM_HEIGHT);
            const opacity = Math.max(0.2, 1 - distFromCenter / (CONTAINER_HEIGHT * 0.5));
            const scale = Math.max(0.85, 1 - distFromCenter / (CONTAINER_HEIGHT * 1.2));
            const isCenter = i === 0 && Math.abs(offset) < ITEM_HEIGHT * 0.3;

            items.push(
                <div
                    key={`item-${i}`}
                    className="absolute right-0 left-0 flex cursor-pointer items-center justify-center select-none"
                    style={{
                        height: ITEM_HEIGHT,
                        top: y,
                        opacity,
                        transform: `scale(${scale})`,
                        transition: 'none',
                    }}
                    onClick={() => handleItemClick(i)}>
                    <span
                        className={cn(
                            'text-sm tabular-nums',
                            isCenter
                                ? 'text-foreground font-semibold'
                                : 'text-muted-foreground font-normal'
                        )}>
                        {itemIndex.toString().padStart(2, '0')}
                    </span>
                </div>
            );
        }
        return items;
    };

    return (
        <div
            className="relative touch-none overflow-hidden"
            style={{ height: CONTAINER_HEIGHT }}
            ref={containerRef}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}>
            {/* Selection highlight */}
            <div
                className="bg-accent pointer-events-none absolute right-1 left-1 z-0 rounded-md"
                style={{
                    top: CENTER_OFFSET * ITEM_HEIGHT,
                    height: ITEM_HEIGHT,
                }}
            />
            {/* Fade edges */}
            <div className="from-popover pointer-events-none absolute top-0 right-0 left-0 z-30 h-8 bg-gradient-to-b to-transparent" />
            <div className="from-popover pointer-events-none absolute right-0 bottom-0 left-0 z-30 h-8 bg-gradient-to-t to-transparent" />
            {/* Items */}
            <div className="relative z-10 h-full">{renderItems()}</div>
        </div>
    );
}

interface TimePickerProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function TimePicker({
    value,
    onChange,
    placeholder = 'Seleccionar hora',
    className,
    disabled,
}: TimePickerProps) {
    const [open, setOpen] = React.useState(false);

    const parsed = React.useMemo(() => {
        if (!value) return { hour: 8, minute: 0 };
        const [h, m] = value.split(':');
        return { hour: parseInt(h, 10) || 0, minute: parseInt(m, 10) || 0 };
    }, [value]);

    const [hour, setHour] = React.useState(parsed.hour);
    const [minute, setMinute] = React.useState(parsed.minute);

    // Sync internal state when value prop changes
    React.useEffect(() => {
        setHour(parsed.hour);
        setMinute(parsed.minute);
    }, [parsed.hour, parsed.minute]);

    const handleHourChange = React.useCallback((index: number) => {
        setHour(index);
    }, []);

    const handleMinuteChange = React.useCallback((index: number) => {
        setMinute(index);
    }, []);

    const handleConfirm = React.useCallback(() => {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        onChange?.(`${h}:${m}`);
        setOpen(false);
    }, [hour, minute, onChange]);

    const displayValue = value || placeholder;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'border-input bg-background hover:bg-background focus-visible:ring-ring/50 w-full justify-start px-3 font-normal outline-offset-0 outline-none focus-visible:ring-[3px]',
                        !value && 'text-muted-foreground',
                        className
                    )}>
                    <Clock
                        className="text-muted-foreground/80 mr-2 h-4 w-4 shrink-0"
                        aria-hidden="true"
                    />
                    <span className={cn('truncate', !value && 'text-muted-foreground')}>
                        {displayValue}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0" align="start">
                <div className="flex flex-col">
                    {/* Header */}
                    <div className="border-border border-b px-3 py-2">
                        <p className="text-muted-foreground text-center text-xs font-medium">
                            {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
                        </p>
                    </div>

                    {/* Scroll columns */}
                    <div className="flex items-center px-2 py-2">
                        <div className="flex-1">
                            <ScrollColumn
                                count={24}
                                selectedIndex={hour}
                                onSelect={handleHourChange}
                            />
                        </div>
                        <div className="text-muted-foreground mx-1 text-lg font-semibold">:</div>
                        <div className="flex-1">
                            <ScrollColumn
                                count={60}
                                selectedIndex={minute}
                                onSelect={handleMinuteChange}
                            />
                        </div>
                    </div>

                    {/* Confirm button */}
                    <div className="border-border border-t p-2">
                        <Button size="sm" className="w-full" onClick={handleConfirm}>
                            Aceptar
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

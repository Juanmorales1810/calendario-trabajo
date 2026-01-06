import React from 'react';
import { Button } from '../ui/button';
import { ArrowRight, Code2, Rocket } from 'lucide-react';

export default function Hero() {
    return (
        <section className="overflow-hidden py-32">
            <div className="relative container mx-auto px-4">
                <div className="mb-6 text-center">
                    <span className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
                        <Code2 className="h-4 w-4" />
                        Plantilla Next.JS - Devanthos
                    </span>
                </div>
                <h1 className="from-primary/60 via-primary to-primary/60 mx-auto max-w-4xl bg-gradient-to-r bg-clip-text text-center text-4xl font-semibold text-transparent lg:text-6xl">
                    Plantilla Next.JS <br /> Lista para usar
                </h1>
                <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center text-lg lg:mt-10">
                    Plantilla moderna de Next.JS con Tailwind CSS y componentes UI. Integra nuevas
                    secciones directamente en el archivo{' '}
                    <code className="bg-muted rounded px-2 py-1 text-sm">src/app/page.tsx</code>
                </p>
                <div className="relative z-10 mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:mt-16">
                    <Button size="lg" className="min-w-[200px]">
                        <Rocket className="mr-2 h-4 w-4" />
                        Comenzar
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="lg" className="min-w-[200px]">
                        Ver Documentación
                    </Button>
                </div>
                <div className="inset-0 -z-10 flex justify-center lg:absolute">
                    <div className="relative -top-8 flex justify-between sm:-top-20 lg:-top-0 lg:w-full">
                        <div className="relative -left-20 min-h-44 min-w-[460px] translate-x-28 scale-80 sm:translate-x-0 lg:min-h-[292px] lg:scale-90 xl:scale-100">
                            <span className="border-border absolute right-0 -bottom-5 flex size-20 scale-60 items-center justify-center rounded-full border p-4">
                                <img
                                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-3.svg"
                                    alt="logo"
                                    className="brightness-0 invert-0 dark:invert"
                                />
                            </span>
                            <span className="border-border absolute right-24 bottom-1 flex size-20 items-center justify-center rounded-full border p-4">
                                <img
                                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-20.svg"
                                    alt="logo"
                                    className="brightness-0 invert-0 dark:invert"
                                />
                            </span>
                            <span className="border-border absolute right-44 bottom-7 flex size-20 scale-60 items-center justify-center rounded-full border p-4">
                                <img
                                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-6.svg"
                                    alt="logo"
                                    className="brightness-0 invert-0 dark:invert"
                                />
                            </span>
                            <span className="border-border absolute right-44 bottom-28 flex size-20 items-center justify-center rounded-full border p-4">
                                <img
                                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-8.svg"
                                    alt="logo"
                                    className="brightness-0 invert-0 dark:invert"
                                />
                            </span>
                            <span className="border-border absolute bottom-4 left-24 flex size-20 items-center justify-center rounded-full border p-4">
                                <img
                                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-9.svg"
                                    alt="logo"
                                    className="brightness-0 invert-0 dark:invert"
                                />
                            </span>
                            <span className="border-border absolute bottom-24 left-20 flex size-20 scale-60 items-center justify-center rounded-full border p-4">
                                <img
                                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-21.svg"
                                    alt="logo"
                                    className="brightness-0 invert-0 dark:invert"
                                />
                            </span>
                        </div>
                        <div className="relative -right-20 min-h-44 min-w-[460px] -translate-x-28 scale-80 sm:translate-x-0 lg:min-h-[292px] lg:scale-90 xl:scale-100">
                            <span className="border-border absolute -bottom-5 left-0 flex size-20 scale-60 items-center justify-center rounded-full border p-4">
                                <img
                                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-12.svg"
                                    alt="logo"
                                    className="brightness-0 invert-0 dark:invert"
                                />
                            </span>
                            <span className="border-border absolute bottom-1 left-24 flex size-20 items-center justify-center rounded-full border p-4">
                                <img
                                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-13.svg"
                                    alt="logo"
                                    className="brightness-0 invert-0 dark:invert"
                                />
                            </span>
                            <span className="border-border absolute bottom-7 left-44 flex size-20 scale-60 items-center justify-center rounded-full border p-4">
                                <img
                                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-14.svg"
                                    alt="logo"
                                    className="brightness-0 invert-0 dark:invert"
                                />
                            </span>
                            <span className="border-border absolute bottom-28 left-44 flex size-20 items-center justify-center rounded-full border p-4">
                                <img
                                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-15.svg"
                                    alt="logo"
                                    className="brightness-0 invert-0 dark:invert"
                                />
                            </span>
                            <span className="border-border absolute right-24 bottom-4 flex size-20 items-center justify-center rounded-full border p-4">
                                <img
                                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-17.svg"
                                    alt="logo"
                                    className="brightness-0 invert-0 dark:invert"
                                />
                            </span>
                            <span className="border-border absolute right-20 bottom-24 flex size-20 scale-60 items-center justify-center rounded-full border p-4">
                                <img
                                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-19.svg"
                                    alt="logo"
                                    className="brightness-0 invert-0 dark:invert"
                                />
                            </span>
                        </div>
                        <div className="from-background/80 to-background/80 absolute inset-0 bg-gradient-to-r via-transparent"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}

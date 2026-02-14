/**
 * Parses a time string "HH:MM" into total minutes.
 */
export function timeToMinutes(time: string): number {
    if (!time || time === '0:00' || time === '0') return 0;
    const parts = time.split(':');
    if (parts.length < 2) return 0;
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
}

/**
 * Converts minutes to "HH:MM" display string.
 */
export function minutesToDisplay(totalMinutes: number): string {
    if (totalMinutes <= 0) return '0:00';
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calculates the difference in minutes between two time strings.
 */
export function calculateTimeDiff(entrada: string, salida: string): number {
    const entradaMin = timeToMinutes(entrada);
    const salidaMin = timeToMinutes(salida);
    if (salidaMin <= entradaMin) return 0;
    return salidaMin - entradaMin;
}

/**
 * Calculates overtime given total worked minutes, standard jornada minutes,
 * and the day of the week.
 * - domingo: ALL hours are overtime
 * - sábado + trabajaSabados=true: jornada is 4h, extras beyond that
 * - sábado + trabajaSabados=false: ALL hours are overtime
 * - lunes-viernes: normal calculation
 */
export function calculateExtras(
    totalMinutes: number,
    jornadaMinutes: number,
    diaSemana?: string,
    trabajaSabados?: boolean
): number {
    const dia = (diaSemana || '').toLowerCase();

    // Domingo: todo es extra
    if (dia === 'domingo') {
        return totalMinutes;
    }

    // Sábado
    if (dia === 'sábado' || dia === 'sabado') {
        if (!trabajaSabados) {
            // No trabaja sábados: todo es extra
            return totalMinutes;
        }
        // Trabaja sábados: jornada de 4 horas (240 min)
        return Math.max(0, totalMinutes - 4 * 60);
    }

    // Lunes a viernes: cálculo normal
    return Math.max(0, totalMinutes - jornadaMinutes);
}

/**
 * Calculates salary estimates.
 * Precio hora = salarioMensual / 176 (horas laborales en 30 días)
 * Horas extras se pagan al mismo valor que la hora normal (sin multiplicador)
 */
export function calculateSalaryEstimate(
    salarioMensual: number,
    horasJornada: number,
    totalHorasTrabajadasMes: number, // in minutes
    totalExtrasMinutes: number // in minutes
) {
    const HORAS_LABORALES_MES = 176;
    const salarioHora = salarioMensual / HORAS_LABORALES_MES;
    const salarioDiario = salarioHora * horasJornada;

    const totalHorasTrabajadas = totalHorasTrabajadasMes / 60;
    const totalExtrasHoras = totalExtrasMinutes / 60;
    const horasNormales = totalHorasTrabajadas - totalExtrasHoras;

    const salarioBase = horasNormales * salarioHora;
    const pagoExtras = totalExtrasHoras * salarioHora;

    return {
        salarioDiario: Math.round(salarioDiario * 100) / 100,
        salarioHora: Math.round(salarioHora * 100) / 100,
        salarioBase: Math.round(salarioBase * 100) / 100,
        pagoExtras: Math.round(pagoExtras * 100) / 100,
        totalEstimado: Math.round((salarioBase + pagoExtras) * 100) / 100,
    };
}

/**
 * Gets the day name in Spanish for a given date.
 */
export function getDayName(date: Date): string {
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
}

/**
 * Formats a date to YYYY-MM-DD string.
 */
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

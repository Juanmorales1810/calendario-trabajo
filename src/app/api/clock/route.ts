import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { WorkEntry } from '@/models/work-entry';
import { UserSettings } from '@/models/user-settings';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

async function getUser() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    return session?.user;
}

function getNow() {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    return { time: `${hh}:${mm}`, date: now };
}

function getDayName(date: Date): string {
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
}

function timeToMinutes(time: string): number {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

function calculateDayExtras(
    totalMinutes: number,
    jornadaMinutes: number,
    dia: string,
    trabajaSabados: boolean
): number {
    const d = (dia || '').toLowerCase();
    if (d === 'domingo') return totalMinutes;
    if (d === 'sábado' || d === 'sabado') {
        return trabajaSabados ? Math.max(0, totalMinutes - 4 * 60) : totalMinutes;
    }
    return Math.max(0, totalMinutes - jornadaMinutes);
}

// GET: returns today's open entry (if any) so the UI knows the current state
export async function GET() {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entry = await WorkEntry.findOne({
        userId: user.id,
        fecha: { $gte: today, $lt: tomorrow },
    })
        .sort({ createdAt: -1 })
        .lean();

    // Determine clock state
    if (!entry) {
        return NextResponse.json({ status: 'idle' });
    }

    if (!entry.salida && entry.entrada) {
        return NextResponse.json({
            status: 'clocked-in',
            entrada: entry.entrada,
            entryId: entry._id,
        });
    }

    // Has salida on turno 1 but no entrada2 — could clock in for turno 2
    if (entry.salida && !entry.entrada2) {
        return NextResponse.json({
            status: 'between-shifts',
            entrada: entry.entrada,
            salida: entry.salida,
            entryId: entry._id,
        });
    }

    // Clocked in for turno 2
    if (entry.entrada2 && !entry.salida2) {
        return NextResponse.json({
            status: 'clocked-in-2',
            entrada: entry.entrada,
            salida: entry.salida,
            entrada2: entry.entrada2,
            entryId: entry._id,
        });
    }

    // Everything is filled
    return NextResponse.json({
        status: 'done',
        entrada: entry.entrada,
        salida: entry.salida,
        entrada2: entry.entrada2,
        salida2: entry.salida2,
        entryId: entry._id,
    });
}

// POST: toggle clock in/out
export async function POST(req: NextRequest) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    await connectDB();

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;
    const clientTime = body.clientTime as string | undefined;

    const { time, date } = getNow();
    // Use client-provided time if available (avoids server UTC mismatch)
    const resolvedTime = clientTime || time;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get settings for horasLaborales
    const settings = await UserSettings.findOne({ userId: user.id }).lean();
    const horasJornada = settings?.horasJornada ?? 9;
    const horasLaboralesMin = horasJornada * 60;
    const trabajaSabados = settings?.trabajaSabados ?? false;
    const diaSemana = getDayName(date);

    // Find today's latest entry
    let entry = await WorkEntry.findOne({
        userId: user.id,
        fecha: { $gte: today, $lt: tomorrow },
    }).sort({ createdAt: -1 });

    if (action === 'clock-in') {
        if (entry && entry.entrada && !entry.salida) {
            return NextResponse.json({ error: 'Ya fichaste entrada hoy' }, { status: 400 });
        }
        // Create new entry with just entrada
        entry = await WorkEntry.create({
            userId: user.id,
            fecha: date,
            dia: diaSemana,
            entrada: resolvedTime,
            salida: '',
            horasTurno: 0,
            horasLaborales: horasLaboralesMin,
            horasExtras: 0,
            ubicacion: body.ubicacion || 'Oficina',
        });
        return NextResponse.json({
            status: 'clocked-in',
            entrada: resolvedTime,
            entryId: entry._id,
        });
    }

    if (action === 'clock-out') {
        if (!entry || !entry.entrada || entry.salida) {
            return NextResponse.json(
                { error: 'No hay fichaje de entrada para cerrar' },
                { status: 400 }
            );
        }
        const turno1 = Math.max(0, timeToMinutes(resolvedTime) - timeToMinutes(entry.entrada));
        const extras = calculateDayExtras(turno1, horasLaboralesMin, entry.dia, trabajaSabados);
        entry.salida = resolvedTime;
        entry.horasTurno = turno1;
        entry.horasExtras = extras;
        await entry.save();
        return NextResponse.json({
            status: 'between-shifts',
            entrada: entry.entrada,
            salida: resolvedTime,
            entryId: entry._id,
        });
    }

    if (action === 'clock-in-2') {
        if (!entry || !entry.salida) {
            return NextResponse.json(
                { error: 'Primero debes completar el turno 1' },
                { status: 400 }
            );
        }
        entry.entrada2 = resolvedTime;
        await entry.save();
        return NextResponse.json({
            status: 'clocked-in-2',
            entrada: entry.entrada,
            salida: entry.salida,
            entrada2: resolvedTime,
            entryId: entry._id,
        });
    }

    if (action === 'clock-out-2') {
        if (!entry || !entry.entrada2 || entry.salida2) {
            return NextResponse.json(
                { error: 'No hay fichaje de entrada 2 para cerrar' },
                { status: 400 }
            );
        }
        const turno2 = Math.max(0, timeToMinutes(resolvedTime) - timeToMinutes(entry.entrada2));
        const totalMinutes = (entry.horasTurno || 0) + turno2;
        const extras = calculateDayExtras(
            totalMinutes,
            entry.horasLaborales,
            entry.dia,
            trabajaSabados
        );
        entry.salida2 = resolvedTime;
        entry.horasTurno2 = turno2;
        entry.horasExtras = extras;
        await entry.save();
        return NextResponse.json({
            status: 'done',
            entrada: entry.entrada,
            salida: entry.salida,
            entrada2: entry.entrada2,
            salida2: resolvedTime,
            entryId: entry._id,
        });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
}

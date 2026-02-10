import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { WorkEntry } from '@/models/work-entry';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

async function getUser() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    return session?.user;
}

export async function GET(req: NextRequest) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const mes = searchParams.get('mes');
    const anio = searchParams.get('anio');

    const query: Record<string, unknown> = { userId: user.id };

    if (mes && anio) {
        const startDate = new Date(Number(anio), Number(mes) - 1, 1);
        const endDate = new Date(Number(anio), Number(mes), 0, 23, 59, 59);
        query.fecha = { $gte: startDate, $lte: endDate };
    }

    const entries = await WorkEntry.find(query).sort({ fecha: -1 }).lean();
    return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    await connectDB();

    const body = await req.json();
    const entry = await WorkEntry.create({ ...body, userId: user.id });
    return NextResponse.json(entry, { status: 201 });
}

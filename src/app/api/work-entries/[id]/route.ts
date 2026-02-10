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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const entry = await WorkEntry.findOneAndUpdate({ _id: id, userId: user.id }, body, {
        new: true,
    }).lean();

    if (!entry) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(entry);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const result = await WorkEntry.findOneAndDelete({ _id: id, userId: user.id });
    if (!result) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true });
}

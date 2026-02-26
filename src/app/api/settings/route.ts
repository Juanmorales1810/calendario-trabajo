import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { UserSettings } from '@/models/user-settings';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

async function getUser() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    return session?.user;
}

export async function GET() {
    const [user] = await Promise.all([getUser(), connectDB()]);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    let settings = await UserSettings.findOne({ userId: user.id }).lean();
    if (!settings) {
        settings = await UserSettings.create({ userId: user.id, horasJornada: 9 });
        settings = settings.toObject();
    }
    return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
    const [user, , body] = await Promise.all([getUser(), connectDB(), req.json()]);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const settings = await UserSettings.findOneAndUpdate(
        { userId: user.id },
        { ...body, userId: user.id },
        { returnDocument: 'after', upsert: true }
    ).lean();

    return NextResponse.json(settings);
}

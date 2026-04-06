import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { PushSubscriptionModel } from '@/models/push-subscription';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

async function getUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user;
}

// POST /api/push/subscribe — save a new push subscription
export async function POST(req: NextRequest) {
    const [user, , body] = await Promise.all([getUser(), connectDB(), req.json()]);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { endpoint, keys } = body as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
    }

    await PushSubscriptionModel.findOneAndUpdate(
        { userId: user.id, endpoint },
        { userId: user.id, endpoint, keys },
        { upsert: true }
    );

    return NextResponse.json({ ok: true });
}

// DELETE /api/push/subscribe — remove an existing push subscription
export async function DELETE(req: NextRequest) {
    const [user, , body] = await Promise.all([getUser(), connectDB(), req.json()]);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { endpoint } = body as { endpoint: string };
    if (!endpoint) return NextResponse.json({ error: 'Endpoint requerido' }, { status: 400 });

    await PushSubscriptionModel.deleteOne({ userId: user.id, endpoint });
    return NextResponse.json({ ok: true });
}

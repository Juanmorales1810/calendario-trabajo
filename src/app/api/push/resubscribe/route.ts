import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { PushSubscriptionModel } from '@/models/push-subscription';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

async function getUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user;
}

/**
 * POST /api/push/resubscribe
 * Called by the SW's `pushsubscriptionchange` event to replace an expired subscription.
 */
export async function POST(req: NextRequest) {
    const [user, , body] = await Promise.all([getUser(), connectDB(), req.json()]);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { old: oldSub, new: newSub } = body as {
        old: { endpoint: string } | null;
        new: { endpoint: string; keys: { p256dh: string; auth: string } };
    };

    if (oldSub?.endpoint) {
        await PushSubscriptionModel.deleteOne({ userId: user.id, endpoint: oldSub.endpoint });
    }

    await PushSubscriptionModel.findOneAndUpdate(
        { userId: user.id, endpoint: newSub.endpoint },
        { userId: user.id, endpoint: newSub.endpoint, keys: newSub.keys },
        { upsert: true }
    );

    return NextResponse.json({ ok: true });
}

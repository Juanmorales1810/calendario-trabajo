import webpush from 'web-push';
import { PushSubscriptionModel } from '@/models/push-subscription';

webpush.setVapidDetails(
    `mailto:${process.env.VAPID_MAILTO ?? 'admin@horaswork.app'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
}

/**
 * Sends a push notification to all subscriptions belonging to a user.
 * Silently removes any expired/invalid subscriptions (410 Gone).
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

    const subscriptions = await PushSubscriptionModel.find({ userId }).lean();
    if (!subscriptions.length) return;

    const notification = JSON.stringify({
        icon: '/web-app-manifest-192x192.png',
        badge: '/web-app-manifest-192x192.png',
        url: '/',
        ...payload,
    });

    await Promise.allSettled(
        subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
                    },
                    notification
                );
            } catch (err: unknown) {
                // 410 Gone = subscription expired; clean it up
                const statusCode = (err as { statusCode?: number }).statusCode;
                if (statusCode === 410) {
                    await PushSubscriptionModel.deleteOne({ _id: sub._id });
                }
            }
        })
    );
}

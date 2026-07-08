// src/services/notifications.ts
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false, shouldSetBadge: false,
    shouldShowBanner: true, shouldShowList: true,
  }),
});

let asked = false;

/** Ask for notification permission lazily — the first time a ping needs it. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (asked) return false;
  asked = true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Local notification that deep-links into the compass for `friendId`. */
export async function notifyPing(title: string, body: string, friendId: number): Promise<void> {
  const ok = await ensureNotificationPermission();
  if (!ok) return; // in-app banner still covers it
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { url: `/compass/${friendId}` } },
    trigger: null,
  });
}

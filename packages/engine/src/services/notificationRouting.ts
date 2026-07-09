// src/services/notificationRouting.ts
//
// Pure routing decision for a tapped notification, shared by BOTH the warm-tap
// listener (addNotificationResponseReceivedListener) and the cold-start handler
// (useLastNotificationResponse). Kept expo-free so it's unit-testable and so both
// handlers route identically and DEDUPE against each other: on a warm tap the
// live listener and the last-response hook both observe the same tap, and without
// deduping by notification identifier they'd double-navigate.

/** Minimal shape of an expo-notifications NotificationResponse we depend on. */
export interface TapResponseLike {
  notification: {
    request: {
      identifier: string;
      content: { data?: Record<string, unknown> | null };
    };
  };
}

/**
 * Resolve the deep-link URL a tapped notification should navigate to, or null.
 * Returns null (and does nothing) when: there's no response, it carries no string
 * `url`, or this notification identifier was already handled — `seen` is the set
 * of already-routed identifiers and is mutated on a first, real navigation, so a
 * second handler observing the same tap is a no-op.
 */
export function resolveNotificationNav(
  resp: TapResponseLike | null | undefined,
  seen: Set<string>,
): string | null {
  if (!resp) return null;
  const id = resp.notification.request.identifier;
  if (seen.has(id)) return null; // already routed this tap — dedupe cold-start vs live
  const url = resp.notification.request.content.data?.url;
  if (typeof url !== 'string' || url.length === 0) return null;
  seen.add(id);
  return url;
}

import { resolveNotificationNav, type TapResponseLike } from '../notificationRouting';

const resp = (identifier: string, url?: unknown): TapResponseLike => ({
  notification: { request: { identifier, content: { data: url === undefined ? {} : { url } } } },
});

// Fix 7: cold-start taps route via the last-response hook, warm taps via the live
// listener — both share this resolver + a seen-set so the same tap never
// double-navigates.
describe('resolveNotificationNav', () => {
  it('routes a tapped notification to its deep-link url', () => {
    expect(resolveNotificationNav(resp('a', '/compass/101'), new Set())).toBe('/compass/101');
  });

  it('dedupes the same notification id (cold-start hook vs live listener)', () => {
    const seen = new Set<string>();
    const r = resp('a', '/compass/101');
    expect(resolveNotificationNav(r, seen)).toBe('/compass/101'); // first handler navigates
    expect(resolveNotificationNav(r, seen)).toBeNull();           // second handler → no double-nav
  });

  it('routes distinct taps independently', () => {
    const seen = new Set<string>();
    expect(resolveNotificationNav(resp('a', '/compass/1'), seen)).toBe('/compass/1');
    expect(resolveNotificationNav(resp('b', '/compass/2'), seen)).toBe('/compass/2');
  });

  it('ignores a response with no / non-string url', () => {
    expect(resolveNotificationNav(resp('a'), new Set())).toBeNull();
    expect(resolveNotificationNav(resp('a', 42), new Set())).toBeNull();
    expect(resolveNotificationNav(resp('a', ''), new Set())).toBeNull();
  });

  it('ignores null / undefined (no cold-start notification, or not resolved yet)', () => {
    expect(resolveNotificationNav(null, new Set())).toBeNull();
    expect(resolveNotificationNav(undefined, new Set())).toBeNull();
  });
});

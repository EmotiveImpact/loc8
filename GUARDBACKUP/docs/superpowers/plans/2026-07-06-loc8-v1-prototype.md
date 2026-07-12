# Loc8 v1 Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Loc8 v1 clickable prototype — a polished Expo app where you find simulated crew members via a live Radar → Compass → Proximity flow, per spec §12 (`docs/superpowers/specs/2026-07-06-loc8-design.md`).

**Architecture:** All product logic (geo math, packet codec, trust rules, transport) is pure TypeScript behind a `LocationTransport` interface; v1 plugs in a deterministic `SimulatedTransport` (seeded random-walk friends around the user's real GPS position). UI is Expo Router + react-native-svg + Reanimated. Nothing in the UI knows packets are simulated — v2 swaps in real BLE mesh behind the same interface.

**Tech Stack:** Expo SDK (latest), TypeScript, expo-router, react-native-svg, react-native-reanimated, zustand (+ AsyncStorage persist), expo-location, expo-haptics, expo-battery, expo-notifications, expo-clipboard, jest + jest-expo.

**Conventions used throughout:**
- Repo root = `/Users/augustusedem/Loc8` (the Expo app lives at the root).
- Times are **unix seconds** (`nowSec`), never `Date` objects, and every module takes an injectable `nowSec: () => number` so tests control time.
- Distances meters, headings/bearings degrees 0–360 (0 = true north).
- Test files colocated in `src/**/__tests__/`. Run all tests with `npx jest`.
- Commit after every task (messages given per task).

---

### Task 1: Scaffold the Expo app + test tooling

**Files:**
- Create: entire Expo template (via CLI), `package.json` (jest config), `.gitignore`
- Keep: existing `docs/`, `prototype/`

- [ ] **Step 1: Scaffold into a temp dir and move to root** (create-expo-app refuses non-empty dirs)

```bash
cd /Users/augustusedem/Loc8
npx create-expo-app@latest loc8-tmp --template default --yes
# move everything, including dotfiles, up to root
mv loc8-tmp/* loc8-tmp/.[!.]* .
rmdir loc8-tmp
```

- [ ] **Step 2: Reset to a blank app skeleton**

```bash
npm run reset-project   # answer "n" to keeping example files if prompted, or:
rm -rf app-example      # remove the moved example if the script created it
```

Expected: `app/` now contains only `_layout.tsx` and `index.tsx`.

- [ ] **Step 3: Install dependencies**

```bash
npx expo install react-native-svg react-native-reanimated expo-location expo-haptics expo-battery expo-notifications expo-clipboard @react-native-async-storage/async-storage
npm install zustand
npm install --save-dev jest jest-expo @types/jest
```

- [ ] **Step 4: Add jest config to `package.json`** (merge into existing JSON)

```json
{
  "scripts": { "test": "jest" },
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|expo-modules-core|react-navigation|@react-navigation/.*|react-native-svg|react-native-reanimated|zustand)"
    ]
  }
}
```

- [ ] **Step 5: Verify the app boots and jest runs**

```bash
npx jest --passWithNoTests   # Expected: "No tests found, exiting with code 0"
npx expo start --port 8081 & sleep 15 && kill %1   # Expected: QR code / "Metro waiting" output, no red errors
```

- [ ] **Step 6: Init git and commit everything (including the spec)**

```bash
cd /Users/augustusedem/Loc8
git init -b main
git add -A
git commit -m "chore: scaffold Expo app, test tooling, spec + prototype docs"
```

---

### Task 2: Core types + geoMath (distance & bearing)

**Files:**
- Create: `src/core/types.ts`, `src/core/geoMath.ts`
- Test: `src/core/__tests__/geoMath.test.ts`

- [ ] **Step 1: Create the shared types**

```ts
// src/core/types.ts
export interface Coordinate {
  latitude: number;
  longitude: number;
}

export type PacketType = 'position' | 'pingWhere' | 'pingComeFind' | 'rally';

export interface Packet {
  type: PacketType;
  senderId: number;    // uint32
  targetId: number;    // uint32, 0 = broadcast to all
  latitude: number;
  longitude: number;
  headingDeg: number;  // 0–359
  batteryPct: number;  // 0–100
  timestampSec: number; // unix seconds
  accuracyM: number;   // 0–255 (GPS reported accuracy, meters)
}
```

- [ ] **Step 2: Write failing tests for distance + bearing**

```ts
// src/core/__tests__/geoMath.test.ts
import { getHaversineDistance, getAbsoluteBearing } from '../geoMath';

const ORIGIN = { latitude: 0, longitude: 0 };

describe('getHaversineDistance', () => {
  it('is ~111.19km for 1 degree of longitude at the equator', () => {
    const d = getHaversineDistance(ORIGIN, { latitude: 0, longitude: 1 });
    expect(d).toBeGreaterThan(111100);
    expect(d).toBeLessThan(111300);
  });
  it('is 0 for identical points', () => {
    expect(getHaversineDistance(ORIGIN, ORIGIN)).toBe(0);
  });
  it('is symmetric', () => {
    const a = { latitude: 37.77, longitude: -122.42 };
    const b = { latitude: 37.78, longitude: -122.41 };
    expect(getHaversineDistance(a, b)).toBeCloseTo(getHaversineDistance(b, a), 6);
  });
});

describe('getAbsoluteBearing', () => {
  it('is 0° pointing due north', () => {
    expect(getAbsoluteBearing(ORIGIN, { latitude: 1, longitude: 0 })).toBeCloseTo(0, 5);
  });
  it('is 90° pointing due east', () => {
    expect(getAbsoluteBearing(ORIGIN, { latitude: 0, longitude: 1 })).toBeCloseTo(90, 5);
  });
  it('is 270° pointing due west', () => {
    expect(getAbsoluteBearing(ORIGIN, { latitude: 0, longitude: -1 })).toBeCloseTo(270, 5);
  });
});
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `npx jest geoMath -t "Haversine|Bearing"`
Expected: FAIL — `Cannot find module '../geoMath'`

- [ ] **Step 4: Implement distance + bearing**

```ts
// src/core/geoMath.ts
import type { Coordinate } from './types';

const EARTH_RADIUS_METERS = 6371000;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Straight-line meters between two GPS points (Haversine). */
export function getHaversineDistance(p1: Coordinate, p2: Coordinate): number {
  const dLat = rad(p2.latitude - p1.latitude);
  const dLon = rad(p2.longitude - p1.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(rad(p1.latitude)) * Math.cos(rad(p2.latitude));
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Forward azimuth from `from` to `to`. 0° = true north, 90° = east. Range [0, 360). */
export function getAbsoluteBearing(from: Coordinate, to: Coordinate): number {
  const fromLat = rad(from.latitude);
  const toLat = rad(to.latitude);
  const dLon = rad(to.longitude - from.longitude);
  const y = Math.sin(dLon) * Math.cos(toLat);
  const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
```

- [ ] **Step 5: Run tests, verify pass**

Run: `npx jest geoMath`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add src/core && git commit -m "feat: core types + haversine distance and bearing"
```

---

### Task 3: geoMath — movePoint, heading smoothing, piecewise radar scaling, radar plotting

**Files:**
- Modify: `src/core/geoMath.ts`
- Test: `src/core/__tests__/geoMath.test.ts` (append)

- [ ] **Step 1: Append failing tests**

```ts
// append to src/core/__tests__/geoMath.test.ts
import {
  movePoint, smoothHeading, radarRadiusForDistance, calculateRadarPoint,
  LINEAR_MAX_M, OUTER_MAX_M,
} from '../geoMath';

describe('movePoint', () => {
  it('moves ~100m north', () => {
    const moved = movePoint(ORIGIN, 0, 100);
    expect(getHaversineDistance(ORIGIN, moved)).toBeCloseTo(100, 0);
    expect(getAbsoluteBearing(ORIGIN, moved)).toBeCloseTo(0, 1);
  });
  it('moves ~50m east', () => {
    const moved = movePoint(ORIGIN, 90, 50);
    expect(getHaversineDistance(ORIGIN, moved)).toBeCloseTo(50, 0);
    expect(getAbsoluteBearing(ORIGIN, moved)).toBeCloseTo(90, 1);
  });
});

describe('smoothHeading (low-pass with wrap-around)', () => {
  it('interpolates normally', () => {
    expect(smoothHeading(100, 120, 0.5)).toBeCloseTo(110, 5);
  });
  it('handles the 350°→10° wrap without spinning backwards', () => {
    expect(smoothHeading(350, 10, 0.5)).toBeCloseTo(0, 5);
  });
  it('handles the 10°→350° wrap', () => {
    expect(smoothHeading(10, 350, 0.5)).toBeCloseTo(0, 5);
  });
});

describe('radarRadiusForDistance (piecewise linear→log)', () => {
  const R = 150; // px
  it('is 0 at 0m', () => expect(radarRadiusForDistance(0, R)).toBe(0));
  it('is 70% of radius at LINEAR_MAX_M', () =>
    expect(radarRadiusForDistance(LINEAR_MAX_M, R)).toBeCloseTo(0.7 * R, 5));
  it('is full radius at OUTER_MAX_M and beyond (clamped)', () => {
    expect(radarRadiusForDistance(OUTER_MAX_M, R)).toBeCloseTo(R, 5);
    expect(radarRadiusForDistance(OUTER_MAX_M * 3, R)).toBeCloseTo(R, 5);
  });
  it('is strictly monotonic', () => {
    const r = (d: number) => radarRadiusForDistance(d, R);
    expect(r(80)).toBeLessThan(r(150));
    expect(r(150)).toBeLessThan(r(400));
    expect(r(400)).toBeLessThan(r(1500));
  });
});

describe('calculateRadarPoint (north-up)', () => {
  it('plots a friend due north straight up (negative y)', () => {
    const friend = movePoint(ORIGIN, 0, 100);
    const pt = calculateRadarPoint(ORIGIN, friend, 150);
    expect(pt.x).toBeCloseTo(0, 0);
    expect(pt.y).toBeLessThan(0);
    expect(pt.distanceMeters).toBeCloseTo(100, 0);
  });
  it('plots a friend due east to the right (positive x)', () => {
    const friend = movePoint(ORIGIN, 90, 100);
    const pt = calculateRadarPoint(ORIGIN, friend, 150);
    expect(pt.y).toBeCloseTo(0, 0);
    expect(pt.x).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests, verify new ones fail**

Run: `npx jest geoMath`
Expected: FAIL — `movePoint is not a function` (etc.)

- [ ] **Step 3: Implement**

```ts
// append to src/core/geoMath.ts

/** Destination point given start, bearing, meters (equirectangular approx — fine <2km). */
export function movePoint(from: Coordinate, bearingDeg: number, meters: number): Coordinate {
  const dLat = (meters * Math.cos(rad(bearingDeg))) / 111320;
  const dLon = (meters * Math.sin(rad(bearingDeg))) / (111320 * Math.cos(rad(from.latitude)));
  return { latitude: from.latitude + dLat, longitude: from.longitude + dLon };
}

/**
 * Low-pass filter for magnetometer headings (festival EM noise makes raw headings jitter).
 * Handles the 359°→0° wrap so the needle never spins the long way round.
 */
export function smoothHeading(currentDeg: number, nextDeg: number, alpha = 0.2): number {
  let diff = nextDeg - currentDeg;
  if (diff > 180) diff -= 360;
  else if (diff < -180) diff += 360;
  return (currentDeg + alpha * diff + 360) % 360;
}

/** Piecewise distance→pixel scale: linear to 150m (inner 70% of radius), log 150m→1.5km (outer 30%). */
export const LINEAR_MAX_M = 150;
export const OUTER_MAX_M = 1500;
const LINEAR_FRACTION = 0.7;

export function radarRadiusForDistance(distanceM: number, radarRadiusPx: number): number {
  if (distanceM <= 0) return 0;
  if (distanceM <= LINEAR_MAX_M) {
    return (distanceM / LINEAR_MAX_M) * LINEAR_FRACTION * radarRadiusPx;
  }
  const clamped = Math.min(distanceM, OUTER_MAX_M);
  const frac = Math.log(clamped / LINEAR_MAX_M) / Math.log(OUTER_MAX_M / LINEAR_MAX_M);
  return (LINEAR_FRACTION + frac * (1 - LINEAR_FRACTION)) * radarRadiusPx;
}

export interface RadarPoint {
  x: number;              // px right of center
  y: number;              // px below center (screen coords; north = -y)
  distanceMeters: number;
  absoluteBearing: number;
}

/** North-up radar plot (deliberately NO device heading — spec §6). */
export function calculateRadarPoint(
  myLocation: Coordinate,
  friendLocation: Coordinate,
  radarRadiusPx: number,
): RadarPoint {
  const distanceMeters = getHaversineDistance(myLocation, friendLocation);
  const absoluteBearing = getAbsoluteBearing(myLocation, friendLocation);
  const r = radarRadiusForDistance(distanceMeters, radarRadiusPx);
  const theta = rad(absoluteBearing);
  return { x: r * Math.sin(theta), y: -r * Math.cos(theta), distanceMeters, absoluteBearing };
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest geoMath`
Expected: PASS (all)

- [ ] **Step 5: Commit**

```bash
git add src/core && git commit -m "feat: movePoint, heading smoothing, piecewise radar scaling, north-up radar plot"
```

---

### Task 4: Plus Codes (encode-only, offline)

**Files:**
- Create: `src/core/plusCodes.ts`
- Test: `src/core/__tests__/plusCodes.test.ts`

- [ ] **Step 1: Write failing tests** (vectors from Google's official OLC test suite)

```ts
// src/core/__tests__/plusCodes.test.ts
import { encodePlusCode } from '../plusCodes';

describe('encodePlusCode (10-digit Open Location Code)', () => {
  it('matches the official OLC test vector', () => {
    expect(encodePlusCode(20.3700625, 2.7821875)).toBe('7FG49QCJ+2V');
  });
  it('encodes the null island area', () => {
    expect(encodePlusCode(0, 0)).toBe('6FG22222+22');
  });
  it('clips latitude at the poles without crashing', () => {
    expect(encodePlusCode(90, 0)).toMatch(/^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2}$/);
  });
  it('normalizes longitude beyond ±180', () => {
    expect(encodePlusCode(20.3700625, 2.7821875 + 360)).toBe('7FG49QCJ+2V');
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx jest plusCodes`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

```ts
// src/core/plusCodes.ts
/** Encode-only Open Location Code (Plus Code), 10 digits (~14m cell). Zero deps, fully offline. */
const ALPHABET = '23456789CFGHJMPQRVWX';
// Degrees covered by each digit pair, expressed in integer units of 1/8000°.
const PAIR_UNITS = [160000, 8000, 400, 20, 1];

export function encodePlusCode(latitude: number, longitude: number): string {
  const lat = Math.min(Math.max(latitude, -90), 90);
  let lon = longitude;
  while (lon < -180) lon += 360;
  while (lon >= 180) lon -= 360;

  // Integer grid units (1 unit = 1/8000 degree). Epsilon guards float edges like x.5 exactly.
  let latVal = Math.floor((lat + 90) * 8000 + 1e-9);
  let lonVal = Math.floor((lon + 180) * 8000 + 1e-9);
  if (latVal >= 180 * 8000) latVal = 180 * 8000 - 1; // clip north pole into the last cell

  let code = '';
  for (const unit of PAIR_UNITS) {
    code += ALPHABET[Math.floor(latVal / unit) % 20];
    code += ALPHABET[Math.floor(lonVal / unit) % 20];
  }
  return code.slice(0, 8) + '+' + code.slice(8);
}
```

- [ ] **Step 4: Run, verify pass** — `npx jest plusCodes` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/core && git commit -m "feat: offline Plus Code encoder with official test vectors"
```

---

### Task 5: PacketCodec (25-byte binary format)

**Files:**
- Create: `src/core/packetCodec.ts`
- Test: `src/core/__tests__/packetCodec.test.ts`

Binary layout (25 bytes, big-endian):

| offset | bytes | field | encoding |
|---|---|---|---|
| 0 | 1 | type | 0=position 1=pingWhere 2=pingComeFind 3=rally |
| 1 | 4 | senderId | uint32 |
| 5 | 4 | targetId | uint32 (0 = broadcast) |
| 9 | 4 | latitude | int32, degrees × 1e7 |
| 13 | 4 | longitude | int32, degrees × 1e7 |
| 17 | 2 | headingDeg | uint16 |
| 19 | 1 | batteryPct | uint8 |
| 20 | 4 | timestampSec | uint32 |
| 24 | 1 | accuracyM | uint8, capped 255 |

- [ ] **Step 1: Write failing tests**

```ts
// src/core/__tests__/packetCodec.test.ts
import { encodePacket, decodePacket, PACKET_SIZE } from '../packetCodec';
import type { Packet } from '../types';

const sample: Packet = {
  type: 'position', senderId: 42, targetId: 0,
  latitude: 37.7749295, longitude: -122.4194155,
  headingDeg: 275, batteryPct: 81, timestampSec: 1783300000, accuracyM: 12,
};

describe('PacketCodec', () => {
  it('round-trips a packet exactly (to 1e-7 degrees)', () => {
    const decoded = decodePacket(encodePacket(sample));
    expect(decoded.type).toBe('position');
    expect(decoded.senderId).toBe(42);
    expect(decoded.targetId).toBe(0);
    expect(decoded.latitude).toBeCloseTo(sample.latitude, 6);
    expect(decoded.longitude).toBeCloseTo(sample.longitude, 6);
    expect(decoded.headingDeg).toBe(275);
    expect(decoded.batteryPct).toBe(81);
    expect(decoded.timestampSec).toBe(1783300000);
    expect(decoded.accuracyM).toBe(12);
  });
  it('is exactly PACKET_SIZE bytes', () => {
    expect(encodePacket(sample).byteLength).toBe(PACKET_SIZE);
    expect(PACKET_SIZE).toBe(25);
  });
  it('round-trips boundary coordinates', () => {
    const edge = { ...sample, latitude: -90, longitude: 179.9999999 };
    const d = decodePacket(encodePacket(edge));
    expect(d.latitude).toBeCloseTo(-90, 6);
    expect(d.longitude).toBeCloseTo(179.9999999, 6);
  });
  it('caps accuracy at 255', () => {
    expect(decodePacket(encodePacket({ ...sample, accuracyM: 900 })).accuracyM).toBe(255);
  });
  it('rejects wrong-length buffers', () => {
    expect(() => decodePacket(new Uint8Array(10).buffer)).toThrow(/length/i);
  });
  it('rejects unknown packet types', () => {
    const buf = encodePacket(sample);
    new DataView(buf).setUint8(0, 99);
    expect(() => decodePacket(buf)).toThrow(/type/i);
  });
  it('round-trips every packet type', () => {
    (['position', 'pingWhere', 'pingComeFind', 'rally'] as const).forEach((type) => {
      expect(decodePacket(encodePacket({ ...sample, type })).type).toBe(type);
    });
  });
});
```

- [ ] **Step 2: Run, verify fail** — `npx jest packetCodec` → FAIL, module not found

- [ ] **Step 3: Implement**

```ts
// src/core/packetCodec.ts
import type { Packet, PacketType } from './types';

export const PACKET_SIZE = 25;

const TYPE_TO_CODE: Record<PacketType, number> = {
  position: 0, pingWhere: 1, pingComeFind: 2, rally: 3,
};
const CODE_TO_TYPE: PacketType[] = ['position', 'pingWhere', 'pingComeFind', 'rally'];

export function encodePacket(p: Packet): ArrayBuffer {
  const buf = new ArrayBuffer(PACKET_SIZE);
  const v = new DataView(buf);
  v.setUint8(0, TYPE_TO_CODE[p.type]);
  v.setUint32(1, p.senderId);
  v.setUint32(5, p.targetId);
  v.setInt32(9, Math.round(p.latitude * 1e7));
  v.setInt32(13, Math.round(p.longitude * 1e7));
  v.setUint16(17, Math.round(p.headingDeg) % 360);
  v.setUint8(19, Math.min(100, Math.max(0, Math.round(p.batteryPct))));
  v.setUint32(20, p.timestampSec);
  v.setUint8(24, Math.min(255, Math.max(0, Math.round(p.accuracyM))));
  return buf;
}

export function decodePacket(buf: ArrayBuffer): Packet {
  if (buf.byteLength !== PACKET_SIZE) {
    throw new Error(`Invalid packet length: ${buf.byteLength}, expected ${PACKET_SIZE}`);
  }
  const v = new DataView(buf);
  const typeCode = v.getUint8(0);
  const type = CODE_TO_TYPE[typeCode];
  if (!type) throw new Error(`Unknown packet type code: ${typeCode}`);
  return {
    type,
    senderId: v.getUint32(1),
    targetId: v.getUint32(5),
    latitude: v.getInt32(9) / 1e7,
    longitude: v.getInt32(13) / 1e7,
    headingDeg: v.getUint16(17),
    batteryPct: v.getUint8(19),
    timestampSec: v.getUint32(20),
    accuracyM: v.getUint8(24),
  };
}
```

- [ ] **Step 4: Run, verify pass** — `npx jest packetCodec` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/core && git commit -m "feat: 25-byte binary packet codec with validation"
```

---

### Task 6: TrustLayer (replay rejection + last-write-wins)

**Files:**
- Create: `src/core/trustLayer.ts`
- Test: `src/core/__tests__/trustLayer.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/core/__tests__/trustLayer.test.ts
import { TrustLayer } from '../trustLayer';
import type { Packet } from '../types';

const base: Packet = {
  type: 'position', senderId: 1, targetId: 0, latitude: 0, longitude: 0,
  headingDeg: 0, batteryPct: 50, timestampSec: 1000, accuracyM: 10,
};

describe('TrustLayer', () => {
  const now = () => 1060; // 60s after base packet

  it('accepts a fresh packet', () => {
    expect(new TrustLayer(600, now).accept(base)).toBe(true);
  });
  it('rejects packets older than maxAge (replay of stale capture)', () => {
    const t = new TrustLayer(600, now);
    expect(t.accept({ ...base, timestampSec: 1060 - 601 })).toBe(false);
  });
  it('rejects an exact replay (same timestamp)', () => {
    const t = new TrustLayer(600, now);
    expect(t.accept(base)).toBe(true);
    expect(t.accept(base)).toBe(false);
  });
  it('rejects out-of-order older packets (last-write-wins)', () => {
    const t = new TrustLayer(600, now);
    expect(t.accept({ ...base, timestampSec: 1050 })).toBe(true);
    expect(t.accept({ ...base, timestampSec: 1040 })).toBe(false); // late relayed copy
  });
  it('accepts newer packets after older', () => {
    const t = new TrustLayer(600, now);
    expect(t.accept({ ...base, timestampSec: 1040 })).toBe(true);
    expect(t.accept({ ...base, timestampSec: 1050 })).toBe(true);
  });
  it('tracks senders independently', () => {
    const t = new TrustLayer(600, now);
    expect(t.accept({ ...base, senderId: 1, timestampSec: 1050 })).toBe(true);
    expect(t.accept({ ...base, senderId: 2, timestampSec: 1040 })).toBe(true);
  });
  it('tracks packet types independently (a ping never blocks a position)', () => {
    const t = new TrustLayer(600, now);
    expect(t.accept({ ...base, type: 'position', timestampSec: 1050 })).toBe(true);
    expect(t.accept({ ...base, type: 'pingWhere', timestampSec: 1040 })).toBe(true);
  });
});
```

- [ ] **Step 2: Run, verify fail** — `npx jest trustLayer` → FAIL

- [ ] **Step 3: Implement**

```ts
// src/core/trustLayer.ts
import type { Packet } from './types';

/**
 * Packet acceptance rules (spec §5):
 *  - reject packets older than maxAgeSec (blocks stale-capture replays)
 *  - reject packets not newer than the last accepted one per (sender, type) — last-write-wins
 */
export class TrustLayer {
  private lastSeen = new Map<string, number>();

  constructor(
    private maxAgeSec = 600,
    private nowSec: () => number = () => Math.floor(Date.now() / 1000),
  ) {}

  accept(p: Packet): boolean {
    if (this.nowSec() - p.timestampSec > this.maxAgeSec) return false;
    const key = `${p.senderId}:${p.type}`;
    const last = this.lastSeen.get(key);
    if (last !== undefined && p.timestampSec <= last) return false;
    this.lastSeen.set(key, p.timestampSec);
    return true;
  }
}
```

- [ ] **Step 4: Run, verify pass** — `npx jest trustLayer` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/core && git commit -m "feat: trust layer with replay rejection and last-write-wins ordering"
```

---

### Task 7: Seeded RNG + SimulatedTransport core (deterministic random walk)

**Files:**
- Create: `src/transport/LocationTransport.ts`, `src/transport/seededRandom.ts`, `src/transport/SimulatedTransport.ts`
- Test: `src/transport/__tests__/simulatedTransport.test.ts`

- [ ] **Step 1: Define the transport interface** (spec §8 — UI never knows how packets move)

```ts
// src/transport/LocationTransport.ts
import type { Packet } from '../core/types';

export interface MeshStatus {
  nearbyCount: number;
  connected: boolean;
}

export interface LocationTransport {
  start(): void;
  stop(): void;
  /** Send my packet into the mesh (position | ping | rally). */
  broadcast(packet: Packet): void;
  /** Deduped/replay-checked packets arriving from the mesh. relayVia = name of the hop, if any. */
  onPacket(cb: (packet: Packet, relayVia?: string) => void): void;
  onMeshStatus(cb: (status: MeshStatus) => void): void;
}
```

- [ ] **Step 2: Seeded PRNG**

```ts
// src/transport/seededRandom.ts
/** mulberry32 — tiny deterministic PRNG. Same seed → same sequence, so demos & tests reproduce exactly. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 3: Write failing tests for the walk + determinism**

```ts
// src/transport/__tests__/simulatedTransport.test.ts
import { SimulatedTransport } from '../SimulatedTransport';
import type { Packet } from '../../core/types';

const ORIGIN = { latitude: 37.7749, longitude: -122.4194 };
const FRIENDS = [
  { id: 101, name: 'Maya', color: '#4be3c0', startBearingDeg: 45, startDistanceM: 80 },
  { id: 102, name: 'Jules', color: '#ff9a5a', startBearingDeg: 210, startDistanceM: 140 },
  { id: 103, name: 'Sam', color: '#8c9aff', startBearingDeg: 270, startDistanceM: 210, relayVia: 'Maya', lagTicks: 2 },
];

function collect(t: SimulatedTransport, ticks: number): Packet[] {
  const out: Packet[] = [];
  t.onPacket((p) => out.push(p));
  for (let i = 0; i < ticks; i++) t.tick();
  return out;
}

function makeTransport(seed = 7) {
  let clock = 1000;
  return new SimulatedTransport({
    seed, origin: ORIGIN, friends: FRIENDS,
    nowSec: () => (clock += 2), // each tick advances sim time 2s
  });
}

describe('SimulatedTransport', () => {
  it('same seed → identical packet streams (deterministic)', () => {
    const a = collect(makeTransport(7), 5).map((p) => `${p.senderId}:${p.latitude.toFixed(8)},${p.longitude.toFixed(8)}`);
    const b = collect(makeTransport(7), 5).map((p) => `${p.senderId}:${p.latitude.toFixed(8)},${p.longitude.toFixed(8)}`);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });
  it('different seeds → different walks', () => {
    const a = collect(makeTransport(7), 5).map((p) => p.latitude);
    const b = collect(makeTransport(8), 5).map((p) => p.latitude);
    expect(a).not.toEqual(b);
  });
  it('friends move at festival amble (~2.6m per 2s tick)', () => {
    const t = makeTransport();
    const pks = collect(t, 2).filter((p) => p.senderId === 101);
    expect(pks.length).toBe(2);
    const meters =
      Math.hypot(
        (pks[1].latitude - pks[0].latitude) * 111320,
        (pks[1].longitude - pks[0].longitude) * 111320 * Math.cos((ORIGIN.latitude * Math.PI) / 180),
      );
    expect(meters).toBeGreaterThan(0.5);
    expect(meters).toBeLessThan(6);
  });
  it('lagged relay friend delivers packets late with relayVia set', () => {
    const t = makeTransport();
    const relayed: string[] = [];
    t.onPacket((p, via) => { if (p.senderId === 103 && via) relayed.push(via); });
    for (let i = 0; i < 4; i++) t.tick();
    expect(relayed.length).toBeGreaterThan(0);   // arrives after lagTicks
    expect(relayed[0]).toBe('Maya');
  });
  it('goDark stops packets; return resumes', () => {
    const t = makeTransport();
    t.scenario('goDark', 101);
    const dark = collect(t, 3).filter((p) => p.senderId === 101);
    expect(dark.length).toBe(0);
    t.scenario('return', 101);
    const back: Packet[] = [];
    t.onPacket((p) => { if (p.senderId === 101) back.push(p); });
    t.tick();
    expect(back.length).toBe(1);
  });
});
```

- [ ] **Step 4: Run, verify fail** — `npx jest simulatedTransport` → FAIL

- [ ] **Step 5: Implement the transport**

```ts
// src/transport/SimulatedTransport.ts
import type { Coordinate, Packet } from '../core/types';
import { movePoint, getAbsoluteBearing, getHaversineDistance } from '../core/geoMath';
import { mulberry32 } from './seededRandom';
import type { LocationTransport, MeshStatus } from './LocationTransport';

export interface SimFriendSpec {
  id: number; name: string; color: string;
  startBearingDeg: number; startDistanceM: number;
  relayVia?: string;   // delivered as if hopped via this crew member
  lagTicks?: number;   // buffer packets N ticks before delivery (simulates relay lag)
}

export type SimScenario = 'goDark' | 'return' | 'approach' | 'lowBattery';

interface SimFriend extends SimFriendSpec {
  pos: Coordinate; headingDeg: number; batteryPct: number;
  mode: 'walk' | 'dark' | 'approach';
  buffer: Array<{ packet: Packet; relayVia?: string }>;
  pendingPingReply: boolean;
}

interface Options {
  seed: number;
  origin: Coordinate;                 // "me" — friends spawn & orbit around this
  friends: SimFriendSpec[];
  tickMs?: number;
  nowSec?: () => number;
}

const WALK_SPEED_MPS = 1.3;
const TICK_SEC = 2;

export class SimulatedTransport implements LocationTransport {
  private rng: () => number;
  private friends: SimFriend[];
  private packetCbs: Array<(p: Packet, relayVia?: string) => void> = [];
  private statusCbs: Array<(s: MeshStatus) => void> = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private origin: Coordinate;
  private tickMs: number;
  private nowSec: () => number;

  constructor(opts: Options) {
    this.rng = mulberry32(opts.seed);
    this.origin = opts.origin;
    this.tickMs = opts.tickMs ?? 2000;
    this.nowSec = opts.nowSec ?? (() => Math.floor(Date.now() / 1000));
    this.friends = opts.friends.map((f) => ({
      ...f,
      pos: movePoint(opts.origin, f.startBearingDeg, f.startDistanceM),
      headingDeg: Math.floor(this.rng() * 360),
      batteryPct: 60 + Math.floor(this.rng() * 35),
      mode: 'walk',
      buffer: [],
      pendingPingReply: false,
    }));
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.tickMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  onPacket(cb: (p: Packet, relayVia?: string) => void): void { this.packetCbs.push(cb); }
  onMeshStatus(cb: (s: MeshStatus) => void): void { this.statusCbs.push(cb); }

  /** My outgoing packets. Sim friends react to pings addressed to them. */
  broadcast(packet: Packet): void {
    if (packet.type === 'pingWhere' || packet.type === 'pingComeFind') {
      const f = this.friends.find((x) => x.id === packet.targetId);
      if (f) {
        f.pendingPingReply = true;                         // answers next tick, even if dark (spec §5)
        if (packet.type === 'pingComeFind') f.mode = 'approach';
      }
    }
    // position/rally broadcasts vanish into the simulated ether (no echo needed)
  }

  /** Update my (real GPS) position so 'approach' friends walk toward the real me. */
  setOrigin(origin: Coordinate): void { this.origin = origin; }

  scenario(action: SimScenario, friendId: number): void {
    const f = this.friends.find((x) => x.id === friendId);
    if (!f) return;
    if (action === 'goDark') f.mode = 'dark';
    if (action === 'return') f.mode = 'walk';
    if (action === 'approach') f.mode = 'approach';
    if (action === 'lowBattery') f.batteryPct = 9;
  }

  /** One simulation step. Public so tests and demo controls can drive time manually. */
  tick(): void {
    const now = this.nowSec();
    for (const f of this.friends) {
      // movement
      if (f.mode === 'walk') {
        f.headingDeg = (f.headingDeg + (this.rng() * 80 - 40) + 360) % 360;
        f.pos = movePoint(f.pos, f.headingDeg, WALK_SPEED_MPS * TICK_SEC);
      } else if (f.mode === 'approach') {
        const dist = getHaversineDistance(f.pos, this.origin);
        if (dist > 8) {
          f.headingDeg = getAbsoluteBearing(f.pos, this.origin);
          f.pos = movePoint(f.pos, f.headingDeg, Math.min(1.5 * WALK_SPEED_MPS * TICK_SEC, dist - 6));
        }
      }
      f.batteryPct = Math.max(1, f.batteryPct - 0.02);

      const shouldEmit = f.mode !== 'dark' || f.pendingPingReply;
      if (shouldEmit) {
        f.pendingPingReply = false;
        const packet: Packet = {
          type: 'position', senderId: f.id, targetId: 0,
          latitude: f.pos.latitude, longitude: f.pos.longitude,
          headingDeg: Math.round(f.headingDeg), batteryPct: Math.round(f.batteryPct),
          timestampSec: now, accuracyM: 8 + Math.floor(this.rng() * 15),
        };
        if (f.lagTicks && f.lagTicks > 0) {
          f.buffer.push({ packet, relayVia: f.relayVia });
          if (f.buffer.length > f.lagTicks) {
            const delayed = f.buffer.shift()!;
            this.emit(delayed.packet, delayed.relayVia);
          }
        } else {
          this.emit(packet, f.relayVia);
        }
      }
    }
    const nearby = this.friends.filter((f) => f.mode !== 'dark').length;
    this.statusCbs.forEach((cb) => cb({ nearbyCount: nearby, connected: nearby > 0 }));
  }

  private emit(p: Packet, relayVia?: string): void {
    this.packetCbs.forEach((cb) => cb(p, relayVia));
  }
}
```

- [ ] **Step 6: Run, verify pass** — `npx jest simulatedTransport` → PASS

- [ ] **Step 7: Commit**

```bash
git add src/transport && git commit -m "feat: deterministic simulated transport with walk, relay lag, scenarios, ping replies"
```

---

### Task 8: crewStore (zustand) — crew state, session lifecycle, pins, freshness

**Files:**
- Create: `src/state/crewStore.ts`
- Test: `src/state/__tests__/crewStore.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/state/__tests__/crewStore.test.ts
import { useCrewStore, freshnessSec, STALE_SEC } from '../crewStore';
import type { Packet } from '../../core/types';

const posPacket = (senderId: number, timestampSec: number): Packet => ({
  type: 'position', senderId, targetId: 0, latitude: 37.77, longitude: -122.41,
  headingDeg: 0, batteryPct: 70, timestampSec, accuracyM: 10,
});

beforeEach(() => {
  useCrewStore.getState().reset();
  useCrewStore.getState().registerFriends([
    { id: 101, name: 'Maya', color: '#4be3c0' },
    { id: 102, name: 'Jules', color: '#ff9a5a' },
  ]);
});

describe('crewStore', () => {
  it('applies position packets to the right friend', () => {
    useCrewStore.getState().applyPacket(posPacket(101, 1000), 'someRelay');
    const f = useCrewStore.getState().friends[101];
    expect(f.lastPacket?.timestampSec).toBe(1000);
    expect(f.relayVia).toBe('someRelay');
  });

  it('computes freshness and staleness', () => {
    useCrewStore.getState().applyPacket(posPacket(101, 1000));
    const f = useCrewStore.getState().friends[101];
    expect(freshnessSec(f, 1010)).toBe(10);
    expect(freshnessSec(f, 1000 + STALE_SEC + 1)! > STALE_SEC).toBe(true);
    expect(freshnessSec(useCrewStore.getState().friends[102], 1010)).toBeNull(); // never seen
  });

  it('session: starts with duration, expires, extends', () => {
    const s = useCrewStore.getState();
    s.startSession(6, 1000);                      // 6h from t=1000
    expect(useCrewStore.getState().sessionEndsAtSec).toBe(1000 + 6 * 3600);
    expect(useCrewStore.getState().isSessionActive(1000 + 3600)).toBe(true);
    expect(useCrewStore.getState().isSessionActive(1000 + 7 * 3600)).toBe(false);
    s.extendSession(2);
    expect(useCrewStore.getState().sessionEndsAtSec).toBe(1000 + 8 * 3600);
    s.endSession();
    expect(useCrewStore.getState().sessionEndsAtSec).toBeNull();
  });

  it('rally pin: latest wins, older rally packets ignored', () => {
    const s = useCrewStore.getState();
    s.applyPacket({ ...posPacket(101, 2000), type: 'rally' });
    expect(useCrewStore.getState().rallyPin?.droppedById).toBe(101);
    s.applyPacket({ ...posPacket(102, 1500), type: 'rally' });   // older — ignored
    expect(useCrewStore.getState().rallyPin?.droppedById).toBe(101);
    s.applyPacket({ ...posPacket(102, 2500), type: 'rally' });   // newer — replaces
    expect(useCrewStore.getState().rallyPin?.droppedById).toBe(102);
  });

  it('ping packets set a banner instead of moving blips', () => {
    useCrewStore.getState().applyPacket({ ...posPacket(101, 1000), type: 'pingWhere', targetId: 1 });
    expect(useCrewStore.getState().banner).toMatch(/Maya/);
    expect(useCrewStore.getState().friends[101].lastPacket).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run, verify fail** — `npx jest crewStore` → FAIL

- [ ] **Step 3: Implement the store**

```ts
// src/state/crewStore.ts
import { create } from 'zustand';
import type { Coordinate, Packet } from '../core/types';

export type PrivacyMode = 'live' | 'open' | 'invisible';

export interface Profile { id: number; name: string; color: string; }
export interface FriendState {
  id: number; name: string; color: string;
  lastPacket?: Packet; relayVia?: string;
}
export interface RallyPin { latitude: number; longitude: number; droppedById: number; atSec: number; }

export const STALE_SEC = 90;    // desaturate blips older than this
export const GHOST_SEC = 240;   // "went dark" ghost state

/** Seconds since friend's last packet, or null if never seen. */
export function freshnessSec(f: FriendState, nowSec: number): number | null {
  return f.lastPacket ? nowSec - f.lastPacket.timestampSec : null;
}

interface CrewState {
  profile: Profile | null;
  privacyMode: PrivacyMode;
  sessionEndsAtSec: number | null;
  friends: Record<number, FriendState>;
  rallyPin: RallyPin | null;
  myLocation: Coordinate | null;
  meshNearby: number;
  beaconMode: boolean;
  banner: string | null;
  celebrated: Record<number, boolean>;

  setProfile(p: Profile): void;
  registerFriends(list: Array<Pick<FriendState, 'id' | 'name' | 'color'>>): void;
  applyPacket(p: Packet, relayVia?: string): void;
  startSession(hours: number, nowSec?: number): void;
  extendSession(hours: number): void;
  endSession(): void;
  isSessionActive(nowSec: number): boolean;
  setPrivacy(m: PrivacyMode): void;
  setMyLocation(c: Coordinate): void;
  setMeshNearby(n: number): void;
  setBeacon(on: boolean): void;
  setBanner(b: string | null): void;
  markCelebrated(friendId: number): void;
  dropLocalPin(pin: RallyPin): void;
  reset(): void;
}

const initial = {
  profile: null, privacyMode: 'live' as PrivacyMode, sessionEndsAtSec: null,
  friends: {}, rallyPin: null, myLocation: null, meshNearby: 0,
  beaconMode: false, banner: null, celebrated: {},
};

export const useCrewStore = create<CrewState>((set, get) => ({
  ...initial,

  setProfile: (profile) => set({ profile }),

  registerFriends: (list) =>
    set({
      friends: Object.fromEntries(list.map((f) => [f.id, { ...f }])),
    }),

  applyPacket: (p, relayVia) => {
    if (p.type === 'position') {
      const f = get().friends[p.senderId];
      if (!f) return; // unknown sender — not our crew, drop
      set({ friends: { ...get().friends, [p.senderId]: { ...f, lastPacket: p, relayVia } } });
    } else if (p.type === 'rally') {
      const current = get().rallyPin;
      if (!current || p.timestampSec > current.atSec) {
        set({
          rallyPin: {
            latitude: p.latitude, longitude: p.longitude,
            droppedById: p.senderId, atSec: p.timestampSec,
          },
          banner: `🚩 ${get().friends[p.senderId]?.name ?? 'Someone'} dropped a rally pin`,
        });
      }
    } else if (p.type === 'pingWhere' || p.type === 'pingComeFind') {
      const name = get().friends[p.senderId]?.name ?? 'Someone';
      set({
        banner: p.type === 'pingWhere'
          ? `📍 ${name} asked: where are you?`
          : `📣 ${name}: come find me!`,
      });
    }
  },

  startSession: (hours, nowSec = Math.floor(Date.now() / 1000)) =>
    set({ sessionEndsAtSec: nowSec + hours * 3600 }),
  extendSession: (hours) => {
    const cur = get().sessionEndsAtSec;
    if (cur) set({ sessionEndsAtSec: cur + hours * 3600 });
  },
  endSession: () => set({ sessionEndsAtSec: null }),
  isSessionActive: (nowSec) => {
    const ends = get().sessionEndsAtSec;
    return ends !== null && nowSec < ends;
  },

  setPrivacy: (privacyMode) => set({ privacyMode }),
  setMyLocation: (myLocation) => set({ myLocation }),
  setMeshNearby: (meshNearby) => set({ meshNearby }),
  setBeacon: (beaconMode) => set({ beaconMode }),
  setBanner: (banner) => set({ banner }),
  markCelebrated: (friendId) =>
    set({ celebrated: { ...get().celebrated, [friendId]: true } }),
  dropLocalPin: (rallyPin) => set({ rallyPin }),

  reset: () => set({ ...initial, friends: {} }),
}));
```

- [ ] **Step 4: Run, verify pass** — `npx jest crewStore` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/state && git commit -m "feat: crew store with session lifecycle, rally latest-wins, freshness, banners"
```

---

### Task 9: meshService — wire transport → trust → store; own-position broadcasting; battery guardrails

**Files:**
- Create: `src/services/meshService.ts`
- Test: `src/services/__tests__/meshService.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/services/__tests__/meshService.test.ts
import { createMeshService } from '../meshService';
import { useCrewStore } from '../../state/crewStore';
import { TrustLayer } from '../../core/trustLayer';
import type { LocationTransport, MeshStatus } from '../../transport/LocationTransport';
import type { Packet } from '../../core/types';

class FakeTransport implements LocationTransport {
  packetCb?: (p: Packet, via?: string) => void;
  statusCb?: (s: MeshStatus) => void;
  sent: Packet[] = [];
  start() {} stop() {}
  broadcast(p: Packet) { this.sent.push(p); }
  onPacket(cb: (p: Packet, via?: string) => void) { this.packetCb = cb; }
  onMeshStatus(cb: (s: MeshStatus) => void) { this.statusCb = cb; }
}

const pos = (senderId: number, ts: number): Packet => ({
  type: 'position', senderId, targetId: 0, latitude: 1, longitude: 1,
  headingDeg: 0, batteryPct: 50, timestampSec: ts, accuracyM: 10,
});

describe('meshService', () => {
  let transport: FakeTransport;
  let clock: number;
  const nowSec = () => clock;

  beforeEach(() => {
    clock = 1000;
    useCrewStore.getState().reset();
    useCrewStore.getState().setProfile({ id: 1, name: 'Me', color: '#fff' });
    useCrewStore.getState().registerFriends([{ id: 101, name: 'Maya', color: '#4be3c0' }]);
    useCrewStore.getState().setMyLocation({ latitude: 37.77, longitude: -122.41 });
    transport = new FakeTransport();
  });

  it('accepted packets reach the store; replays are dropped', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    transport.packetCb!(pos(101, 990));
    expect(useCrewStore.getState().friends[101].lastPacket?.timestampSec).toBe(990);
    transport.packetCb!(pos(101, 980)); // out-of-order replay — must not regress
    expect(useCrewStore.getState().friends[101].lastPacket?.timestampSec).toBe(990);
  });

  it('broadcasts my position only while session active and not invisible', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    svc.broadcastTick();                            // no session → nothing
    expect(transport.sent.length).toBe(0);
    useCrewStore.getState().startSession(6, clock);
    svc.broadcastTick();
    expect(transport.sent.length).toBe(1);
    expect(transport.sent[0].type).toBe('position');
    useCrewStore.getState().setPrivacy('invisible');
    svc.broadcastTick();
    expect(transport.sent.length).toBe(1);          // invisible → no broadcast
  });

  it('session expiry ends the session and sets a banner', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    useCrewStore.getState().startSession(1, clock); // 1h
    clock += 3700;                                  // past expiry
    svc.broadcastTick();
    expect(useCrewStore.getState().sessionEndsAtSec).toBeNull();
    expect(useCrewStore.getState().banner).toMatch(/session ended/i);
    expect(transport.sent.length).toBe(0);
  });

  it('pingFriend sends a targeted ping packet', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    useCrewStore.getState().startSession(6, clock);
    svc.pingFriend(101, 'pingComeFind');
    const ping = transport.sent.find((p) => p.type === 'pingComeFind');
    expect(ping?.targetId).toBe(101);
  });

  it('dropRally broadcasts a rally packet at my location and pins locally', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    useCrewStore.getState().startSession(6, clock);
    svc.dropRally();
    expect(transport.sent.some((p) => p.type === 'rally')).toBe(true);
    expect(useCrewStore.getState().rallyPin?.droppedById).toBe(1);
  });
});
```

- [ ] **Step 2: Run, verify fail** — `npx jest meshService` → FAIL

- [ ] **Step 3: Implement**

```ts
// src/services/meshService.ts
import { useCrewStore } from '../state/crewStore';
import { TrustLayer } from '../core/trustLayer';
import type { LocationTransport } from '../transport/LocationTransport';
import type { Packet, PacketType } from '../core/types';

export const BROADCAST_INTERVAL_SEC = 5;
export const BEACON_INTERVAL_SEC = 60;   // low-battery beacon mode (spec §5)

export interface MeshService {
  start(): void;
  stop(): void;
  /** One broadcast heartbeat. Called on an interval in the app; directly in tests. */
  broadcastTick(): void;
  pingFriend(friendId: number, kind: Extract<PacketType, 'pingWhere' | 'pingComeFind'>): void;
  dropRally(): void;
}

export function createMeshService(
  transport: LocationTransport,
  trust: TrustLayer,
  nowSec: () => number = () => Math.floor(Date.now() / 1000),
): MeshService {
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastBroadcastSec = 0;
  const store = () => useCrewStore.getState();

  const myPacket = (type: PacketType, targetId = 0): Packet | null => {
    const s = store();
    if (!s.profile || !s.myLocation) return null;
    return {
      type, senderId: s.profile.id, targetId,
      latitude: s.myLocation.latitude, longitude: s.myLocation.longitude,
      headingDeg: 0, batteryPct: 100, timestampSec: nowSec(), accuracyM: 10,
    };
  };

  const service: MeshService = {
    start() {
      transport.onPacket((p, relayVia) => {
        if (trust.accept(p)) store().applyPacket(p, relayVia);
      });
      transport.onMeshStatus((st) => store().setMeshNearby(st.nearbyCount));
      transport.start();
      timer = setInterval(() => service.broadcastTick(), 1000);
    },

    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      transport.stop();
    },

    broadcastTick() {
      const s = store();
      const now = nowSec();

      // session expiry (spec §4: auto-expire + notify)
      if (s.sessionEndsAtSec !== null && now >= s.sessionEndsAtSec) {
        s.endSession();
        s.setBanner('⏳ Session ended — you stopped broadcasting');
        return;
      }
      if (!s.isSessionActive(now)) return;
      if (s.privacyMode === 'invisible') return;

      const interval = s.beaconMode ? BEACON_INTERVAL_SEC : BROADCAST_INTERVAL_SEC;
      if (now - lastBroadcastSec < interval) return;
      const p = myPacket('position');
      if (!p) return;
      lastBroadcastSec = now;
      transport.broadcast(p);
    },

    pingFriend(friendId, kind) {
      const p = myPacket(kind, friendId);
      if (p) transport.broadcast(p);
    },

    dropRally() {
      const p = myPacket('rally');
      if (!p) return;
      transport.broadcast(p);
      const s = store();
      s.dropLocalPin({
        latitude: p.latitude, longitude: p.longitude,
        droppedById: p.senderId, atSec: p.timestampSec,
      });
    },
  };

  return service;
}
```

- [ ] **Step 4: Run full suite, verify pass** — `npx jest` → PASS (all suites)

- [ ] **Step 5: Commit**

```bash
git add src/services && git commit -m "feat: mesh service wiring transport→trust→store with session expiry and battery-aware broadcast"
```

---

### Task 10: Theme + app bootstrap (root layout, singleton wiring)

**Files:**
- Create: `src/ui/theme.ts`, `src/services/appServices.ts`
- Modify: `app/_layout.tsx`, `app/index.tsx`

- [ ] **Step 1: Theme constants**

```ts
// src/ui/theme.ts
export const colors = {
  bg: '#0a0b12',
  card: '#161a2b',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#ffffff',
  textDim: 'rgba(255,255,255,0.55)',
  pink: '#ff5a8c',
  orange: '#ff9a5a',
  teal: '#4be3c0',
  blue: '#8c9aff',
  yellow: '#ffcf5a',
  danger: '#ff5a5a',
};
export const FRIEND_COLORS = [colors.teal, colors.orange, colors.blue, colors.yellow, colors.pink];
```

- [ ] **Step 2: App-level singletons** (one transport + service for the whole app)

```ts
// src/services/appServices.ts
import { SimulatedTransport } from '../transport/SimulatedTransport';
import { TrustLayer } from '../core/trustLayer';
import { createMeshService, type MeshService } from './meshService';
import { useCrewStore } from '../state/crewStore';
import type { Coordinate } from '../core/types';

export const DEMO_CREW = [
  { id: 101, name: 'Maya', color: '#4be3c0', startBearingDeg: 45, startDistanceM: 80 },
  { id: 102, name: 'Jules', color: '#ff9a5a', startBearingDeg: 210, startDistanceM: 140 },
  { id: 103, name: 'Sam', color: '#8c9aff', startBearingDeg: 270, startDistanceM: 210, relayVia: 'Maya', lagTicks: 2 },
  { id: 104, name: 'Rae', color: '#ffcf5a', startBearingDeg: 130, startDistanceM: 320 },
];

// Fallback origin if location permission denied (spec §10 error handling): Golden Gate Park.
export const FALLBACK_ORIGIN: Coordinate = { latitude: 37.7694, longitude: -122.4862 };

let transport: SimulatedTransport | null = null;
let service: MeshService | null = null;

export function getTransport(): SimulatedTransport {
  if (!transport) {
    transport = new SimulatedTransport({
      seed: 42,
      origin: useCrewStore.getState().myLocation ?? FALLBACK_ORIGIN,
      friends: DEMO_CREW,
    });
  }
  return transport;
}

export function getMeshService(): MeshService {
  if (!service) {
    service = createMeshService(getTransport(), new TrustLayer());
  }
  return service;
}

export function bootCrew(): void {
  useCrewStore.getState().registerFriends(DEMO_CREW.map(({ id, name, color }) => ({ id, name, color })));
}
```

- [ ] **Step 3: Root layout with onboarding redirect**

```tsx
// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useCrewStore } from '../src/state/crewStore';
import { colors } from '../src/ui/theme';

export default function RootLayout() {
  const profile = useCrewStore((s) => s.profile);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inOnboarding = segments[0] === 'onboarding';
    if (!profile && !inOnboarding) router.replace('/onboarding');
    if (profile && inOnboarding) router.replace('/');
  }, [profile, segments]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </>
  );
}
```

```tsx
// app/index.tsx — placeholder home until Task 12 builds the radar
import { View, Text } from 'react-native';
import { colors } from '../src/ui/theme';

export default function Home() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>
        Loc<Text style={{ color: colors.pink }}>8</Text>
      </Text>
    </View>
  );
}
```

- [ ] **Step 4: Verify** — `npx expo start`, open in simulator/Expo Go: app redirects to `/onboarding` (404 for now is OK — built next task) or shows the placeholder. No red screen.

- [ ] **Step 5: Commit**

```bash
git add src/ui src/services app && git commit -m "feat: theme, app singletons, root layout with onboarding redirect"
```

---

### Task 11: Onboarding — profile + permission priming (spec §3)

**Files:**
- Create: `app/onboarding.tsx`

- [ ] **Step 1: Implement the two-step onboarding**

```tsx
// app/onboarding.tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useCrewStore } from '../src/state/crewStore';
import { colors, FRIEND_COLORS } from '../src/ui/theme';

export default function Onboarding() {
  const [step, setStep] = useState<'profile' | 'location' | 'denied'>('profile');
  const [name, setName] = useState('');
  const [color, setColor] = useState(FRIEND_COLORS[0]);
  const setProfile = useCrewStore((s) => s.setProfile);

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setProfile({ id: 1, name: name.trim() || 'You', color }); // triggers root redirect → home
    } else {
      setStep('denied');
    }
  };

  if (step === 'profile') {
    return (
      <View style={st.wrap}>
        <Text style={st.logo}>Loc<Text style={{ color: colors.pink }}>8</Text></Text>
        <Text style={st.tagline}>Find your crew when the signal's gone.</Text>
        <TextInput
          style={st.input} placeholder="Your name" placeholderTextColor={colors.textDim}
          value={name} onChangeText={setName} maxLength={12}
        />
        <View style={st.colorRow}>
          {FRIEND_COLORS.map((c) => (
            <Pressable
              key={c} onPress={() => setColor(c)}
              style={[st.swatch, { backgroundColor: c }, color === c && st.swatchSel]}
            />
          ))}
        </View>
        <Pressable
          style={[st.btn, !name.trim() && { opacity: 0.4 }]}
          disabled={!name.trim()}
          onPress={() => setStep('location')}
        >
          <Text style={st.btnText}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  if (step === 'denied') {
    return (
      <View style={st.wrap}>
        <Text style={st.h}>Loc8 can't work without location</Text>
        <Text style={st.p}>
          Your GPS position is how your crew finds you. It's end-to-end encrypted — it never
          leaves your crew. Enable location in Settings to continue.
        </Text>
        <Pressable style={st.btn} onPress={() => Linking.openSettings()}>
          <Text style={st.btnText}>Open Settings</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={requestLocation}>
          <Text style={st.btnGhostText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={st.wrap}>
      <Text style={{ fontSize: 56 }}>📍</Text>
      <Text style={st.h}>Your location, your crew only</Text>
      <Text style={st.p}>
        Loc8 uses your GPS to show your crew where you are — even with zero signal. Your
        location is end-to-end encrypted and never touches a server.
      </Text>
      <Pressable style={st.btn} onPress={requestLocation}>
        <Text style={st.btnText}>Enable location</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  logo: { color: colors.text, fontSize: 42, fontWeight: '800' },
  tagline: { color: colors.textDim, fontSize: 15, marginBottom: 12 },
  h: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  p: { color: colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  input: {
    width: '100%', backgroundColor: colors.card, borderRadius: 14, padding: 16,
    color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.cardBorder,
  },
  colorRow: { flexDirection: 'row', gap: 12 },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  swatchSel: { borderWidth: 3, borderColor: '#fff' },
  btn: {
    width: '100%', backgroundColor: colors.pink, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnGhost: { padding: 12 },
  btnGhostText: { color: colors.textDim, fontSize: 14 },
});
```

- [ ] **Step 2: Manual verify** — `npx expo start`: fresh install shows profile step → name + color → location priming with the "why" copy → OS prompt → grant lands on home; deny shows the recovery screen with Settings link (spec §10 error state ✓).

- [ ] **Step 3: Commit**

```bash
git add app/onboarding.tsx && git commit -m "feat: onboarding with profile and location permission priming + denied recovery"
```

---

### Task 12: Radar screen — rings, live blips, freshness/ghost states, mesh badge, rally pin marker

**Files:**
- Create: `src/ui/RadarView.tsx`, `src/ui/Blip.tsx`, `src/hooks/useNowSec.ts`, `src/hooks/useMyLocation.ts`
- Modify: `app/index.tsx` (becomes the radar home)

- [ ] **Step 1: Ticking clock + GPS hooks**

```ts
// src/hooks/useNowSec.ts
import { useEffect, useState } from 'react';

/** Re-renders once per second with current unix seconds — drives freshness labels. */
export function useNowSec(): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}
```

```ts
// src/hooks/useMyLocation.ts
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { useCrewStore } from '../state/crewStore';
import { getTransport, FALLBACK_ORIGIN } from '../services/appServices';

export type LocationStatus = 'pending' | 'granted' | 'denied';

/** Watches real GPS; feeds store + sim origin. Falls back to demo origin if denied. */
export function useMyLocation(): LocationStatus {
  const [status, setStatus] = useState<LocationStatus>('pending');
  const setMyLocation = useCrewStore((s) => s.setMyLocation);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setStatus('denied');
        setMyLocation(FALLBACK_ORIGIN);
        getTransport().setOrigin(FALLBACK_ORIGIN);
        return;
      }
      setStatus('granted');
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 2 },
        (loc) => {
          const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setMyLocation(c);
          getTransport().setOrigin(c);
        },
      );
    })();
    return () => sub?.remove();
  }, []);

  return status;
}
```

- [ ] **Step 2: Animated blip component**

```tsx
// src/ui/Blip.tsx
import { Text, View, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors } from './theme';

interface Props {
  x: number; y: number;                 // px offsets from radar center
  name: string; color: string;
  distanceM: number;
  freshness: number | null;             // seconds since last packet
  relayVia?: string;
  stale: boolean; ghost: boolean;
  onPress(): void;
}

export function Blip({ x, y, name, color, distanceM, freshness, relayVia, stale, ghost, onPress }: Props) {
  const tx = useSharedValue(x);
  const ty = useSharedValue(y);
  useEffect(() => {
    tx.value = withTiming(x, { duration: 900 });   // glide between packets — no teleporting dots
    ty.value = withTiming(y, { duration: 900 });
  }, [x, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  const opacity = ghost ? 0.3 : stale ? 0.55 : 1;
  const sub = ghost
    ? `last seen ${Math.floor((freshness ?? 0) / 60)}m ago`
    : relayVia
      ? `${Math.round(distanceM)}m · via ${relayVia} 🔗`
      : `${Math.round(distanceM)}m · ${freshness ?? 0}s`;

  return (
    <Animated.View style={[st.wrap, style, { opacity }]}>
      <Pressable onPress={onPress} style={st.inner}>
        <View style={[st.avatar, { backgroundColor: color }]}>
          <Text style={st.initial}>{name[0]}</Text>
        </View>
        <View style={st.tag}>
          <Text style={st.tagName}>{name}</Text>
          <Text style={st.tagSub}>{sub}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'absolute', left: '50%', top: '50%', marginLeft: -19, marginTop: -19 },
  inner: { alignItems: 'center', gap: 3 },
  avatar: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)',
  },
  initial: { color: colors.bg, fontWeight: '800', fontSize: 14 },
  tag: { backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 2, alignItems: 'center' },
  tagName: { color: colors.text, fontSize: 10, fontWeight: '700' },
  tagSub: { color: colors.teal, fontSize: 9, fontWeight: '600' },
});
```

- [ ] **Step 3: RadarView (rings + me-dot + plotted blips + pin)**

```tsx
// src/ui/RadarView.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useCrewStore, freshnessSec, STALE_SEC, GHOST_SEC } from '../state/crewStore';
import { calculateRadarPoint, LINEAR_MAX_M, OUTER_MAX_M } from '../core/geoMath';
import { useNowSec } from '../hooks/useNowSec';
import { Blip } from './Blip';
import { colors } from './theme';

export function RadarView() {
  const [size, setSize] = useState(0);
  const friends = useCrewStore((s) => s.friends);
  const myLocation = useCrewStore((s) => s.myLocation);
  const rallyPin = useCrewStore((s) => s.rallyPin);
  const now = useNowSec();
  const router = useRouter();
  const radius = size / 2 - 24;

  return (
    <View style={st.wrap} onLayout={(e) => setSize(Math.min(e.nativeEvent.layout.width, e.nativeEvent.layout.height))}>
      {size > 0 && (
        <>
          <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
            {/* rings: 75m (35%), 150m (70% — end of linear zone), outer log ring */}
            <Circle cx={size / 2} cy={size / 2} r={radius * 0.35} stroke={colors.cardBorder} strokeWidth={1} fill="none" />
            <Circle cx={size / 2} cy={size / 2} r={radius * 0.7} stroke={colors.cardBorder} strokeWidth={1} fill="none" />
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.cardBorder} strokeWidth={1} fill="none" />
          </Svg>
          <Text style={[st.ringLabel, { top: size / 2 - radius * 0.35 - 14 }]}>{Math.round(LINEAR_MAX_M / 2)}m</Text>
          <Text style={[st.ringLabel, { top: size / 2 - radius * 0.7 - 14 }]}>{LINEAR_MAX_M}m</Text>
          <Text style={[st.ringLabel, { top: size / 2 - radius - 14 }]}>{OUTER_MAX_M / 1000}km+</Text>

          {/* me */}
          <View style={st.me} />

          {/* rally pin */}
          {rallyPin && myLocation && (() => {
            const pt = calculateRadarPoint(myLocation, rallyPin, radius);
            const dropper = friends[rallyPin.droppedById]?.name ?? 'You';
            return (
              <View style={[st.pin, { transform: [{ translateX: pt.x }, { translateY: pt.y }] }]}>
                <Text style={{ fontSize: 22 }}>🚩</Text>
                <Text style={st.pinLabel}>{dropper} · {Math.round(pt.distanceMeters)}m</Text>
              </View>
            );
          })()}

          {/* friends */}
          {myLocation && Object.values(friends).map((f) => {
            if (!f.lastPacket) return null;
            const fresh = freshnessSec(f, now);
            const pt = calculateRadarPoint(
              myLocation,
              { latitude: f.lastPacket.latitude, longitude: f.lastPacket.longitude },
              radius,
            );
            return (
              <Blip
                key={f.id}
                x={pt.x} y={pt.y}
                name={f.name} color={f.color}
                distanceM={pt.distanceMeters}
                freshness={fresh}
                relayVia={f.relayVia}
                stale={fresh !== null && fresh > STALE_SEC}
                ghost={fresh !== null && fresh > GHOST_SEC}
                onPress={() => router.push(`/compass/${f.id}`)}
              />
            );
          })}
        </>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringLabel: { position: 'absolute', alignSelf: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 9 },
  me: {
    position: 'absolute', left: '50%', top: '50%', marginLeft: -9, marginTop: -9,
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff',
    shadowColor: '#fff', shadowOpacity: 0.8, shadowRadius: 8, elevation: 8,
  },
  pin: { position: 'absolute', left: '50%', top: '50%', marginLeft: -12, marginTop: -30, alignItems: 'center' },
  pinLabel: {
    color: colors.yellow, fontSize: 9, fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8,
  },
});
```

- [ ] **Step 4: Radar home screen** (replaces placeholder)

```tsx
// app/index.tsx
import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useCrewStore } from '../src/state/crewStore';
import { getMeshService, getTransport, bootCrew } from '../src/services/appServices';
import { useMyLocation } from '../src/hooks/useMyLocation';
import { RadarView } from '../src/ui/RadarView';
import { colors } from '../src/ui/theme';

export default function RadarHome() {
  const meshNearby = useCrewStore((s) => s.meshNearby);
  const banner = useCrewStore((s) => s.banner);
  const setBanner = useCrewStore((s) => s.setBanner);
  const sessionEndsAtSec = useCrewStore((s) => s.sessionEndsAtSec);
  const startSession = useCrewStore((s) => s.startSession);
  const locationStatus = useMyLocation();

  useEffect(() => {
    bootCrew();
    getMeshService().start();
    getTransport().start();
    return () => { getTransport().stop(); };
  }, []);

  useEffect(() => {
    if (banner) {
      const t = setTimeout(() => setBanner(null), 4000);
      return () => clearTimeout(t);
    }
  }, [banner]);

  const hasAny = Object.values(useCrewStore((s) => s.friends)).some((f) => f.lastPacket);

  return (
    <View style={st.wrap}>
      <View style={st.top}>
        <Text style={st.brand}>Loc<Text style={{ color: colors.pink }}>8</Text></Text>
        <View style={st.mesh}>
          <View style={st.dot} />
          <Text style={st.meshText}>MESH · {meshNearby} nearby</Text>
        </View>
      </View>

      {banner && <View style={st.banner}><Text style={st.bannerText}>{banner}</Text></View>}

      {sessionEndsAtSec === null && (
        <Pressable style={st.sessionCta} onPress={() => startSession(6)}>
          <Text style={st.sessionCtaText}>▶ Start a 6h session — become findable</Text>
        </Pressable>
      )}

      {locationStatus === 'denied' && (
        <Text style={st.warn}>⚠ Location denied — demo mode around Golden Gate Park</Text>
      )}

      {meshNearby === 0 && (
        <Text style={st.warn}>No crew in range — last known positions shown</Text>
      )}

      <RadarView />
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingTop: 56 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  brand: { color: colors.text, fontSize: 20, fontWeight: '800' },
  mesh: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(75,227,192,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(75,227,192,0.25)',
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.teal },
  meshText: { color: colors.teal, fontSize: 11, fontWeight: '700' },
  banner: {
    marginHorizontal: 20, marginTop: 10, backgroundColor: colors.card, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: colors.cardBorder,
  },
  bannerText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  sessionCta: {
    marginHorizontal: 20, marginTop: 10, backgroundColor: colors.pink, borderRadius: 12, padding: 14, alignItems: 'center',
  },
  sessionCtaText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  warn: { color: colors.yellow, fontSize: 11, textAlign: 'center', marginTop: 8 },
});
```

- [ ] **Step 5: Manual verify** — `npx expo start`: radar shows rings + labels, 4 blips appear and glide around your real location (or fallback), Sam shows "via Maya 🔗", "Start session" CTA appears, mesh badge counts. Kill location permission in Settings → relaunch → demo-mode warning shows. (Rae will use a dev scenario for going dark — Task 16.)

- [ ] **Step 6: Run full suite** — `npx jest` → PASS

- [ ] **Step 7: Commit**

```bash
git add src app && git commit -m "feat: radar home with animated blips, freshness states, mesh badge, session CTA"
```

---

### Task 13: Crew sheet + Crew screen (session controls, mocked QR/link)

**Files:**
- Create: `src/ui/CrewSheet.tsx`, `app/crew.tsx`
- Modify: `app/index.tsx` (mount sheet + nav button)

- [ ] **Step 1: Crew bottom sheet on the radar**

```tsx
// src/ui/CrewSheet.tsx
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useCrewStore, freshnessSec, GHOST_SEC } from '../state/crewStore';
import { getMeshService } from '../services/appServices';
import { getHaversineDistance } from '../core/geoMath';
import { useNowSec } from '../hooks/useNowSec';
import { colors } from './theme';

export function CrewSheet() {
  const friends = useCrewStore((s) => s.friends);
  const myLocation = useCrewStore((s) => s.myLocation);
  const now = useNowSec();
  const router = useRouter();

  const ping = (id: number, name: string) =>
    Alert.alert(`Ping ${name}`, undefined, [
      { text: '📍 Where are you?', onPress: () => getMeshService().pingFriend(id, 'pingWhere') },
      { text: '📣 Come find me', onPress: () => getMeshService().pingFriend(id, 'pingComeFind') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const online = Object.values(friends).filter(
    (f) => f.lastPacket && (freshnessSec(f, now) ?? Infinity) <= GHOST_SEC,
  ).length;

  return (
    <View style={st.sheet}>
      <View style={st.grab} />
      <Text style={st.h}>YOUR CREW · {online} online</Text>
      {Object.values(friends).map((f) => {
        const fresh = freshnessSec(f, now);
        const dist =
          f.lastPacket && myLocation
            ? Math.round(getHaversineDistance(myLocation, {
                latitude: f.lastPacket.latitude, longitude: f.lastPacket.longitude,
              }))
            : null;
        const sub = !f.lastPacket
          ? 'not seen yet'
          : fresh! > GHOST_SEC
            ? `went dark · ${Math.floor(fresh! / 60)}m ago`
            : `${dist}m · ${fresh}s ago${f.relayVia ? ` · via ${f.relayVia} 🔗` : ''}`;
        return (
          <View key={f.id} style={st.row}>
            <View style={[st.av, { backgroundColor: f.color }]}>
              <Text style={st.avText}>{f.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.name}>{f.name}</Text>
              <Text style={st.sub}>{sub}</Text>
            </View>
            <Pressable style={st.pingBtn} onPress={() => ping(f.id, f.name)}>
              <Text style={st.pingText}>Ping</Text>
            </Pressable>
            <Pressable style={st.findBtn} onPress={() => router.push(`/compass/${f.id}`)}>
              <Text style={st.findText}>Find →</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  sheet: {
    backgroundColor: 'rgba(16,19,32,0.96)', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    borderTopWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
  },
  grab: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 10 },
  h: { color: colors.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  av: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avText: { color: colors.bg, fontWeight: '800', fontSize: 13 },
  name: { color: colors.text, fontSize: 14, fontWeight: '600' },
  sub: { color: colors.textDim, fontSize: 11 },
  pingBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder },
  pingText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  findBtn: { backgroundColor: colors.pink, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  findText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
```

- [ ] **Step 2: Mount sheet + crew nav on radar** — in `app/index.tsx`, import `CrewSheet` and add below `<RadarView />`:

```tsx
// app/index.tsx — add imports:
import { CrewSheet } from '../src/ui/CrewSheet';
import { useRouter } from 'expo-router';
// inside RadarHome(): const router = useRouter();
// replace  <RadarView />  with:
      <RadarView />
      <Pressable style={st.crewNav} onPress={() => router.push('/crew')}>
        <Text style={st.crewNavText}>👥 Manage crew & session</Text>
      </Pressable>
      <CrewSheet />
// and add to styles:
  crewNav: { alignItems: 'center', paddingVertical: 6 },
  crewNavText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
```

- [ ] **Step 3: Crew screen with session lifecycle + mocked add-flows**

```tsx
// app/crew.tsx
import { View, Text, Pressable, StyleSheet, Modal, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useCrewStore } from '../src/state/crewStore';
import { useNowSec } from '../src/hooks/useNowSec';
import { colors } from '../src/ui/theme';

export default function CrewScreen() {
  const router = useRouter();
  const now = useNowSec();
  const sessionEndsAtSec = useCrewStore((s) => s.sessionEndsAtSec);
  const startSession = useCrewStore((s) => s.startSession);
  const extendSession = useCrewStore((s) => s.extendSession);
  const endSession = useCrewStore((s) => s.endSession);
  const [qrVisible, setQrVisible] = useState(false);

  const remaining = sessionEndsAtSec ? Math.max(0, sessionEndsAtSec - now) : 0;
  const hh = Math.floor(remaining / 3600);
  const mm = Math.floor((remaining % 3600) / 60);

  return (
    <View style={st.wrap}>
      <Pressable onPress={() => router.back()}><Text style={st.back}>‹ Back</Text></Pressable>
      <Text style={st.h1}>Crew & session</Text>

      <View style={st.card}>
        <Text style={st.cardH}>SESSION</Text>
        {sessionEndsAtSec ? (
          <>
            <Text style={st.big}>{hh}h {mm}m left</Text>
            <Text style={st.p}>Auto-expires — you'll stop broadcasting automatically.</Text>
            <View style={st.row}>
              <Pressable style={st.btnGhost} onPress={() => extendSession(2)}>
                <Text style={st.btnGhostText}>+2h</Text>
              </Pressable>
              <Pressable style={[st.btnGhost, { borderColor: colors.danger }]} onPress={endSession}>
                <Text style={[st.btnGhostText, { color: colors.danger }]}>End now</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={st.p}>Not broadcasting. Start a session to become findable.</Text>
            <View style={st.row}>
              {[4, 6, 12].map((h) => (
                <Pressable key={h} style={st.btn} onPress={() => startSession(h)}>
                  <Text style={st.btnText}>{h}h</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={st.card}>
        <Text style={st.cardH}>ADD FRIENDS</Text>
        <Pressable style={st.btn} onPress={() => setQrVisible(true)}>
          <Text style={st.btnText}>＋ Add friend via QR</Text>
        </Pressable>
        <Pressable
          style={st.btnGhost}
          onPress={() => Alert.alert('Mocked in v1', 'Crew invite links ship with the real mesh (v2).')}
        >
          <Text style={st.btnGhostText}>🔗 Create crew link</Text>
        </Pressable>
      </View>

      <Modal visible={qrVisible} transparent animationType="slide">
        <View style={st.modalWrap}>
          <View style={st.modalCard}>
            <Text style={st.h1}>Add a friend nearby</Text>
            <Text style={st.p}>Have them scan this — pairs over Bluetooth, no internet.</Text>
            <View style={st.qr}><Text style={{ fontSize: 64 }}>▦</Text></View>
            <Text style={[st.p, { fontSize: 11 }]}>Mocked in v1 — real BLE pairing lands in v2.</Text>
            <Pressable style={st.btn} onPress={() => setQrVisible(false)}>
              <Text style={st.btnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 20, paddingTop: 60, gap: 14 },
  back: { color: colors.textDim, fontSize: 15, marginBottom: 6 },
  h1: { color: colors.text, fontSize: 22, fontWeight: '800' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.cardBorder },
  cardH: { color: colors.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  big: { color: colors.text, fontSize: 28, fontWeight: '800' },
  p: { color: colors.textDim, fontSize: 13, lineHeight: 19 },
  row: { flexDirection: 'row', gap: 10 },
  btn: { backgroundColor: colors.pink, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  btnGhost: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  btnGhostText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#12141f', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    padding: 24, gap: 12, alignItems: 'center',
  },
  qr: {
    width: 170, height: 170, borderRadius: 16, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
});
```

- [ ] **Step 4: Manual verify** — crew sheet lists all four with live distances; Ping opens the two-option alert; Find navigates (404 until Task 14 — OK); crew screen starts/extends/ends sessions with live countdown; QR modal shows.

- [ ] **Step 5: Commit**

```bash
git add src app && git commit -m "feat: crew sheet with find/ping, crew screen with session lifecycle and mocked QR/link"
```

---

### Task 14: Compass screen + smoothed heading hook

**Files:**
- Create: `src/hooks/useSmoothedHeading.ts`, `app/compass/[id].tsx`

- [ ] **Step 1: Heading hook (magnetometer with graceful fallback)**

```ts
// src/hooks/useSmoothedHeading.ts
import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { smoothHeading } from '../core/geoMath';

/**
 * Device compass heading through the low-pass filter (spec §6 — festival EM noise).
 * Falls back to 0° (north-up) when no magnetometer (simulators).
 */
export function useSmoothedHeading(): number {
  const [heading, setHeading] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let mounted = true;
    (async () => {
      try {
        sub = await Location.watchHeadingAsync((h) => {
          if (!mounted) return;
          const raw = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          current.current = smoothHeading(current.current, raw, 0.25);
          setHeading(current.current);
        });
      } catch {
        // no magnetometer (simulator) — stay north-up at 0°
      }
    })();
    return () => { mounted = false; sub?.remove(); };
  }, []);

  return heading;
}
```

- [ ] **Step 2: Compass screen**

```tsx
// app/compass/[id].tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useCrewStore, freshnessSec } from '../../src/state/crewStore';
import { getHaversineDistance, getAbsoluteBearing } from '../../src/core/geoMath';
import { useSmoothedHeading } from '../../src/hooks/useSmoothedHeading';
import { useNowSec } from '../../src/hooks/useNowSec';
import { colors } from '../../src/ui/theme';

export default function CompassScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const friend = useCrewStore((s) => s.friends[Number(id)]);
  const myLocation = useCrewStore((s) => s.myLocation);
  const heading = useSmoothedHeading();
  const now = useNowSec();
  const rotation = useSharedValue(0);

  const friendPos = friend?.lastPacket
    ? { latitude: friend.lastPacket.latitude, longitude: friend.lastPacket.longitude }
    : null;
  const dist = friendPos && myLocation ? getHaversineDistance(myLocation, friendPos) : null;
  const bearing = friendPos && myLocation ? getAbsoluteBearing(myLocation, friendPos) : 0;
  const arrowDeg = ((bearing - heading) + 360) % 360;

  useEffect(() => {
    // rotate the short way round
    const cur = rotation.value % 360;
    let delta = arrowDeg - cur;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    rotation.value = withTiming(rotation.value + delta, { duration: 400 });
  }, [arrowDeg]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!friend) return null;
  const fresh = friend.lastPacket ? freshnessSec(friend, now) : null;
  const warmth =
    dist === null ? '' : dist < 70 ? '🔥 very warm — almost there' : dist < 150 ? '🔥 getting warmer' : '🧭 keep walking';

  return (
    <View style={st.wrap}>
      <Pressable style={st.back} onPress={() => router.back()}>
        <Text style={st.backText}>‹ Back to radar</Text>
      </Pressable>
      <View style={st.pill}><Text style={st.pillText}>Following · {friend.name}</Text></View>

      <View style={st.center}>
        <Animated.Text style={[st.arrow, arrowStyle]}>➤</Animated.Text>
        <Text style={st.dist}>{dist !== null ? `${Math.round(dist)}m` : '—'}</Text>
        <Text style={st.who}>{friend.name} · this way</Text>
        <Text style={st.warm}>{warmth}</Text>
        {fresh !== null && fresh > 30 && (
          <Text style={st.staleNote}>position is {fresh}s old</Text>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingTop: 56, alignItems: 'center' },
  back: { position: 'absolute', top: 56, left: 18, backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, zIndex: 5 },
  backText: { color: colors.text, fontSize: 13 },
  pill: { backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, marginTop: 50 },
  pillText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  arrow: {
    fontSize: 130, color: colors.teal, marginBottom: 12,
    textShadowColor: 'rgba(75,227,192,0.6)', textShadowRadius: 30, textShadowOffset: { width: 0, height: 0 },
  },
  dist: { color: colors.text, fontSize: 52, fontWeight: '800' },
  who: { color: colors.teal, fontSize: 14, fontWeight: '600' },
  warm: { color: colors.textDim, fontSize: 12, marginTop: 8 },
  staleNote: { color: colors.yellow, fontSize: 11, marginTop: 4 },
});
```

Note: the `➤` glyph points right (90°), so the arrow's rest rotation is offset — verify on device; if the arrow points 90° off, change the style to add a base rotation: `transform: [{ rotate: \`${rotation.value - 90}deg\` }]`.

- [ ] **Step 3: Manual verify** — tap Find → arrow points toward the blip's radar direction and distance updates every ~2s; walking (or on device, rotating the phone) swings the arrow smoothly, never spinning the long way; stale note appears if you trigger goDark later.

- [ ] **Step 4: Commit**

```bash
git add src app && git commit -m "feat: compass mode with smoothed heading arrow, warmth feedback, stale note"
```

---

### Task 15: Proximity mode + found-each-other celebration

**Files:**
- Modify: `app/compass/[id].tsx`

- [ ] **Step 1: Add proximity + celebration states.** In `app/compass/[id].tsx`:

Add imports:

```tsx
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
```

Inside `CompassScreen()` after `dist` is computed, add:

```tsx
  const markCelebrated = useCrewStore((s) => s.markCelebrated);
  const celebrated = useCrewStore((s) => s.celebrated[Number(id)]);
  const accuracy = friend?.lastPacket?.accuracyM ?? 15;
  // Proximity threshold adapts to GPS accuracy (spec §3): never pretend arrow precision we don't have.
  const proximityAt = Math.max(25, accuracy * 1.5);
  const inProximity = dist !== null && dist < proximityAt;
  const found = dist !== null && dist < 15;
  const [celebrationShown, setCelebrationShown] = useState(false);

  useEffect(() => {
    if (inProximity) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [friend?.lastPacket?.timestampSec, inProximity]);

  useEffect(() => {
    if (found && !celebrated && !celebrationShown) {
      setCelebrationShown(true);
      markCelebrated(Number(id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [found]);
```

Then replace the `<View style={st.center}>…</View>` block with a three-state render:

```tsx
      {celebrationShown ? (
        <View style={st.center}>
          <Text style={{ fontSize: 90 }}>🎉</Text>
          <Text style={st.foundH}>You found each other!</Text>
          <Text style={st.warm}>{friend.name} is right here.</Text>
          <Pressable style={st.doneBtn} onPress={() => router.back()}>
            <Text style={st.doneText}>Back to radar</Text>
          </Pressable>
        </View>
      ) : inProximity ? (
        <View style={st.center}>
          <View style={st.pulse}><Text style={{ fontSize: 56 }}>👀</Text></View>
          <Text style={st.proxH}>You're basically there</Text>
          <Text style={st.warm}>GPS can't do better than ~{Math.round(accuracy)}m here — look around!</Text>
          <Text style={st.dist}>{Math.round(dist!)}m</Text>
        </View>
      ) : (
        <View style={st.center}>
          <Animated.Text style={[st.arrow, arrowStyle]}>➤</Animated.Text>
          <Text style={st.dist}>{dist !== null ? `${Math.round(dist)}m` : '—'}</Text>
          <Text style={st.who}>{friend.name} · this way</Text>
          <Text style={st.warm}>{warmth}</Text>
          {fresh !== null && fresh > 30 && <Text style={st.staleNote}>position is {fresh}s old</Text>}
        </View>
      )}
```

Add styles:

```tsx
  pulse: {
    width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.teal, backgroundColor: 'rgba(75,227,192,0.08)',
  },
  proxH: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 14 },
  foundH: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 10 },
  doneBtn: { backgroundColor: colors.pink, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 18 },
  doneText: { color: '#fff', fontWeight: '800' },
```

- [ ] **Step 2: Manual verify with the approach scenario** — temporary until Task 16's dev menu: in `app/index.tsx`'s boot `useEffect`, add `setTimeout(() => getTransport().scenario('approach', 101), 10000);` — Maya walks to you: arrow → "basically there 👀" (with haptics per packet) → 🎉 celebration exactly once. Remove the temp line after verifying.

- [ ] **Step 3: Commit**

```bash
git add app && git commit -m "feat: proximity mode with accuracy-adaptive threshold and found-each-other celebration"
```

---

### Task 16: Radar FABs (rally pin, privacy, dev scenarios), privacy modal, share sheet

**Files:**
- Create: `src/ui/PrivacyModal.tsx`, `src/ui/ShareSheet.tsx`, `src/ui/DevMenu.tsx`
- Modify: `app/index.tsx`, `app/compass/[id].tsx`

- [ ] **Step 1: Privacy modal (three-position switch + go dark)**

```tsx
// src/ui/PrivacyModal.tsx
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useCrewStore, type PrivacyMode } from '../state/crewStore';
import { colors } from './theme';

const OPTIONS: Array<{ mode: PrivacyMode; title: string; desc: string }> = [
  { mode: 'live', title: 'Live (background)', desc: 'Broadcast even in your pocket. Radar stays true. Best experience.' },
  { mode: 'open', title: 'Only while app is open', desc: 'Battery-saver. Visible only with Loc8 on screen.' },
  { mode: 'invisible', title: 'Invisible / on-demand', desc: 'You disappear. Show up only when you share or answer a ping.' },
];

export function PrivacyModal({ visible, onClose }: { visible: boolean; onClose(): void }) {
  const privacyMode = useCrewStore((s) => s.privacyMode);
  const setPrivacy = useCrewStore((s) => s.setPrivacy);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={st.wrap}>
        <View style={st.card}>
          <Text style={st.h}>Who can see you?</Text>
          <Text style={st.sub}>Switch anytime. Go dark is one tap.</Text>
          {OPTIONS.map((o) => (
            <Pressable
              key={o.mode}
              style={[st.opt, privacyMode === o.mode && st.optSel]}
              onPress={() => setPrivacy(o.mode)}
            >
              <View style={[st.dot, privacyMode === o.mode && st.dotSel]} />
              <View style={{ flex: 1 }}>
                <Text style={st.optT}>{o.title}</Text>
                <Text style={st.optD}>{o.desc}</Text>
              </View>
            </Pressable>
          ))}
          <Pressable style={st.done} onPress={onClose}><Text style={st.doneT}>Done</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#12141f', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, gap: 10 },
  h: { color: colors.text, fontSize: 19, fontWeight: '800' },
  sub: { color: colors.textDim, fontSize: 13, marginBottom: 6 },
  opt: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder },
  optSel: { borderColor: colors.pink, backgroundColor: 'rgba(255,90,140,0.08)' },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', marginTop: 2 },
  dotSel: { borderColor: colors.pink, backgroundColor: colors.pink },
  optT: { color: colors.text, fontSize: 14, fontWeight: '700' },
  optD: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  done: { backgroundColor: colors.card, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 4, borderWidth: 1, borderColor: colors.cardBorder },
  doneT: { color: colors.text, fontWeight: '700' },
});
```

- [ ] **Step 2: Plus Code share sheet**

```tsx
// src/ui/ShareSheet.tsx
import { Modal, View, Text, Pressable, StyleSheet, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { encodePlusCode } from '../core/plusCodes';
import type { Coordinate } from '../core/types';
import { colors } from './theme';

interface Props {
  visible: boolean;
  title: string;                // e.g. "Maya's exact spot" / "Rally point"
  location: Coordinate | null;
  onClose(): void;
}

export function ShareSheet({ visible, title, location, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const code = location ? encodePlusCode(location.latitude, location.longitude) : '—';

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={st.wrap}>
        <View style={st.card}>
          <Text style={st.h}>{title}</Text>
          <Text style={st.sub}>Plus Code — works offline, free. Shout it or text it.</Text>
          <Text style={st.code}>{code}</Text>
          <Text style={st.hint}>≈ 14m square · plus.codes</Text>
          <Pressable style={st.btn} onPress={copy}>
            <Text style={st.btnT}>{copied ? '✓ Copied' : 'Copy Plus Code'}</Text>
          </Pressable>
          <Pressable
            style={st.btnGhost}
            onPress={() => Share.share({ message: `Find me at ${code} — shared from Loc8` })}
          >
            <Text style={st.btnGhostT}>Share…</Text>
          </Pressable>
          <Pressable style={st.btnGhost} onPress={onClose}><Text style={st.btnGhostT}>Close</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#12141f', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, gap: 10 },
  h: { color: colors.text, fontSize: 19, fontWeight: '800' },
  sub: { color: colors.textDim, fontSize: 13 },
  code: {
    color: colors.teal, fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: 1,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 18, marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  hint: { color: colors.textDim, fontSize: 12, textAlign: 'center' },
  btn: { backgroundColor: colors.pink, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 6 },
  btnT: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnGhost: { borderRadius: 14, padding: 13, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  btnGhostT: { color: colors.text, fontWeight: '700', fontSize: 14 },
});
```

- [ ] **Step 3: Dev scenario menu** (spec §12 scripted demos; `__DEV__` only)

```tsx
// src/ui/DevMenu.tsx
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { getTransport } from '../services/appServices';
import { useCrewStore } from '../state/crewStore';
import { colors } from './theme';

const ACTIONS: Array<{ label: string; run(): void }> = [
  { label: '🌑 Rae goes dark', run: () => getTransport().scenario('goDark', 104) },
  { label: '☀️ Rae comes back', run: () => getTransport().scenario('return', 104) },
  { label: '🏃 Maya approaches you (→ 🎉)', run: () => getTransport().scenario('approach', 101) },
  { label: '🚶 Maya wanders off again', run: () => getTransport().scenario('return', 101) },
  { label: '🪫 My battery low (beacon mode)', run: () => useCrewStore.getState().setBeacon(true) },
  { label: '🔋 Battery ok', run: () => useCrewStore.getState().setBeacon(false) },
];

export function DevMenu({ visible, onClose }: { visible: boolean; onClose(): void }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={st.wrap}>
        <View style={st.card}>
          <Text style={st.h}>🛠 Demo scenarios</Text>
          {ACTIONS.map((a) => (
            <Pressable key={a.label} style={st.row} onPress={() => { a.run(); onClose(); }}>
              <Text style={st.rowT}>{a.label}</Text>
            </Pressable>
          ))}
          <Pressable style={st.row} onPress={onClose}><Text style={[st.rowT, { color: colors.textDim }]}>Close</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 30 },
  card: { backgroundColor: '#12141f', borderRadius: 20, padding: 18, gap: 4, borderWidth: 1, borderColor: colors.cardBorder },
  h: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  row: { paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.cardBorder },
  rowT: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
```

- [ ] **Step 4: Wire FABs + modals into the radar.** In `app/index.tsx`, add state and the FAB column (place the FABs view just above `<CrewSheet />`):

```tsx
// add imports:
import { PrivacyModal } from '../src/ui/PrivacyModal';
import { DevMenu } from '../src/ui/DevMenu';

// inside RadarHome():
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const privacyMode = useCrewStore((s) => s.privacyMode);
  const beaconMode = useCrewStore((s) => s.beaconMode);

// JSX, above <CrewSheet />:
      <View style={st.fabs}>
        <Pressable style={st.fab} onPress={() => { getMeshService().dropRally(); }}>
          <Text style={st.fabT}>🚩</Text>
        </Pressable>
        <Pressable
          style={[st.fab, privacyMode === 'invisible' && st.fabOn]}
          onPress={() => setPrivacyOpen(true)}
        >
          <Text style={st.fabT}>{privacyMode === 'invisible' ? '🚫' : '👁️'}</Text>
        </Pressable>
        {__DEV__ && (
          <Pressable style={st.fab} onPress={() => setDevOpen(true)}>
            <Text style={st.fabT}>🛠</Text>
          </Pressable>
        )}
      </View>
      {beaconMode && (
        <Text style={st.warn}>🪫 Power saver — updating once a minute, you're still findable</Text>
      )}
      <PrivacyModal visible={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <DevMenu visible={devOpen} onClose={() => setDevOpen(false)} />

// styles to add:
  fabs: { position: 'absolute', right: 16, bottom: 300, gap: 12, zIndex: 20 },
  fab: {
    width: 50, height: 50, borderRadius: 16, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center',
  },
  fabOn: { backgroundColor: colors.pink },
  fabT: { fontSize: 20 },
```

Also add `import { useState } from 'react';` if not present.

- [ ] **Step 5: Share button in Compass.** In `app/compass/[id].tsx`, add at the bottom of the normal (arrow) state and the proximity state:

```tsx
// add import + state:
import { ShareSheet } from '../../src/ui/ShareSheet';
const [shareOpen, setShareOpen] = useState(false);

// at the bottom of the component's JSX (outside the three-state block):
      <Pressable style={st.shareBtn} onPress={() => setShareOpen(true)}>
        <Text style={st.shareT}>Share {friend.name}'s spot</Text>
      </Pressable>
      <ShareSheet
        visible={shareOpen}
        title={`${friend.name}'s exact spot`}
        location={friendPos}
        onClose={() => setShareOpen(false)}
      />

// styles:
  shareBtn: {
    marginBottom: 40, borderRadius: 22, borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: 22, paddingVertical: 12,
  },
  shareT: { color: colors.text, fontWeight: '700', fontSize: 14 },
```

- [ ] **Step 6: Manual verify** — 🚩 drops a labeled pin visible on radar; second 🚩 replaces it (banner shows dropper); 👁 switches modes and invisible turns the FAB pink/🚫 and stops your broadcasts (check: privacy invisible → friends still move, session CTA unaffected); 🛠 scenarios all work: Rae goes dark → blip fades to ghost with "last seen"; battery beacon shows the banner; Compass share shows a valid-looking Plus Code that copies.

- [ ] **Step 7: Run full suite** — `npx jest` → PASS

- [ ] **Step 8: Commit**

```bash
git add src app && git commit -m "feat: rally pin, privacy modal with go-dark, plus-code share sheet, dev scenario menu"
```

---

### Task 17: Ping UX round-trip (banner + notification deep-link)

**Files:**
- Create: `src/services/notifications.ts`
- Modify: `src/state/crewStore.ts` (ping metadata), `app/index.tsx`, `app/_layout.tsx`

- [ ] **Step 1: Notification helper with in-context permission ask** (spec §3: deferred until first ping)

```ts
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
```

- [ ] **Step 2: Extend store banner to carry a target.** In `src/state/crewStore.ts`:

Change the `banner` field and setter to:

```ts
// state:
  banner: { text: string; friendId?: number } | null;
// action signature:
  setBanner(b: { text: string; friendId?: number } | null): void;
// implementation:
  setBanner: (banner) => set({ banner }),
```

Update `applyPacket`'s ping/rally branches to structured banners:

```ts
    } else if (p.type === 'rally') {
      const current = get().rallyPin;
      if (!current || p.timestampSec > current.atSec) {
        set({
          rallyPin: { latitude: p.latitude, longitude: p.longitude, droppedById: p.senderId, atSec: p.timestampSec },
          banner: { text: `🚩 ${get().friends[p.senderId]?.name ?? 'Someone'} dropped a rally pin` },
        });
      }
    } else if (p.type === 'pingWhere' || p.type === 'pingComeFind') {
      const name = get().friends[p.senderId]?.name ?? 'Someone';
      set({
        banner: {
          text: p.type === 'pingWhere' ? `📍 ${name} asked: where are you?` : `📣 ${name}: come find me!`,
          friendId: p.senderId,
        },
      });
    }
```

Fix the session-expiry banner in `src/services/meshService.ts` to the structured form:

```ts
        s.setBanner({ text: '⏳ Session ended — you stopped broadcasting' });
```

And update the two existing test expectations to the structured shape:

```ts
// src/state/__tests__/crewStore.test.ts — ping test:
    expect(useCrewStore.getState().banner?.text).toMatch(/Maya/);

// src/services/__tests__/meshService.test.ts — session expiry test:
    expect(useCrewStore.getState().banner?.text).toMatch(/session ended/i);
```

Run `npx jest` and fix any other `banner` usages (radar home reads `banner.text` — next step).

- [ ] **Step 3: Tappable banner + notification hookup on the radar.** In `app/index.tsx`:

```tsx
// replace the banner render with a tappable version:
      {banner && (
        <Pressable
          style={st.banner}
          onPress={() => {
            if (banner.friendId) router.push(`/compass/${banner.friendId}`);
            setBanner(null);
          }}
        >
          <Text style={st.bannerText}>{banner.text}{banner.friendId ? '  →' : ''}</Text>
        </Pressable>
      )}
```

Also fire a local notification when a ping banner appears (so pings land even off this screen):

```tsx
// add import:
import { notifyPing } from '../src/services/notifications';
// extend the banner effect:
  useEffect(() => {
    if (banner) {
      if (banner.friendId) notifyPing('Loc8', banner.text, banner.friendId);
      const t = setTimeout(() => setBanner(null), 5000);
      return () => clearTimeout(t);
    }
  }, [banner]);
```

- [ ] **Step 4: Notification tap → deep link.** In `app/_layout.tsx`:

```tsx
// add imports:
import * as Notifications from 'expo-notifications';
// inside RootLayout(), add:
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const url = resp.notification.request.content.data?.url as string | undefined;
      if (url) router.push(url as never);
    });
    return () => sub.remove();
  }, []);
```

- [ ] **Step 5: Manual verify the full round-trip** — Ping Maya "Come find me" → next sim tick Maya's mode flips to approach and her fresh packets flow (watch the radar); ping a **dark** Rae "Where are you?" → she answers with one fresh position despite being dark (spec §5 ✓). Ping banner is tappable → lands in Compass. First ping asks notification permission in context.

- [ ] **Step 6: Run full suite** — `npx jest` → PASS

- [ ] **Step 7: Commit**

```bash
git add src app && git commit -m "feat: ping round-trip with tappable banners and notification deep-links"
```

---

### Task 18: Real battery guardrail, session-expired UX, README, final checklist

**Files:**
- Create: `src/hooks/useBatteryGuard.ts`, `README.md`
- Modify: `app/index.tsx`

- [ ] **Step 1: Battery guard hook (real battery, spec §5)**

```ts
// src/hooks/useBatteryGuard.ts
import { useEffect } from 'react';
import * as Battery from 'expo-battery';
import { useCrewStore } from '../state/crewStore';

const LOW_BATTERY = 0.15;

/** Auto-enables beacon mode below 15% battery (spec §5). Dev menu can still force it. */
export function useBatteryGuard(): void {
  const setBeacon = useCrewStore((s) => s.setBeacon);
  const setBanner = useCrewStore((s) => s.setBanner);

  useEffect(() => {
    let sub: Battery.Subscription | null = null;
    (async () => {
      const level = await Battery.getBatteryLevelAsync();
      if (level >= 0 && level < LOW_BATTERY) {
        setBeacon(true);
        setBanner({ text: '🪫 Power saver on — updating once a minute, still findable' });
      }
      sub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
        if (batteryLevel < LOW_BATTERY) setBeacon(true);
      });
    })();
    return () => sub?.remove();
  }, []);
}
```

Wire into `app/index.tsx`: `import { useBatteryGuard } from '../src/hooks/useBatteryGuard';` and call `useBatteryGuard();` inside `RadarHome()`.

- [ ] **Step 2: Session-expired restart affordance.** Already handled: expiry sets the banner (meshService) and the "Start a 6h session" CTA reappears because `sessionEndsAtSec` is null. Verify that flow: set a short session (in dev, `startSession(0.01)` ≈ 36s via a temporary dev-menu entry or just wait) → banner fires → CTA returns.

- [ ] **Step 3: README**

```markdown
# Loc8

Find your crew at a festival when the data's dead — a live Bluetooth-mesh radar
that works with zero signal.

**v1 = simulated prototype.** The full experience (Radar → Compass → Proximity → 🎉,
pings, rally pins, sessions, privacy modes, Plus-Code sharing) runs against a
deterministic `SimulatedTransport`. v2 swaps in a real BLE mesh behind the same
`LocationTransport` interface — no UI changes.

- Spec: `docs/superpowers/specs/2026-07-06-loc8-design.md`
- Plan: `docs/superpowers/plans/2026-07-06-loc8-v1-prototype.md`
- HTML design prototype: `prototype/loc8-prototype.html`

## Run

```bash
npm install
npx expo start        # Expo Go or a dev client
npx jest              # test suite
```

## Demo

Use the 🛠 FAB (dev builds) to run scripted scenarios: friend goes dark,
friend approaches you (ends in the found-each-other celebration), low-battery
beacon mode.
```

- [ ] **Step 4: Full manual test checklist** — run through every §12 item and check off:

```
[ ] Fresh install → onboarding: profile, color, location priming, OS prompt
[ ] Deny location → recovery screen with Settings link; app falls back to demo origin
[ ] Radar: 4 blips moving, freshness ticking, rings labeled 75m/150m/1.5km+
[ ] Sam shows "via Maya 🔗" relay label
[ ] 🛠 Rae goes dark → blip fades to ghost "last seen Xm ago"; crew sheet says went dark
[ ] MESH badge count drops when Rae is dark
[ ] Start 6h session → CTA disappears; Crew screen shows countdown; +2h extends; End stops
[ ] Session expiry → banner + CTA returns
[ ] Find Maya → compass arrow + distance; rotate phone (device) → arrow stays on target, smooth
[ ] 🛠 Maya approaches → warmer → proximity "look around 👀" with haptics → 🎉 exactly once
[ ] Ping Rae (dark) "Where are you?" → she answers one fresh position
[ ] Ping Maya "Come find me" → she approaches; banner tappable → compass
[ ] First ping asks notification permission in context; notification tap deep-links
[ ] 🚩 drops pin labeled with dropper + distance; drop again → replaces (one-pin rule)
[ ] 👁 privacy: invisible → own broadcasts stop (FAB shows 🚫); back to live resumes
[ ] Compass "Share" → valid Plus Code; Copy works; Share sheet opens
[ ] 🛠 battery low → beacon banner shows
[ ] `npx jest` → all suites green
```

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "feat: battery guardrail, README, v1 checklist complete"
```

---

## Self-review results (spec §12 coverage)

| Spec §12 item | Task |
|---|---|
| Onboarding profile + permission priming | 11 |
| Radar with seeded crew, freshness, ghost, relay labels, piecewise scaling | 3, 7, 12 |
| Compass smoothed arrow + warmth | 14 |
| Proximity + 🎉 celebration | 15 |
| Ping both directions + notification deep-link | 17 |
| Rally pin one-per-crew rule | 8 (store), 16 (UI) |
| Crew screen session lifecycle + mocked QR/link | 13 |
| Privacy switch + go dark + ping-answer for invisible | 8 (sim), 16 (UI), 17 |
| Battery beacon mode | 9 (service), 16 (dev), 18 (real) |
| Plus Code share sheet | 4, 16 |
| `LocationTransport` + deterministic seeds + scripted scenarios | 7, 8, 16 |
| Test suite green (geoMath, codec, trust, transport, store, service) | 2–9 |

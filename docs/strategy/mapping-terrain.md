# Mapping the Terrain (offline)

## The core constraint

Offline = no live map tiles (Google/Apple need internet). So every map must be **pre-cached on the device before signal dies**, or generated from data already present. This shapes each product.

## Per product

- **Consumer (commercial) — usually NO map.** The radar needs zero map data: it's pure geometry (your GPS + friend's GPS → bearing + distance → a dot on a circle). That's WHY the radar exists — it sidesteps the offline-map problem. Optional upgrade: a cached street map (pre-download the festival area via MapLibre + OpenStreetMap on wifi, works offline) for people who want streets. Nice-to-have, v2/v3 — not required.

- **Guard & Command — a real venue map.** Security needs named zones (Gate C / Bar / Car Park) that aren't on Google Maps. Approach (standard, fully offline):
  1. Operator provides their **site plan / floor plan** (festivals, stadiums, malls, ships all have one).
  2. **Geo-reference it** — a one-time setup: drag the plan's corners onto their real-world GPS coordinates so the image is pinned to the earth; then any guard's GPS lat/long maps to an exact pixel on their plan.
  3. **Draw zones** (Gate C, Bar…) as labelled areas — a "map builder" in Command.
  4. **Cache on-device** — one venue = a tiny file (image + zone shapes), works with zero signal.

  This is straightforward OUTDOORS: GPS plots people onto the geo-referenced plan.

## The hard bit — indoor & multi-floor (honest)

GPS barely works indoors / not across floors (mall, hospital, cruise ship). Plotting people indoors needs a different positioning source:

- **BLE/LoRa anchors doubling as position beacons** — the same anchor hardware that extends the mesh ALSO lets a phone estimate its position from anchor signal strength (indoor RTLS). Anchors solve coverage AND indoor mapping — earn their keep twice.
- Simpler fallback: **zone-level** location ("Guard 07 is in the Car Park") instead of pinpoint — often enough for ops.

Indoor precision is the FRONTIER, unlocked by the anchor hardware (later phase), not a dead end.

## Feasibility tiering

| Product / setting | Map approach | Offline-ready | Difficulty |
| --- | --- | --- | --- |
| Consumer | Radar — no map | yes, built-in | done |
| Consumer optional map view | cached OSM tiles | yes (pre-download) | easy |
| Guard/Command outdoors (festival, stadium) | geo-referenced site plan + zones, cached | yes | straightforward |
| Guard/Command indoor/multi-floor (mall, ship, hospital) | anchors for indoor position, or zone-level | yes (with anchors) | frontier |

## Tech stack

MapLibre GL (open-source, offline vector maps) + OpenStreetMap base + geo-referenced raster overlay for the operator's site plan + GeoJSON for zones. All offline-capable; none exotic.

## Bottom line

Possible for all: consumer dodges maps with the radar; outdoor ops uses a cached geo-referenced site plan (easy, one-time setup); indoor precision is the frontier the anchors solve. No live internet map needed anywhere.

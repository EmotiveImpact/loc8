# Loc8 Ops — Security & Response Vertical

*Possibly the strongest enterprise wedge: acute safety-critical pain, regulated spend, consolidated buyers, recurring per-guard revenue — and the offline mesh is a hard differentiator vs. everything on the market.*

---

## The gap
Security teams coordinate with tools that each miss something:

| Today | Does | Misses |
|---|---|---|
| Two-way radios (Motorola) | voice | **no location** — "where are you?" is a guess |
| Guard-tour systems (GuardTek, Silvertrac, Trackforce) | scan NFC checkpoints | not live, backward-looking |
| Lone-worker devices (Blackline, SoloProtect) | GPS + SOS + fall detect | **cellular/satellite-dependent** (dies in the dead zones security works in), per-device cost, no team map |
| RTLS beacons (hospitals/warehouses) | indoor tracking | fixed, costly, single-facility |

**Nobody fills:** a cheap, phone-based, **live team map + SOS + muster that keeps working when the network is congested, jammed, or dead** — exactly when security needs it most. That's the wedge. Lead with *"works when the cell dies,"* not "security software" (that market has incumbents).

## Product architecture — separate apps, one engine
- **Loc8 Guard** — the guard's phone app (team map, one-tap SOS, dispatch-to-here, lone-worker check-in).
- **Loc8 Command** — control-room web/tablet dashboard (all guards live, incident feed, status tiles, roster, muster, audit log).
- **Same mesh core** as the consumer app (the `LocationTransport` + protocol we built). Consumer "Loc8" and enterprise "Loc8 Ops" are distinct products on one platform.

## Who buys
- **Primary wedge → the security/guarding firm** (Securitas, Allied Universal, G4S + thousands of regional firms). Sell once → rolls across **all** their client sites. Consolidated buyer, per-guard recurring SaaS. Same "10 logos, thousands of sites" pattern as cruise/Vail.
- **Secondary → the venue** (nightclub, stadium, mall, hospital, campus) for **in-house** teams, or to put venue stewards + hired firm + medical on one coordinated layer with a shared command view.
- **Users = guards**, consented as a condition of the shift (that's what makes locating them lawful — employees on duty, not surveilled civilians). Permissioned layers at multi-team events.

## Use cases
**Universal:** live team map · nearest-responder dispatch · one-tap SOS · silent duress · lone-worker auto check-in / man-down · muster & headcount on evacuation · coverage-gap view · coordinated converge · **works when comms fail.**

**By setting:** nightclubs/bars (ejections, fights, find the manager, basement dead zones, silent panic) · festivals/concerts (congested cell, huge site, stewards+security+medical, lost kids, surges) · stadiums/arenas (evacuation, sections, ejections) · malls/retail (loss prevention, night lone-worker) · corporate campuses/towers (patrols, after-hours lone worker, evac) · hospitals (code response, dead-zone wings) · construction/warehouses/ports (huge footprints, man-down) · universities (campus security, safety escort) · hotels/resorts · airports/stations · close protection · prisons/secure sites (specialised, hard entry).

## Pricing & size (directional)
- **Model:** per-guard SaaS, ~£8–15/guard/month, + optional venue anchors for guaranteed coverage.
- **Rough market:** UK alone has ~350k+ licensed security operatives; globally millions. At £120/guard/yr, even **100k guards = £12M/yr ARR.** Land a few national guarding firms and this dwarfs the festival line.
- **Why it converts:** regulated lone-worker duty-of-care (legal obligation UK/EU/AU), clear ROI (faster response, fewer incidents, liability/insurance reduction), and it doubles as the ops layer inside festivals/cruise/parks.

## Honest competitive note
Not first to "security team software" (Trackforce/GuardTek, Blackline/SoloProtect, Motorola). The defensible wedge is the combination none of them have: **phone-based · no special hardware · live team map + SOS · network-independent (works when the cell dies).**

## Sequencing
Fits *after* the consumer/mesh proof but is a strong parallel enterprise track: the ops console is largely the same build as the venue/festival ops module. Pilot with one guarding firm or one nightclub group → case study → national firm.

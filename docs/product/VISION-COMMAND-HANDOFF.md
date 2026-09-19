# Loc8 Vision and Command - Cross-Product Handoff

**Status:** Template for the Vision design conversation  
**Updated:** 2026-07-23

Use this document after the Vision chat has written its own product blueprint.
It identifies what the two product tracks must agree without forcing their
interfaces to look identical.

## Product boundaries

### Command owns

- high-information site overview;
- 2D/3D digital twin;
- incident ownership and coordination;
- team, coverage, muster and asset workspaces;
- historical timeline and audit review;
- site commissioning and configuration.

### Vision owns

- glanceable live status;
- hands-free navigation;
- selected person/incident cues;
- urgent alerts and acknowledgements;
- voice-led field actions;
- minimal safe information in the wearer's view.

### Guard owns

- responder status;
- SOS and duress;
- assignment acceptance;
- one-handed field workflows;
- phone fallback when glasses are unavailable.

## Shared contract to define

The Vision conversation should return decisions for:

- supported glasses/device families;
- operating-system and SDK constraints;
- field of view and safe visual zones;
- voice and physical input;
- battery and connectivity assumptions;
- whether a Guard phone acts as the companion/bridge;
- offline behaviour;
- incident, person, route and alert payloads;
- acknowledgement and audit events;
- privacy and role constraints;
- handoff between Command, Guard and Vision.

## Shared operational objects

Both tracks should use the same stable identities for:

- site;
- level;
- space/room;
- zone;
- portal/door;
- route;
- person;
- team;
- incident;
- search sector;
- muster point;
- Gateway/anchor/camera/asset;
- command action;
- audit event.

## Handoff examples

1. Command assigns Guard 12 to a medical incident. Guard and Vision receive the
   same assignment ID, location, route and priority.
2. Vision wearer acknowledges. Command records the responder state and audit
   event immediately.
3. Command selects a missing person and pushes a last-known route to the field.
   Vision shows the next safe navigation cue; Guard retains the detailed card.
4. Vision reports "sector clear." Command updates the shared search sector and
   timeline.
5. Connectivity drops. Vision and Guard show freshness and queue authorised
   actions; Command reconciles them when the transport returns.

## Design rule

Share tokens and identity, not screen layouts. Command is dense and
comparative. Vision is sparse and glanceable. A successful handoff preserves
meaning while changing presentation.

## Deliverables requested from the Vision chat

Ask the Vision chat to produce:

1. `VISION-PRODUCT-BLUEPRINT.md`
2. `VISION-VISUAL-FINISH.md`
3. supported-device feasibility table;
4. glasses/phone/Gateway connectivity diagram;
5. event and action contract;
6. ten primary operational scenarios;
7. safety, privacy and failure-state rules;
8. phased implementation plan;
9. explicit open decisions and hardware dependencies;
10. a short section completing this Command/Vision handoff.

## Copy/paste request for the Vision chat

> Please organise and document the Loc8 Vision/glasses product as thoroughly as
> Command has now been documented. Create a canonical product blueprint, visual
> finish standard, supported-device feasibility table, connectivity
> architecture, shared event/action contract, primary scenarios, safety/privacy
> rules, phased build plan, acceptance gates and open decisions. Treat Vision
> as its own glanceable hands-free application sharing the Loc8 platform, not as
> the Command desktop UI placed in glasses. Then reconcile your decisions with
> `docs/product/COMMAND-PRODUCT-BLUEPRINT.md` and complete
> `docs/product/VISION-COMMAND-HANDOFF.md`. Record any shared work in
> `docs/MASTER-CHECKLIST.md`.

## Reconciliation checklist

When both blueprints exist:

- remove conflicting terms;
- choose one identity/event schema;
- choose ownership for each action;
- align status, priority and confidence semantics;
- align degraded/offline behaviour;
- align role permissions and audit requirements;
- agree notification precedence;
- define deep links/handoffs among Command, Guard and Vision;
- add shared work to the master checklist.

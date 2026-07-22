# Phase 1 Commissioning design QA

**Source visual truth:** `docs/product/evidence/phase-01-source-concept.png`

**Final implementation screenshot:**
`docs/product/evidence/phase-01-command-commissioning-900-final.png`

**Additional responsive evidence:**

- `docs/product/evidence/phase-01-command-commissioning-desktop-final.png`
  (1440×1000)
- `docs/product/evidence/phase-01-command-commissioning-1024.png`
  (1024×768)
- `docs/product/evidence/phase-01-command-commissioning-mobile-r2.png`
  (390×844)

**Comparison viewport:** 900×900 CSS pixels, device scale factor 1. Source and
implementation are both 900×900 pixels; no density normalization was required.

**State:** browser-local editable draft, Ground Floor selected, central
navigable space selected, four floor controls visible. The source uses generic
"Main hall" copy; the implementation uses the versioned synthetic venue's
stable `space.ground.corridor` object. This is the same interaction state, not a
claim that the synthetic venue is the source building.

## Full-view comparison evidence

The source and implementation were opened together at their original 900×900
resolution after each layout iteration. The final implementation retains the
source hierarchy: venue/version state, floor selection, floor-plan geometry,
clear selected object, connector/exit cues and an adjacent object inspector.
It intentionally uses the established dark Loc8 Command tokens, Sora/Unbounded/
Space Mono hierarchy, navigation and status language instead of copying the
concept's neutral exploratory canvas. This visual-system change was fixed by the
product brief before implementation.

No external image asset exists in the source. The plan is rendered from actual
venue-package polygons and route nodes rather than replacing missing imagery
with a decorative approximation. Existing Command stroke icons are reused.

## Focused-region evidence

A separate crop was not required: at original 900-pixel density the complete
source's meaningful map/inspector region and the final implementation's map,
floor rail and inspector are legible in one comparison. The 1440×1000 capture
was additionally inspected for fine label, field, route-control, border and
spacing fidelity. The 1024×768 and 390×844 captures were inspected for wrapping,
overflow and control reachability.

## Findings and comparison history

### Iteration 1 — blocked

- **[P1] Tablet navigation stacked every global section vertically.** At 900px,
  `.navitem` retained `width: 100%`, consuming the upper third of the viewport
  and pushing the core experience below the fold. Fixed by making the existing
  Command navigation a single horizontally scrollable row at the breakpoint.
- **[P2] Plan labels collided inside narrow connector and exit spaces.** The
  implementation used full room names where the concept used short functional
  labels. Fixed with stable compact labels (`STAIR`, `LIFT`, `RAMP`, `EXIT W`,
  `EXIT E`) derived from semantic objects.
- **[P1] Mobile Command top bar broke into narrow word columns and clipped the
  clock.** Fixed with a wrapping first row and a full-width site row. The final
  390px measurement has `scrollWidth === innerWidth`.

Post-fix evidence:
`phase-01-command-commissioning-900-r2.png` and
`phase-01-command-commissioning-mobile-r2.png`.

### Iteration 2 — blocked

- **[P2] The 900px inspector fell beneath the map while the source kept the
  selected-object panel adjacent.** Fixed with measured `170px / 454px / 230px`
  tracks at the 900px viewport. The map and inspector now share the same top
  coordinate and no document-level horizontal overflow exists.

Post-fix evidence: `phase-01-command-commissioning-900-final.png`.

### Final pass

No actionable P0, P1 or P2 findings remain.

- **Fonts and typography:** established Command families, weights and machine-
  data hierarchy are consistent; no broken wrapping remains at measured sizes.
- **Spacing and layout:** the source hierarchy is retained; desktop, tablet and
  mobile tracks have no document-level overflow. The 1440×1000 desktop content
  fits the viewport.
- **Colors and tokens:** existing Command background, line, information,
  caution, success and alert tokens are used consistently; selected state and
  publication state include text, not colour alone.
- **Image and asset fidelity:** no source image assets were omitted or
  substituted. Domain geometry remains sharp vector data at all sizes; existing
  Command icons retain one stroke family.
- **Copy and content:** the UI explicitly distinguishes synthetic geometry,
  browser-local state, unsigned publication and absent Gateway/physical proof.
- **Interactions/accessibility:** floor selection, object selection, name/kind
  edit, geometry movement, add room/zone, route profile, closure, local-demo
  creation, successor draft and reset were exercised. Labels, semantic buttons,
  focus styling, keyboard-selectable polygons and reduced-motion rules exist.
- **Browser console:** zero warnings/errors after the final desktop and 1024px
  interaction passes.

## Open questions

- A second field operator has not usability-tested the terminology or workflow.
- A permissioned real plan, physical control-point registration and Gateway
  authority remain future evidence, not design-QA gaps in this synthetic slice.

## Follow-up polish

- **[P3]** At narrow widths, the established seven-item global Command
  navigation scrolls horizontally without an explicit overflow affordance. It
  remains keyboard/pointer reachable and does not block the commissioning task.

## Implementation checklist

- [x] Correct P0/P1/P2 visual and responsive findings.
- [x] Exercise primary map-builder and publication interactions.
- [x] Inspect desktop, tablet and mobile browser renders.
- [x] Check browser console and document-level overflow.
- [x] Preserve the evidence/claim boundary in visible copy.

**final result: passed**

---

# Phase 2 Gateway simulation design QA

**Source visual truth:** `docs/product/evidence/phase-01-source-concept.png` and
the preserved `Where data lives` state in the selected concept HTML.

**Final implementation evidence:**

- `docs/product/evidence/phase-02-gateway-simulation-desktop.jpg`
- `docs/product/evidence/phase-02-gateway-simulation-900.jpg`
- `docs/product/evidence/phase-02-gateway-simulation-mobile.jpg`
- `docs/product/evidence/phase-02-visual-comparison.jpg`

**Comparison viewport:** 900×900 CSS pixels, device scale factor 1.

**State:** an unsigned `local-demo` Command package has been explicitly copied
to the browser-local Gateway simulator; both versions are `map.synthetic.local.002`
and reconciliation shows `IN SYNC`.

## Visual and structural comparison

The selected concept established five product views and a `Where data lives`
model: Command/Builder creates a versioned package; an on-site Gateway owns the
authoritative production copy; phones and Command hold offline cached views;
cloud is optional. Its saved 900px screenshot preserves the visual target, and
the preserved interactive HTML's `Where data lives` DOM was inspected in that
exact state.

The styled standalone host for that alternate concept state was not preserved,
so the side-by-side evidence uses the saved Map Builder screenshot for visual
system comparison and the original HTML for structural/copy comparison. The
implementation retains the product-view tab, left-to-right data flow, adjacent
truth panel and explicit version/status language. It uses the established Loc8
Command design tokens and existing stroke icons, as required by the product
brief.

## Findings

### Functional truth boundary — passed

- Draft installation is disabled.
- `local-demo` installation, reload, successor-draft reconciliation, removal
  and reinstall were exercised in the real browser.
- Every relevant surface says `simulation-only`, browser localStorage or
  simulated Gateway. No control says deploy, publish, signed or authoritative.
- Production gaps are visible as separate provider, durable-store and physical
  evidence gates.

### Responsive and visual inspection — passed

- At 1440×1000, 900×900 and 390×844, document width equalled viewport width.
- At desktop/tablet width, the phone → Command → simulated Gateway relationship
  stays in one readable row; mobile converts it to a vertical sequence.
- Header actions wrap without collision; package IDs and machine data wrap or
  truncate inside their own cards rather than expanding the page.
- Existing typography, line, information, caution, success and alert tokens are
  consistent with the Phase 1 Commissioning screen.
- No missing image asset exists; the UI uses existing Command icon components
  and domain data rather than decorative placeholders.
- Final browser logs contained development info/debug output only—no warning or
  error.

No actionable P0, P1 or P2 finding remains. The known P3 horizontally
scrollable global navigation affordance at narrow widths is unchanged from
Phase 1 and does not block the Gateway task.

## Open external questions

- A second operator has not usability-tested the data-ownership terminology.
- A real Gateway, signing provider and durable storage engine do not yet exist;
  visual clarity does not close those product-evidence gates.

## Phase 2 checklist

- [x] Compare against the selected building-system concept.
- [x] Exercise primary install/reload/reconcile/remove controls.
- [x] Inspect desktop, tablet and mobile renders.
- [x] Verify document overflow and browser logs.
- [x] Keep simulated and production states visibly distinct.
- [x] Correct all P0/P1/P2 findings.

**Phase 2 final result: passed**

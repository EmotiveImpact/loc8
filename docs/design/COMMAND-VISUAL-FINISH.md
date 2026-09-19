# Loc8 Command - Visual Finish Standard

**Status:** Required design direction  
**Updated:** 2026-07-23  
**Purpose:** Define the missing "solid, matte, finished software" quality

---

## 1. Honest assessment

The current web prototype is the best combined **product structure** produced
so far. It successfully combines:

- the spatial site view;
- persistent operational modes;
- the strong incident inspector;
- status, coverage and responder information;
- a timeline;
- natural-language command;
- 2D/3D operational controls.

It is not yet the best combined **visual finish**. The reference images remain
stronger in:

- visual hierarchy;
- material depth;
- typography scale and spacing;
- controlled information density;
- separation of background, glass and solid control surfaces;
- restraint in borders, lines and accent colours;
- atmospheric integration of the site model and interface.

The prototype should therefore be treated as the interaction blueprint, while
the next approved image is treated as the visual source of truth.

## 2. What "matte software" means

The desired finish is not literal photographic texture. It is the cumulative
effect of a disciplined material system:

- near-black surfaces with small luminance differences;
- broad, soft shadows instead of sharp browser-card shadows;
- low-contrast borders used only to define important edges;
- subtle noise to prevent large dark areas looking digitally flat;
- restrained highlights with no glossy white streaks;
- a small number of depth levels;
- crisp text and icons;
- semantic colour used for state, not decoration;
- enough empty space around high-priority information;
- panels that feel anchored to the workstation, not floating web cards.

## 3. Why generated images look more finished

Generated concept images benefit from global art direction: lighting, depth,
composition, typography and atmosphere are solved as one picture. Code is
assembled from independent boxes, so default CSS often reveals:

- uniform rectangles;
- repeated one-pixel borders;
- evenly distributed padding;
- excessive corner radius;
- generic component proportions;
- flat backgrounds;
- every label receiving similar visual weight.

The gap is bridged by extracting measurable rules from the image and building
those rules into tokens and components. It is not bridged by adding random
textures after the layout is finished.

## 4. Material recipe

### Depth levels

Use no more than five primary levels:

| Level | Purpose | Character |
|---|---|---|
| 0 | Application void | Very dark blue-black, nearly flat |
| 1 | Fixed frame/rail | Solid matte graphite |
| 2 | Working panel | Slightly lighter graphite with soft inner lift |
| 3 | Selected/active surface | Controlled blue-grey lift |
| 4 | Critical overlay | Highest contrast, reserved for active work |

### Surface construction

Each surface may combine:

- opaque or nearly opaque background;
- 1-2% monochrome noise asset;
- one subtle top/left inner highlight;
- one low-opacity border;
- a large, soft outer shadow;
- optional restrained backdrop blur only where the underlying map must remain
  perceptible.

Avoid layering blur on every panel. Too much transparency makes the product
look like a glassmorphism website rather than operational software.

### Corners

- Main fixed frames: 0-4 px.
- Tool groups and controls: 4-7 px.
- Floating incident/mission panels: 8-12 px where the reference supports it.
- Pills only for true status, filters or compact segmented controls.

Repeated large rounded cards are not the Loc8 Command language.

## 5. Colour system

The original Loc8 operational palette remains the preferred base.

| Role | Direction |
|---|---|
| Application background | Blue-black / charcoal |
| Primary surface | Matte graphite |
| Raised surface | Cool dark slate |
| Primary text | Soft off-white |
| Secondary text | Cool grey |
| Live / safe / available | Loc8 mint |
| Warning / degraded | Amber |
| Critical / medical / SOS | Controlled red |
| Selected / informational | Cool blue |

Colour must be load-bearing. A green model, green borders, green labels and
green controls at the same time destroy its meaning. Keep the site geometry
neutral; apply colour to people, routes, incidents, coverage and selected
objects.

## 6. Typography

Use three jobs, not one font everywhere:

1. **Display/identity** - compact, engineered headings.
2. **Interface/body** - highly readable operational copy.
3. **Telemetry** - monospaced times, IDs, distances and confidence.

The coded interface must match the reference's optical scale, not merely its
nominal CSS size. Key incident names and mission states should be decisively
larger. Metadata should become quieter through size, weight and contrast, not
through extreme smallness.

## 7. Component strategy

Component libraries can accelerate behaviour, accessibility and consistency,
but none will supply the Loc8 finish automatically.

### Recommended approach

- Use accessible unstyled/headless primitives for dialogs, menus, tooltips,
  tabs and focus management.
- Build a small Loc8 Command component system on top.
- Keep the current icon library if its stroke language remains consistent.
- Use Storybook or an equivalent component workbench to review every state.
- Store material, colour, typography, spacing, radius, shadow and motion values
  as tokens.

### Suitable primitive categories

- Radix UI or React Aria for accessible web behaviour.
- Floating UI for positioned controls.
- TanStack Table/Virtual for dense operational lists where needed.
- React Three Fiber/Three.js for the web spatial canvas.

Do not import a styled dashboard kit and attempt to recolour it. That usually
preserves the generic HTML/SaaS anatomy the design is trying to escape.

## 8. Texture and asset policy

### Generate or author assets for:

- a seamless subtle monochrome noise tile;
- restrained environmental backplates where a real site model is unavailable;
- map/terrain material references;
- product marketing and concept presentation.

### Do not use generated raster textures for:

- panel borders;
- buttons;
- text containers;
- critical state controls;
- anything whose dimensions must respond dynamically.

UI materials should remain CSS/canvas-driven so they scale, theme and remain
accessible. Texture supports the material; it should not be the material.

## 9. 3D finish

The 3D canvas needs its own art direction:

- neutral physically based materials;
- ambient occlusion or contact shadow;
- controlled environment lighting;
- depth cue/fog;
- anti-aliasing;
- strong selected-object outline or halo;
- simplified geometry beyond the operational focus;
- semantic overlays rendered above the model;
- smooth but brief camera transitions;
- a coherent north/up orientation.

For real venues, geometry quality matters more than decorative texture. Room,
portal, stair, floor and route identities must remain operationally selectable.

## 10. Motion

Motion should communicate state:

- 120-180 ms for control state;
- 180-260 ms for panels;
- 300-500 ms for map camera transitions;
- slow, subtle pulse only for genuinely live or unresolved state.

Avoid constant decorative animation. A control-room product must feel calm
until something requires attention.

## 11. The fidelity workflow

The reliable bridge from image to code is:

1. Choose one approved visual master at the target desktop resolution.
2. Mark the exact grid, panel widths and persistent regions.
3. Measure typography, spacing, radius, colour and luminance relationships.
4. Build the material tokens and primitive components first.
5. Rebuild only the Live Site screen.
6. Capture it at the same viewport and state as the source.
7. Place source and implementation together and judge visible differences.
8. Fix hierarchy and material differences before adding more screens.
9. Expand the approved system to the other modes/workspaces.
10. Repeat the same comparison at tablet breakpoints.

The current prototype expanded functionality before completing step 5. The
next pass should reverse that: finish one screen completely, then propagate.

## 12. Visual acceptance checklist

- Does the interface read as one instrument rather than a page of cards?
- Are there only a few clear depth levels?
- Is the site model neutral until operational state colours it?
- Is the highest-priority situation obvious within one second?
- Do panels feel solid without becoming heavy?
- Are critical actions visually distinct from secondary controls?
- Are typography and spacing visibly faithful to the approved image?
- Does the design remain convincing with realistic dense content?
- Is every semantic colour used consistently?
- Does the same material language survive at 1440x1024 and larger control-room
  displays?

## 13. Immediate design decision

Do not polish every prototype workspace independently. First create three
image-quality alternatives for the same Live Site state, based on the strongest
reference screens and current interaction anatomy. Choose one. That image
becomes the visual master for code.


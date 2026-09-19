# Loc8 Command Digital Twin — Build Prompt

Create a polished, working desktop HTML prototype for Loc8 Command using the two latest approved 3D Command concepts as visual targets.

The output must contain four interactive demonstrations inside one isolated prototype:

1. **Fusion — Live Site:** the best combined everyday Command view, using the large cinematic site canvas and site-wide layers from the search-and-rescue concept, the clean exploded-floor legibility from the medical concept, and a restrained contextual incident panel.
2. **Fusion — Investigation:** the best combined focused workflow, using the detailed floor cutaway, last-known trail, search area, cameras, nearby responders, substantial investigation panel and timeline.
3. **Person Search Reference:** a close working interpretation of the generated Nia Patel person-search design.
4. **Search & Rescue Reference:** a close working interpretation of the generated Sector C search-and-rescue design.

All four demonstrations must use the same shared mock operational state and the same interactive venue engine. The app must support:

- 2D bird's-eye, 3D site, exploded-floor and focused-floor views.
- Floor selection: ALL, L3, L2, L1 and G.
- Layer toggles for people, routes/trails, coverage, cameras, search sectors, crowd and muster.
- Clickable incidents, people, teams and venue areas.
- Contextual detail panels that change with selection.
- Working dispatch/search actions with visible state changes.
- A usable activity timeline.
- A natural-language Command field with realistic canned responses.
- Preservation of selected object, floor, layers and time position when changing the camera view.

Visual direction:

- The 3D venue is the primary operating surface and occupies roughly 65–75% of the screen.
- Avoid a dashboard of equal cards. Use contextual panes, open sections and restrained dividers.
- Preserve the existing Loc8 palette: `#06070D` near-black, `#46E0A0` mint, `#FFB43A` amber, `#FF4053` incident red, `#7AA2FF` informational blue and white typography.
- Use condensed industrial headings, clear body typography and monospaced telemetry.
- Keep the product serious, calm and operational rather than cyberpunk.
- Retain the privacy model: named individual locations represent on-duty staff or an incident/search with a valid operational basis; crowd information is aggregated.

Implementation constraints:

- Build in a self-contained Product Design prototype, not the production Command app.
- Use React, Three.js and React Three Fiber for the working local venue model.
- Use the existing synthetic venue concept and clearly label it as a demonstration.
- Do not require Google, Cesium, external API keys or a backend.
- Keep the renderer structured so real CAD/BIM/3D Tiles data can replace the synthetic geometry later.
- Verify the final result visually against both source concepts at a `1440 × 1024` viewport.
- Test every primary control and check the browser console before handoff.

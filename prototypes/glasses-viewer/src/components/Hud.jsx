import {
  Pulse,
  ArrowRight,
  ArrowsClockwise,
  BatteryHigh,
  Binoculars,
  Bluetooth,
  Buildings,
  Camera,
  CaretRight,
  Check,
  CheckCircle,
  CloudSlash,
  Compass,
  Crosshair,
  DoorOpen,
  FirstAid,
  Flag,
  Gauge,
  Headset,
  LockKey,
  MapPin,
  MapTrifold,
  Microphone,
  NavigationArrow,
  PersonSimpleWalk,
  Phone,
  Radio,
  ShieldCheck,
  Siren,
  SpeakerHigh,
  Stack,
  Users,
  Warning,
  Waveform,
  WifiHigh,
  WifiSlash,
  Wrench,
} from "@phosphor-icons/react";
import { SCENES } from "../data/scenarios.js";
import { useViewerStore } from "../store/useViewerStore.js";
import { VenueScene } from "./VenueScene.jsx";

const cx = (...classes) => classes.filter(Boolean).join(" ");

function Logo() {
  return (
    <span className="loc8-word">
      LOC<span>8</span>
    </span>
  );
}

function StatusHeader({ scenario }) {
  return (
    <>
      <div className="hud-chip hud-title">
        <Logo />
        <span>{scenario.eyebrow.replace(/^LOC8\s*/, "")}</span>
      </div>
      <div className="hud-chip hud-status">
        {scenario.status.map((item, index) => (
          <span key={item} className={index === 0 ? "status-live" : ""}>
            {index === 0 && <WifiHigh weight="bold" />}
            {item}
          </span>
        ))}
      </div>
    </>
  );
}

function HudButton({ children, tone = "mint", icon: Icon = ArrowRight, onClick, primary = false }) {
  return (
    <button className={cx("hud-action", `tone-${tone}`, primary && "primary")} onClick={onClick}>
      <Icon weight="bold" />
      <span>{children}</span>
      {primary && <CaretRight weight="bold" className="action-caret" />}
    </button>
  );
}

function VoiceBar({ scenario }) {
  const voiceState = useViewerStore((state) => state.voiceState);
  const setVoiceState = useViewerStore((state) => state.setVoiceState);
  const performAction = useViewerStore((state) => state.performAction);

  const startListening = () => {
    setVoiceState("listening");
    window.setTimeout(() => setVoiceState("understood"), 650);
    window.setTimeout(() => {
      setVoiceState("confirmed");
      performAction(scenario.voiceCommands[0]);
    }, 1350);
  };

  const stateCopy = {
    idle: <>Say: <strong>{scenario.voiceCommands.join(" · ")}</strong></>,
    listening: <><strong>Listening…</strong> speak a Loc8 command</>,
    understood: <>Heard: <strong>{scenario.voiceCommands[0]}</strong></>,
    confirmed: <><strong>Confirmed</strong> · {scenario.voiceCommands[0]}</>,
    failed: <><strong>Try again</strong> · command not understood</>,
  };

  return (
    <button className={cx("voice-bar", `voice-${voiceState}`)} onClick={startListening}>
      {voiceState === "listening" ? <Waveform weight="bold" /> : <Microphone weight="bold" />}
      <span>{stateCopy[voiceState] ?? stateCopy.idle}</span>
    </button>
  );
}

function WorldMarker({ className, tone = "mint", icon: Icon = MapPin, title, detail }) {
  return (
    <div className={cx("world-marker", `marker-${tone}`, className)}>
      <Icon weight="fill" />
      <div>
        <strong>{title}</strong>
        {detail && <span>{detail}</span>}
      </div>
    </div>
  );
}

function SetupHud({ scenario }) {
  const performAction = useViewerStore((state) => state.performAction);
  const calibration = scenario.id === "calibration";
  return (
    <>
      <StatusHeader scenario={scenario} />
      <section className="hud-panel setup-panel">
        <div className="setup-symbol">
          {calibration ? <Crosshair weight="duotone" /> : <Headset weight="duotone" />}
        </div>
        <p className="kicker">{calibration ? "OPTICAL DISPLAY" : "GUARD PHONE FOUND"}</p>
        <h2>{calibration ? "Place the guide inside the frame" : "Loc8 Guard · Augustus"}</h2>
        <p className="panel-copy">
          {calibration
            ? "Look straight ahead. Adjust the display until all four corners are visible and sharp."
            : "Mesh, location, and shift state will remain on the phone. The glasses receive the active operational view."}
        </p>
        {calibration ? (
          <>
            <div className="calibration-frame">
              <i /><i /><i /><i />
              <Crosshair />
            </div>
            <div className="brightness-row">
              <span>Brightness</span>
              <div className="meter"><i style={{ width: "72%" }} /></div>
              <b>72%</b>
            </div>
          </>
        ) : (
          <div className="connection-list">
            <span><Bluetooth weight="bold" /> Display connected</span>
            <span><WifiHigh weight="bold" /> Local mesh ready</span>
            <span><ShieldCheck weight="bold" /> Secure session</span>
          </div>
        )}
        <HudButton primary icon={CheckCircle} onClick={() => performAction(scenario.actions[0])}>
          {scenario.actions[0]}
        </HudButton>
        <HudButton tone="blue" icon={calibration ? Gauge : Buildings} onClick={() => performAction(scenario.actions[1])}>
          {scenario.actions[1]}
        </HudButton>
      </section>
      <VoiceBar scenario={scenario} />
    </>
  );
}

function CalmHud({ scenario }) {
  const performAction = useViewerStore((state) => state.performAction);
  return (
    <>
      <StatusHeader scenario={scenario} />
      <div className="route-path route-calm"><i /><i /><i /></div>
      <WorldMarker
        className="marker-calm"
        tone="mint"
        icon={NavigationArrow}
        title="CHECKPOINT C · 84 m"
        detail="Follow route"
      />
      <div className="hud-chip all-clear"><CheckCircle weight="fill" /> ALL CLEAR · 14 ON SECTOR</div>
      <button className="tiny-action" onClick={() => performAction("Open status")}>
        <Pulse weight="bold" /> STATUS
      </button>
      <VoiceBar scenario={scenario} />
    </>
  );
}

function IncomingHud({ scenario }) {
  const performAction = useViewerStore((state) => state.performAction);
  return (
    <>
      <StatusHeader scenario={scenario} />
      <section className="hud-panel incoming-panel">
        <p className="kicker alert-text"><Siren weight="fill" /> NEW ASSIGNMENT</p>
        <h2>WELFARE · GUARD 05</h2>
        <p className="incident-location"><MapPin weight="fill" /> SERVICE CORRIDOR B · L2</p>
        <div className="incoming-metrics">
          <span><b>72 m</b> distance</span>
          <span><b>00:54</b> ETA</span>
          <span><b>01:12</b> overdue</span>
        </div>
        <HudButton primary icon={Check} onClick={() => performAction("Accept response")}>Accept response</HudButton>
        <HudButton tone="blue" icon={CaretRight} onClick={() => performAction("Open incident")}>Open incident</HudButton>
      </section>
      <WorldMarker className="marker-incoming" tone="amber" icon={MapPin} title="INCIDENT · 72 m" detail="Level 2" />
      <VoiceBar scenario={scenario} />
    </>
  );
}

const incidentTimeline = [
  ["22:12:41", "CHECK-IN MISSED", "amber"],
  ["22:12:57", "RADIO CALL · NO RESPONSE", "amber"],
  ["22:13:12", "PHONE CALL · NO ANSWER", "amber"],
  ["22:13:41", "MESH PAGE · SENT", "mint"],
];

function IncidentHud({ scenario }) {
  const performAction = useViewerStore((state) => state.performAction);
  return (
    <>
      <StatusHeader scenario={scenario} />
      <section className="hud-panel incident-panel">
        <p className="kicker caution-text"><Warning weight="fill" /> WELFARE CHECK OVERDUE</p>
        <h2>GUARD 05 · NIA PATEL</h2>
        <h3>NO RESPONSE · 01:12</h3>
        <p className="incident-location"><MapPin weight="fill" /> SERVICE CORRIDOR B · LEVEL 2</p>
        <p className="freshness">LAST POSITION · 9s</p>
        <div className="timeline">
          {incidentTimeline.map(([time, label, tone]) => (
            <div key={time}><i className={`dot-${tone}`} /><time>{time}</time><span>{label}</span></div>
          ))}
        </div>
        <div className="environment-row">
          <span><Camera /> C-18 ONLINE</span>
          <span><LockKey /> B-214 SECURE</span>
          <span><DoorOpen /> EXIT 42 m</span>
        </div>
        <HudButton primary onClick={() => performAction("Send nearest · Cal 54 m")}>Send nearest · Cal 54 m</HudButton>
        <div className="split-actions">
          <HudButton tone="blue" icon={Phone} onClick={() => performAction("Call Nia")}>Call Nia</HudButton>
          <HudButton tone="blue" icon={MapTrifold} onClick={() => performAction("View route")}>View route</HudButton>
        </div>
      </section>
      <WorldMarker className="marker-last-seen" tone="blue" icon={MapPin} title="B-214 · NIA LAST SEEN" detail="9s ago" />
      <div className="route-path route-incident"><i /><i /><i /></div>
      <VoiceBar scenario={scenario} />
    </>
  );
}

const responders = [
  { rank: 1, name: "CAL ELLIS", role: "MEDICAL", distance: "64 m", eta: "00:46", state: "AVAILABLE", selected: true },
  { rank: 2, name: "GUARD 12", role: "PATROL", distance: "118 m", eta: "01:24", state: "AVAILABLE" },
  { rank: 3, name: "MAYA CHEN", role: "ESCORT", distance: "143 m", eta: "01:39", state: "BUSY" },
];

function DispatchHud({ scenario }) {
  const performAction = useViewerStore((state) => state.performAction);
  return (
    <>
      <StatusHeader scenario={scenario} />
      <section className="hud-panel dispatch-map">
        <p className="kicker">CONCOURSE MAP · ZONE E</p>
        <div className="mini-map"><VenueScene mode="top" floor="ALL" /></div>
        <p className="map-legend"><i className="legend-mint" /> RESPONDER ROUTES <i className="legend-red" /> INCIDENT</p>
      </section>
      <section className="hud-panel dispatch-panel">
        <p className="kicker alert-text"><FirstAid weight="fill" /> MEDICAL · NORTH GATE</p>
        <h3>RESPONSE REQUIRED</h3>
        <div className="responder-list">
          {responders.map((responder) => (
            <button
              key={responder.rank}
              className={cx("responder-row", responder.selected && "selected")}
              onClick={() => performAction(`Select ${responder.name}`)}
            >
              <b>{responder.rank}</b>
              <span><strong>{responder.name}</strong><small>{responder.role} · FIRST AID · ALL ACCESS</small></span>
              <span><strong>{responder.distance}</strong><small>ETA {responder.eta}</small></span>
              <em>{responder.state}</em>
            </button>
          ))}
        </div>
        <p className="route-preview"><NavigationArrow weight="fill" /> VIA SERVICE CORRIDOR B · 64 m</p>
        <HudButton primary icon={NavigationArrow} onClick={() => performAction("Dispatch Cal")}>Dispatch Cal</HudButton>
        <div className="split-actions">
          <HudButton icon={Users} onClick={() => performAction("Add Guard 12")}>Add Guard 12</HudButton>
          <HudButton icon={Radio} onClick={() => performAction("Call team")}>Call team</HudButton>
        </div>
      </section>
      <WorldMarker className="marker-medical" tone="red" icon={FirstAid} title="NORTH GATE" detail="64 m" />
      <VoiceBar scenario={scenario} />
    </>
  );
}

function SearchRescueHud({ scenario }) {
  const performAction = useViewerStore((state) => state.performAction);
  return (
    <>
      <StatusHeader scenario={scenario} />
      <section className="hud-panel search-panel">
        <p className="kicker">MISSING CONTRACTOR · <span className="blue">J. MORGAN</span></p>
        <p className="incident-location">LAST DETECTED · L1 SERVICE TUNNEL</p>
        <div className="dual-metric"><span><small>ELAPSED</small><b>08:42</b></span><span><small>PROGRESS</small><b className="mint">64%</b></span></div>
        <p className="quality"><Gauge /> AIR QUALITY <strong>SAFE</strong></p>
        <div className="team-list">
          {["ALPHA 1 · YOU", "ALPHA 2", "ALPHA 3", "ALPHA 4"].map((member) => (
            <span key={member}><i /> {member}<b>CONNECTED</b></span>
          ))}
        </div>
        <HudButton primary tone="blue" icon={Binoculars} onClick={() => performAction("Search room C3-14")}>Search room C3-14</HudButton>
      </section>
      <div className="search-sector">SECTOR C3 · 64% SEARCHED</div>
      <div className="evidence-path"><i /><i /><i /><i /><i /><i /></div>
      <WorldMarker className="marker-search" tone="blue" icon={MapPin} title="LAST CONTACT · 22:06" detail="62 m" />
      <WorldMarker className="marker-hazard" tone="red" icon={Warning} title="FLOODING" detail="18 m" />
      <div className="room-status room-one">C3-08<br /><b>CLEAR</b></div>
      <div className="room-status room-two">C3-10<br /><b>CLEAR</b></div>
      <div className="room-status room-three amber">C3-12<br /><b>NO ACCESS</b></div>
      <VoiceBar scenario={scenario} />
    </>
  );
}

function SpatialHud({ scenario }) {
  const floor = useViewerStore((state) => state.floor);
  const setFloor = useViewerStore((state) => state.setFloor);
  const showLayers = useViewerStore((state) => state.showLayers);
  const toggleLayer = useViewerStore((state) => state.toggleLayer);
  const performAction = useViewerStore((state) => state.performAction);
  const mode = scenario.viewMode ?? "site";
  const floorFocus = scenario.id === "floor-3d";

  return (
    <>
      <StatusHeader scenario={scenario} />
      <div className="spatial-scene">
        <VenueScene mode={mode} floor={floorFocus && floor === "ALL" ? "L2" : floor} />
      </div>
      <section className="hud-panel spatial-layers">
        <p className="kicker">LAYERS</p>
        {Object.entries(showLayers).map(([layer, enabled]) => (
          <button key={layer} onClick={() => toggleLayer(layer)}>
            <span>{layer === "people" ? <Users /> : layer === "routes" ? <NavigationArrow /> : layer === "coverage" ? <WifiHigh /> : <Camera />}{layer}</span>
            <i className={enabled ? "on" : ""} />
          </button>
        ))}
      </section>
      <section className="hud-panel spatial-context">
        <p className="kicker">{floorFocus ? "SERVICE CORRIDOR B" : mode === "top" ? "LEVEL 2 · BIRD'S-EYE" : "ARENA CAMPUS"}</p>
        {floorFocus ? (
          <>
            <div className="context-metrics"><span><Users /> 4 STAFF</span><span><Camera /> 3 CAMERAS</span><span><DoorOpen /> 2 EXITS</span></div>
            <p className="access-alert"><LockKey /> 1 ACCESS ALERT</p>
            <p className="coverage-line">COVERAGE <b>91%</b></p>
          </>
        ) : (
          <>
            <div className="context-metrics"><span className="alert-text"><Warning /> 3 ACTIVE EVENTS</span><span><WifiHigh /> 7 / 8 GATEWAYS</span><span><Users /> MUSTER 749 / 1000</span></div>
            <div className="event-summary"><span><FirstAid /> MEDICAL · NORTH GATE</span><span><Users /> CROWD · EAST GATE</span><span><Flag /> MUSTER A · 437 / 500</span></div>
          </>
        )}
        <HudButton primary tone={floorFocus ? "blue" : "mint"} onClick={() => performAction(scenario.actions[0])}>{scenario.actions[0]}</HudButton>
      </section>
      <div className="floor-switcher">
        {["ALL", "L2", "L1", "G"].map((item) => (
          <button key={item} className={floor === item ? "active" : ""} onClick={() => setFloor(item)}>{item}</button>
        ))}
      </div>
      <div className="mode-switcher">
        <button className={mode === "site" ? "active" : ""} onClick={() => performAction("3D site")}>3D SITE</button>
        <button className={mode === "floor" ? "active" : ""} onClick={() => performAction("3D floor")}>3D FLOOR</button>
        <button className={mode === "top" ? "active" : ""} onClick={() => performAction("2D bird's-eye")}>2D</button>
      </div>
      <WorldMarker className="marker-spatial-medical" tone="red" icon={FirstAid} title="MEDICAL · NORTH GATE" detail="2 responders · 01:24" />
      <VoiceBar scenario={scenario} />
    </>
  );
}

function CoverageHud({ scenario }) {
  const performAction = useViewerStore((state) => state.performAction);
  return (
    <>
      <StatusHeader scenario={scenario} />
      <section className="hud-panel coverage-panel">
        <p className="kicker caution-text"><i className="status-dot amber" /> ZONE E · DEGRADED</p>
        <div className="dual-metric"><span><small>COVERAGE</small><b className="mint">92%</b></span><span><small>GAPS</small><b className="amber-text">1</b></span></div>
        <h3>MESH <strong>7 / 8 NODES</strong></h3>
        <div className="anchor-detail">
          <p>ANCHOR E-04</p>
          <span>SIGNAL <b>-78 dBm</b></span>
          <span>BATTERY <b>22%</b></span>
          <span>LAST RELAY <b>41s</b></span>
          <span>BACKHAUL <b className="mint">ONLINE</b></span>
          <span>PROBABLE CAUSE <b className="amber-text">POWER INSTABILITY</b></span>
        </div>
        <HudButton primary icon={Wrench} onClick={() => performAction("Assign tech")}>Assign tech</HudButton>
        <HudButton icon={Pulse} onClick={() => performAction("Ping E-04")}>Ping node</HudButton>
      </section>
      <div className="coverage-field field-one" />
      <div className="coverage-field field-two" />
      <div className="coverage-field gap" />
      <div className="relay-line relay-one" />
      <div className="relay-line relay-two" />
      <WorldMarker className="anchor-one" tone="mint" icon={Radio} title="ANCHOR E-02" detail="HEALTHY" />
      <WorldMarker className="anchor-two" tone="amber" icon={Radio} title="ANCHOR E-04" detail="DEGRADED · 32 m" />
      <WorldMarker className="anchor-three" tone="mint" icon={Radio} title="ANCHOR E-05" detail="RELAYING" />
      <VoiceBar scenario={scenario} />
    </>
  );
}

function PersonSearchHud({ scenario }) {
  const performAction = useViewerStore((state) => state.performAction);
  return (
    <>
      <StatusHeader scenario={scenario} />
      <section className="hud-panel person-panel">
        <p className="kicker"><Users weight="fill" /> PERSON SEARCH</p>
        <h2 className="blue">NIA PATEL · GUARD 05</h2>
        <p>LAST CONFIRMED</p>
        <div className="last-confirmed"><strong>22s</strong><span>SOURCE · ANCHOR E-03</span></div>
        <div className="person-vitals"><span><BatteryHigh /> 61%</span><span><NavigationArrow /> MOVING EAST</span></div>
        <p>PREDICTED AREA</p>
        <h3>68% CONFIDENCE</h3>
        <p className="contact-attempts">CONTACT ATTEMPTS <b>2</b></p>
        <HudButton primary tone="blue" onClick={() => performAction("Guide to last point")}>Guide me to last point</HudButton>
        <HudButton icon={Phone} onClick={() => performAction("Call Nia")}>Call Nia</HudButton>
      </section>
      <div className="predicted-area">PREDICTED AREA<br /><b>68% CONFIDENCE</b></div>
      <div className="person-trail"><i /><i /><i /><i /><i /><i /></div>
      <WorldMarker className="marker-nia" tone="blue" icon={MapPin} title="NIA · 22s AGO" detail="38 m" />
      <WorldMarker className="marker-team-one" tone="mint" icon={Users} title="SEARCH 1" detail="28 m" />
      <WorldMarker className="marker-team-two" tone="mint" icon={Users} title="SEARCH 2" detail="31 m" />
      <VoiceBar scenario={scenario} />
    </>
  );
}

function MusterHud({ scenario }) {
  const performAction = useViewerStore((state) => state.performAction);
  return (
    <>
      <StatusHeader scenario={scenario} />
      <section className="hud-panel muster-panel">
        <p className="kicker mint">EVACUATION · PHASE 2</p>
        <p className="elapsed">ELAPSED <b>06:18</b></p>
        <p>ACCOUNTED</p>
        <div className="accounted"><strong>877</strong><span>/ 1,128</span></div>
        <h3>251 PENDING</h3>
        <h4>4 ASSISTANCE REQUESTS</h4>
        <div className="zone-progress">
          {[["ARENA", 92], ["CONCOURSE", 81], ["BACKSTAGE", 76], ["VIP", 95]].map(([label, value]) => (
            <span key={label}><b>{label}</b><i><em style={{ width: `${value}%` }} /></i><strong>{value}%</strong></span>
          ))}
        </div>
        <p>PRIMARY ISSUE</p>
        <h3>EAST GATE · HIGH DENSITY</h3>
        <HudButton primary tone="blue" onClick={() => performAction("Divert to South Gate")}>Divert to South Gate</HudButton>
        <HudButton icon={Users} onClick={() => performAction("Dispatch team")}>Dispatch team</HudButton>
      </section>
      <div className="evac-route route-a" />
      <div className="evac-route route-b" />
      <WorldMarker className="muster-a" tone="mint" icon={Flag} title="MUSTER A" detail="437 / 500 · 87%" />
      <WorldMarker className="muster-b" tone="mint" icon={Flag} title="MUSTER B" detail="312 / 500 · 62%" />
      <WorldMarker className="gate-alert" tone="amber" icon={Warning} title="EAST GATE" detail="HIGH DENSITY" />
      <WorldMarker className="gate-blocked" tone="red" icon={Warning} title="SERVICE GATE" detail="BLOCKED" />
      <VoiceBar scenario={scenario} />
    </>
  );
}

function MultiIncidentHud({ scenario }) {
  const performAction = useViewerStore((state) => state.performAction);
  return (
    <>
      <StatusHeader scenario={scenario} />
      <section className="hud-panel incident-queue">
        <p className="kicker">ACTIVE INCIDENTS</p>
        {[
          ["1", "MEDICAL", "NORTH GATE", "ACTIVE", "red"],
          ["2", "WELFARE", "LEVEL 2", "OVERDUE 01:12", "amber"],
          ["3", "CROWD", "EAST GATE", "HIGH DENSITY", "amber"],
        ].map(([rank, kind, place, state, tone]) => (
          <button key={rank} onClick={() => performAction(`Open ${kind}`)}>
            <b className={`${tone}-text`}>{rank}</b>
            <span><strong>{kind} · {place}</strong><small>2 RESPONDERS · 64 m IMPACT</small></span>
            <em className={`${tone}-text`}>{state}</em>
          </button>
        ))}
        <p>1 OTHER MONITORED</p>
      </section>
      <div className="multi-site"><VenueScene mode="top" floor="ALL" /></div>
      <section className="hud-panel selected-incident">
        <p className="kicker alert-text">PRIORITY 1 · MEDICAL</p>
        <h2><FirstAid weight="fill" /> NORTH GATE</h2>
        <p>OPENED 22:14:08</p>
        <h3 className="mint">CASUALTY · CONSCIOUS</h3>
        <p>2 RESPONDERS · ETA 01:24</p>
        <div className="selected-responders"><span>CAL ELLIS <b>64 m</b></span><span>GUARD 12 <b>118 m</b></span></div>
        <div className="timeline compact">
          {["INCIDENT OPENED", "MEDICAL DISPATCHED", "RESPONDERS EN ROUTE", "RESPONDERS ON SITE"].map((item, index) => (
            <div key={item}><i className={index === 3 ? "dot-red" : "dot-mint"} /><time>22:14:{String(8 + index * 9).padStart(2, "0")}</time><span>{item}</span></div>
          ))}
        </div>
        <HudButton primary tone="red" icon={Radio} onClick={() => performAction("Open medical channel")}>Open medical channel</HudButton>
        <HudButton icon={Users} onClick={() => performAction("Add responder")}>Add responder</HudButton>
      </section>
      <VoiceBar scenario={scenario} />
    </>
  );
}

function VoiceHud({ scenario }) {
  const voiceState = useViewerStore((state) => state.voiceState);
  const setVoiceState = useViewerStore((state) => state.setVoiceState);
  const performAction = useViewerStore((state) => state.performAction);
  return (
    <>
      <StatusHeader scenario={scenario} />
      <section className="hud-panel voice-demo">
        <div className={cx("voice-orb", `state-${voiceState}`)}>
          {voiceState === "failed" ? <Warning weight="fill" /> : <Waveform weight="bold" />}
        </div>
        <p className="kicker">VOICE CONTROL</p>
        <h2>{voiceState === "idle" ? "Ready" : voiceState === "listening" ? "Listening…" : voiceState === "failed" ? "I didn’t catch that" : "Dispatch Cal?"}</h2>
        <p>{voiceState === "failed" ? "Try saying a shorter operational command." : "Commands are confirmed before a consequential action is sent."}</p>
        <HudButton primary icon={Microphone} onClick={() => setVoiceState("listening")}>Start listening</HudButton>
        <HudButton tone="blue" icon={Check} onClick={() => performAction("Dispatch Cal")}>Confirm command</HudButton>
        <HudButton tone="amber" icon={Warning} onClick={() => setVoiceState("failed")}>Try failure</HudButton>
      </section>
      <VoiceBar scenario={scenario} />
    </>
  );
}

function OfflineHud({ scenario }) {
  const connectionState = useViewerStore((state) => state.connectionState);
  const setConnectionState = useViewerStore((state) => state.setConnectionState);
  const performAction = useViewerStore((state) => state.performAction);
  return (
    <>
      <StatusHeader scenario={scenario} />
      <section className="hud-panel offline-panel">
        <div className="offline-symbol"><CloudSlash weight="duotone" /></div>
        <p className="kicker caution-text">BRIDGE CONNECTION LOST</p>
        <h2>Local mesh is still working</h2>
        <p>Positions and messages from nearby Guard phones remain available. Command updates are queued until the bridge reconnects.</p>
        <div className="offline-status">
          <span><WifiHigh /> LOCAL MESH <b>LIVE · 7 NODES</b></span>
          <span><WifiSlash /> COMMAND BRIDGE <b>OFFLINE · 41s</b></span>
          <span><MapPin /> LAST KNOWN DATA <b>AVAILABLE</b></span>
        </div>
        <HudButton primary icon={ArrowsClockwise} onClick={() => {
          setConnectionState("reconnecting");
          window.setTimeout(() => setConnectionState("simulated"), 1400);
          performAction("Retry connection");
        }}>{connectionState === "reconnecting" ? "Reconnecting…" : "Retry connection"}</HudButton>
        <HudButton icon={MapTrifold} onClick={() => performAction("Show last known")}>Show last known</HudButton>
      </section>
      <div className="hud-chip local-only"><WifiHigh /> LOCAL-ONLY MODE · SAFE TO CONTINUE</div>
      <VoiceBar scenario={scenario} />
    </>
  );
}

export function GlassesHud({ scenario }) {
  const render = () => {
    if (scenario.density === "setup") return <SetupHud scenario={scenario} />;
    if (scenario.id === "calm") return <CalmHud scenario={scenario} />;
    if (scenario.id === "incoming") return <IncomingHud scenario={scenario} />;
    if (scenario.id === "incident") return <IncidentHud scenario={scenario} />;
    if (scenario.id === "dispatch") return <DispatchHud scenario={scenario} />;
    if (scenario.id === "search-rescue") return <SearchRescueHud scenario={scenario} />;
    if (["site-3d", "floor-3d", "map-2d"].includes(scenario.id)) return <SpatialHud scenario={scenario} />;
    if (scenario.id === "coverage") return <CoverageHud scenario={scenario} />;
    if (scenario.id === "person-search") return <PersonSearchHud scenario={scenario} />;
    if (scenario.id === "muster") return <MusterHud scenario={scenario} />;
    if (scenario.id === "multi-incident") return <MultiIncidentHud scenario={scenario} />;
    if (scenario.id === "voice") return <VoiceHud scenario={scenario} />;
    if (scenario.id === "offline") return <OfflineHud scenario={scenario} />;
    return <CalmHud scenario={scenario} />;
  };

  return (
    <div
      className={cx("glasses-viewport", `density-${scenario.density}`, `scenario-${scenario.id}`)}
      style={{ "--scene": `url(${SCENES[scenario.scene]})` }}
      data-testid="glasses-viewport"
    >
      <div className="scene-plate" />
      <div className="optical-vignette" />
      <div className="hud-content">{render()}</div>
    </div>
  );
}

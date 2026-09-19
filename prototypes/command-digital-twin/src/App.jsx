import { useEffect, useMemo, useState } from "react";
import {
  Heartbeat,
  Alarm,
  ArrowRight,
  Buildings,
  Camera,
  CaretDown,
  Check,
  Crosshair,
  Cube,
  DoorOpen,
  Eye,
  FirstAid,
  Flag,
  GridFour,
  ListMagnifyingGlass,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  Microphone,
  NavigationArrow,
  Pause,
  Play,
  Radio,
  ShieldChevron,
  Siren,
  SlidersHorizontal,
  SquaresFour,
  Stack,
  UsersThree,
  User,
  Warning,
  WifiHigh,
  X,
} from "@phosphor-icons/react";
import { VenueScene } from "./scene/VenueScene.jsx";

const DEMOS = [
  {
    id: "fusion-live",
    short: "01",
    label: "Fusion · Live Site",
    eyebrow: "EVERYDAY COMMAND",
    title: "Arena Campus",
    subtitle: "Full operational picture",
    defaultView: "three",
  },
  {
    id: "fusion-investigation",
    short: "02",
    label: "Fusion · Investigation",
    eyebrow: "FOCUSED RESPONSE",
    title: "Nia Patel",
    subtitle: "Person investigation",
    defaultView: "focus",
  },
  {
    id: "person-search",
    short: "03",
    label: "Person Search",
    eyebrow: "REFERENCE BUILD",
    title: "Nia Patel · Guard 05",
    subtitle: "Last known position",
    defaultView: "focus",
  },
  {
    id: "sar",
    short: "04",
    label: "Search & Rescue",
    eyebrow: "REFERENCE BUILD",
    title: "Sector C",
    subtitle: "Major incident",
    defaultView: "exploded",
  },
];

const VIEWS = [
  { id: "two", label: "2D", icon: MapTrifold },
  { id: "three", label: "3D", icon: Cube },
  { id: "exploded", label: "Exploded", icon: Stack },
  { id: "focus", label: "Focus", icon: Crosshair },
];

const FLOORS = ["ALL", "L3", "L2", "L1", "G"];

const BASE_LAYERS = [
  { id: "people", label: "People", icon: User },
  { id: "routes", label: "Routes", icon: NavigationArrow },
  { id: "coverage", label: "Coverage", icon: WifiHigh },
  { id: "cameras", label: "Cameras", icon: Camera },
  { id: "search", label: "Search", icon: MagnifyingGlass },
  { id: "muster", label: "Muster", icon: Flag },
];

const STATUS_BY_DEMO = {
  "fusion-live": [
    ["31", "ON SHIFT", "ok"],
    ["2", "INCIDENTS", "caution"],
    ["96%", "MESH", "ok"],
    ["7/8", "GATEWAYS", "ok"],
  ],
  "fusion-investigation": [
    ["31", "ON SHIFT", "ok"],
    ["1", "ACTIVE SEARCH", "alert"],
    ["9s", "LAST POSITION", "info"],
    ["LIVE", "MESH", "ok"],
  ],
  "person-search": [
    ["31", "ON SHIFT", "ok"],
    ["2", "INCIDENTS", "caution"],
    ["L2", "FOCUS", "info"],
    ["LIVE", "MESH", "ok"],
  ],
  sar: [
    ["41", "ON SITE", "ok"],
    ["3", "ACTIVE EVENTS", "caution"],
    ["96%", "MESH", "ok"],
    ["7/8", "GATEWAYS", "ok"],
  ],
};

const NAV = [
  ["live", "Live site", GridFour],
  ["incidents", "Incidents", Warning],
  ["team", "Team", UsersThree],
  ["coverage", "Coverage", WifiHigh],
  ["muster", "Muster", Flag],
  ["assets", "Assets", SquaresFour],
  ["search", "Search", ListMagnifyingGlass],
  ["commissioning", "Commission", SlidersHorizontal],
];

const WORKSPACE_BY_NAV = {
  live: "operations",
  incidents: "incident",
  team: "roster",
  coverage: "heatmap",
  muster: "muster",
  assets: "assets",
  search: "audit",
  commissioning: "commissioning",
};

const NAV_BY_WORKSPACE = Object.fromEntries(
  Object.entries(WORKSPACE_BY_NAV).map(([nav, workspace]) => [workspace, nav]),
);

function Logo() {
  return (
    <div className="brand">
      <span>LOC</span><b>8</b>
      <em>COMMAND</em>
    </div>
  );
}

function TopBar({ demo, demoId, setDemoId, commandState }) {
  const statusRows = commandState
    ? [
        [String(commandState.onDuty), "ON SHIFT", "ok"],
        [String(commandState.openEvents), "INCIDENTS", commandState.openEvents ? "caution" : "ok"],
        [`${commandState.coverage}%`, "MESH", commandState.coverage < 85 ? "caution" : "ok"],
      ]
    : STATUS_BY_DEMO[demoId].slice(0, 3);
  return (
    <header className="topbar">
      <Logo />
      <div className="demo-tabs" role="tablist" aria-label="Command demonstrations">
        {DEMOS.map((item) => (
          <button
            role="tab"
            aria-selected={item.id === demoId}
            type="button"
            key={item.id}
            className={item.id === demoId ? "active" : ""}
            onClick={() => setDemoId(item.id)}
          >
            <span>{item.short}</span>
            <div>
              <b>{item.label.replace("Fusion · ", "")}</b>
              <small>{item.subtitle}</small>
            </div>
          </button>
        ))}
      </div>
      <div className="top-stats">
        {statusRows.map(([value, label, tone]) => (
          <div className={`top-stat ${tone}`} key={label}>
            <i />
            <b>{value}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <time>22:18</time>
    </header>
  );
}

function LeftRail({ activeNav, setActiveNav, commandState }) {
  return (
    <nav className="left-rail">
      <div className="operator">
        <div className="operator-badge"><ShieldChevron weight="fill" size={16} /></div>
        <span><b>{commandState?.operatorId?.split("·")[0]?.trim() ?? "OP-17"}</b><small>SUPERVISOR</small></span>
        <i />
      </div>
      <div className="nav-stack">
        {NAV.map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            className={activeNav === id ? "active" : ""}
            onClick={() => setActiveNav(id)}
            title={label}
          >
            <Icon size={21} />
            <span>{label}</span>
            {id === "incidents" && <em>{commandState?.openEvents ?? 2}</em>}
          </button>
        ))}
      </div>
      <div className="system-note">
        <Heartbeat size={17} />
        <span><b>ALL SYSTEMS</b><small>OPERATIONAL</small></span>
      </div>
    </nav>
  );
}

function ViewControls({ viewMode, setViewMode, activeFloor, setActiveFloor, layers, toggleLayer }) {
  return (
    <>
      <div className="view-switcher">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={viewMode === id ? "active" : ""}
            onClick={() => setViewMode(id)}
            title={`${label} view`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="floor-switcher">
        <div className="floating-label">FLOOR SCOPE</div>
        {FLOORS.map((floor) => (
          <button
            type="button"
            key={floor}
            className={activeFloor === floor ? "active" : ""}
            onClick={() => setActiveFloor(floor)}
          >
            {floor}
          </button>
        ))}
      </div>
      <div className="layer-switcher">
        <div className="floating-label"><SlidersHorizontal size={13} /> LAYERS</div>
        {BASE_LAYERS.map(({ id, label, icon: Icon }) => (
          <button type="button" key={id} onClick={() => toggleLayer(id)} className={layers[id] ? "active" : ""}>
            <Icon size={14} />
            <span>{label}</span>
            <i />
          </button>
        ))}
      </div>
    </>
  );
}

function Metric({ label, value, tone = "default", suffix }) {
  return (
    <div className={`metric ${tone}`}>
      <small>{label}</small>
      <strong>{value}</strong>
      {suffix && <span>{suffix}</span>}
    </div>
  );
}

function LiveSummary({ actionState, setActionState, commandState, commandActions, openTool }) {
  const incident = commandState?.activeIncident;
  const title = commandState?.siteName ?? "Arena Campus";
  const titleLines = title.split(" ");
  return (
    <aside className="mission-summary">
      <div className="summary-eyebrow"><span /> LIVE SITE · {commandState?.sourceLabel ?? "SCRIPTED DEMO"}</div>
      <h1>{titleLines.slice(0, -1).join(" ") || title}<br />{titleLines.length > 1 ? titleLines.at(-1) : ""}</h1>
      <p>{commandState?.shiftLabel ?? "Full operational picture"}</p>
      <div className="summary-rule" />
      <div className="summary-grid">
        <Metric label="ON SHIFT" value={commandState?.onDuty ?? "31"} tone="ok" />
        <Metric label="OPEN EVENTS" value={commandState?.openEvents ?? "2"} tone={commandState?.openEvents ? "caution" : "ok"} />
        <Metric label="COVERAGE" value={`${commandState?.coverage ?? 96}%`} tone="ok" />
        <Metric label="GATEWAYS" value={commandState?.gateways ?? "7/8"} />
      </div>
      <div className="summary-rule" />
      <div className="priority-row">
        <div className="priority-icon"><FirstAid size={19} weight="bold" /></div>
        <span>
          <small>PRIORITY EVENT · {incident?.status?.toUpperCase() ?? "ACTIVE"}</small>
          <b>{incident?.title ?? "Medical · North Gate"}</b>
          <em>{incident?.responders?.filter((item) => item.staffId !== 0).length ?? 2} responders · {incident?.raisedAt ?? "22:14"}</em>
        </span>
      </div>
      <button className="primary-action" type="button" onClick={() => {
        setActionState("incident-open");
        if (incident?.id) commandActions?.selectIncident?.(incident.id);
        openTool?.("incident");
      }}>
        <ArrowRight size={21} />
        <span><b>{actionState === "incident-open" ? "INCIDENT OPEN" : "OPEN INCIDENT"}</b><small>{incident?.id ?? "North Gate medical"}</small></span>
      </button>
    </aside>
  );
}

function SearchSummary({ reference, actionState, setActionState, commandState, commandActions }) {
  const sar = reference === "sar";
  const operation = commandState?.searchOperation;
  const subject = operation?.subjectName ?? commandState?.activeIncident?.subjectName ?? "Nia Patel";
  const searchProgress = operation?.sectors?.length
    ? Math.round(operation.sectors.reduce((sum, sector) => sum + sector.progressPct, 0) / operation.sectors.length)
    : 86;
  return (
    <aside className="mission-summary search-summary">
      <div className="summary-eyebrow"><span className={sar ? "amber" : "red"} /> {sar ? "SEARCH & RESCUE" : "PERSON SEARCH"}</div>
      <h1>{sar ? "Sector C" : subject}</h1>
      <p>{sar ? "Level 1 service tunnel" : "Guard 05 · on-duty staff"}</p>
      <div className="summary-rule" />
      {sar ? (
        <>
          <Metric label="PHASE" value="SEARCH" tone="ok" />
          <div className="metric-pair">
            <Metric label="ELAPSED" value="08:42" />
            <Metric label="TEAMS" value="3 / 3" />
          </div>
          <Metric label="SEARCH PROGRESS" value={`${searchProgress}%`} tone="ok" suffix="████████▌" />
          <Metric label="LAST CONFIRMED" value="22:06" tone="info" />
        </>
      ) : (
        <>
          <Metric label="NO RESPONSE" value="01:12" tone="alert" />
          <Metric label="LAST POSITION" value="9s ago" tone="info" />
          <div className="place-callout"><MapPin size={18} /><span><b>SERVICE CORRIDOR B</b><small>LEVEL 2</small></span></div>
          <div className="contact-attempts">
            <span><small>22:13:57</small><b>RADIO CALL</b><em>NO RESPONSE</em></span>
            <span><small>22:14:01</small><b>MESH PAGE</b><em className="sent">SENT</em></span>
          </div>
        </>
      )}
      <button className="primary-action" type="button" onClick={() => {
        if (sar) commandActions?.startSearch?.(subject);
        if (!sar && commandState?.activeIncident?.id) {
          commandActions?.dispatchIncident?.(commandState.activeIncident.id, `Locate and assist ${subject}`);
        }
        setActionState(sar ? "search-coordinated" : "cal-dispatched");
      }}>
        <NavigationArrow size={21} weight="fill" />
        <span>
          <b>{sar ? (actionState === "search-coordinated" ? "SEARCH COORDINATED" : "COORDINATE SEARCH") : (actionState === "cal-dispatched" ? "CAL DISPATCHED" : "DISPATCH CAL")}</b>
          <small>{sar ? "3 teams · Sector C" : "54 m · ETA 00:46"}</small>
        </span>
      </button>
    </aside>
  );
}

function IncidentPanel({ actionState, setActionState, onClose, onOpenTool, commandState, commandActions }) {
  const incident = commandState?.activeIncident;
  const responders = incident?.responders ?? [
    { staffId: 1, displayName: "CAL ELLIS", state: "en_route", distanceM: 64, eta: "00:46" },
    { staffId: 12, displayName: "GUARD 12", state: "responding", distanceM: 118, eta: "01:12" },
  ];
  const timeline = incident?.timeline?.slice(-5) ?? [
    { tone: "alert", time: "22:14:08", text: "SOS RECEIVED", sub: "Medical emergency reported" },
    { tone: "info", time: "22:14:13", text: "ACKNOWLEDGED", sub: "Command accepted incident" },
    { tone: "ok", time: "22:14:19", text: "RESPONDERS DISPATCHED", sub: "Cal Ellis, Guard 12" },
    { tone: "info", time: "22:14:23", text: "ETA UPDATED", sub: "Estimated arrival 01:24" },
  ];
  return (
    <aside className="context-panel">
      <div className="panel-title-row">
        <div className="medical-icon"><FirstAid size={23} weight="bold" /></div>
        <div>
          <small>{incident?.id ?? "ACTIVE INCIDENT"} · {incident?.status?.toUpperCase() ?? "ACTIVE"}</small>
          <h2>{incident?.kind?.toUpperCase() ?? "MEDICAL"} <span>· {incident?.zoneName ?? "NORTH GATE"}</span></h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close panel"><X size={16} /></button>
      </div>
      <div className="response-hero">
        <strong>{responders.filter((item) => item.staffId !== 0).length} RESPONDERS</strong>
        <span>SUBJECT <b>{incident?.subjectName ?? "UNKNOWN"}</b></span>
      </div>
      <div className="responder-list">
        {responders.slice(0, 3).map((responder) => (
          <div key={`${responder.staffId}-${responder.displayName ?? responder.name}`}>
            <User size={18} weight="fill" />
            <span>
              <b>{responder.displayName ?? responder.name}</b>
              <small>{String(responder.state ?? "viewing").replaceAll("_", " ").toUpperCase()} {responder.distanceM != null ? `· ${responder.distanceM} m` : ""}</small>
            </span>
            <em>{responder.eta ?? "LIVE"}</em>
          </div>
        ))}
      </div>
      <div className="section-title"><span>INCIDENT TIMELINE</span><b>LIVE</b></div>
      <div className="event-list">
        {timeline.map((event, index) => (
          <TimelineEvent
            key={`${event.time}-${index}`}
            tone={event.tone === "alert" ? "red" : event.tone === "ok" ? "green" : "blue"}
            time={event.time}
            title={event.text}
            sub={event.sub}
          />
        ))}
      </div>
      <button className="panel-action primary" type="button" onClick={() => {
        setActionState("incident-open");
        if (incident?.id) commandActions?.selectIncident?.(incident.id);
        onOpenTool?.("incident");
      }}>
        <Radio size={18} /> {actionState === "incident-open" ? "INCIDENT WORKSPACE OPEN" : "OPEN INCIDENT"}
      </button>
      <button className="panel-action" type="button" onClick={() => {
        if (!incident?.id) return;
        commandActions?.dispatchIncident?.(incident.id, `Converge on ${incident.zoneName} · confirm arrival`);
        setActionState("responders-updated");
      }}>
        <NavigationArrow size={17} /> {actionState === "responders-updated" ? "UPDATE SENT" : "UPDATE RESPONDERS"}
      </button>
    </aside>
  );
}

function TimelineEvent({ tone, time, title, sub }) {
  return (
    <div className={`timeline-event ${tone}`}>
      <i />
      <time>{time}</time>
      <span><b>{title}</b><small>{sub}</small></span>
    </div>
  );
}

function PersonPanel({ actionState, setActionState, reference, onOpenTool, commandState, commandActions }) {
  const incident = commandState?.activeIncident;
  const person = incident?.subjectName ?? "Nia Patel";
  const initials = person.split(" ").map((part) => part[0]).join("").slice(0, 2);
  const nearby = incident?.responders?.filter((item) => item.staffId !== 0).slice(0, 2) ?? [];
  return (
    <aside className="context-panel person-panel">
      <div className="panel-kicker">PERSON SEARCH</div>
      <div className="person-heading">
        <div><h2>{person.toUpperCase()} <span>· {incident?.id ?? "GUARD 05"}</span></h2><strong>LAST POSITION · MESH CONFIRMED</strong></div>
        <div className="person-avatar">{initials}</div>
      </div>
      <div className="location-line"><MapPin size={16} /> {incident?.zoneName ?? "SERVICE CORRIDOR B · LEVEL 2"}</div>
      <div className="no-response">{incident?.status?.toUpperCase() ?? "NO RESPONSE"} <b>{incident?.raisedAt ?? "01:12"}</b></div>
      <div className="section-title"><span>CONTACT ATTEMPTS</span><b>4</b></div>
      <div className="attempt-table">
        <span><time>22:13:57</time><b>RADIO CALL</b><em>NO RESPONSE</em></span>
        <span><time>22:13:12</time><b>PHONE CALL</b><em>NO ANSWER</em></span>
        <span><time>22:13:41</time><b>RADIO CALL</b><em>NO RESPONSE</em></span>
        <span><time>22:14:01</time><b>MESH PAGE</b><em className="sent">SENT</em></span>
      </div>
      <div className="section-title"><span>NEAREST TEAM MEMBERS</span><b>2 READY</b></div>
      <div className="responder-list compact">
        {(nearby.length ? nearby : [
          { displayName: "CAL ELLIS", distanceM: 54, eta: "00:46" },
          { displayName: "MAYA CHEN", distanceM: 71, eta: "01:06" },
        ]).map((responder) => (
          <div key={responder.displayName}>
            <User size={18} weight="fill" />
            <span><b>{responder.displayName}</b><small>{responder.distanceM ?? "—"} m · ETA {responder.eta}</small></span>
            <ArrowRight size={15} />
          </div>
        ))}
      </div>
      <div className="action-stack">
        <button className="panel-action blue" type="button" onClick={() => {
          if (incident?.id) commandActions?.dispatchIncident?.(incident.id, `Locate and assist ${person} at ${incident.zoneName}`);
          setActionState("cal-dispatched");
        }}>
          <NavigationArrow size={18} weight="fill" /> {actionState === "cal-dispatched" ? "CAL DISPATCHED · 00:46" : "DISPATCH CAL"}
        </button>
        <button className="panel-action" type="button" onClick={() => {
          if (incident?.id) commandActions?.dispatchIncident?.(incident.id, `Radio and phone contact requested for ${person}`);
          setActionState("contact-requested");
        }}>
          <Radio size={18} /> {actionState === "contact-requested" ? "CONTACT REQUEST SENT" : `CALL ${person.split(" ")[0].toUpperCase()}`}
        </button>
        <button className="panel-action primary" type="button" onClick={() => {
          commandActions?.startSearch?.(person);
          setActionState("search-started");
        }}>
          <MagnifyingGlass size={18} /> {actionState === "search-started" ? "SEARCH ACTIVE" : "START SEARCH"}
        </button>
        <button className="panel-action workspace-link" type="button" onClick={() => onOpenTool?.("audit")}>
          <ListMagnifyingGlass size={18} /> OPEN ASSISTED SEARCH & AUDIT
        </button>
      </div>
      {reference && !commandState && <div className="reference-tag">REFERENCE INTERPRETATION · CONCEPT 02</div>}
    </aside>
  );
}

function SarPanel({ actionState, setActionState, commandState, commandActions }) {
  const operation = commandState?.searchOperation;
  const sectors = operation?.sectors?.map((sector) => [
    sector.id,
    sector.progressPct,
    sector.status === "clear" ? "green" : sector.status === "priority" ? "amber" : sector.status === "unsearched" ? "off" : "red",
  ]) ?? [
    ["C1", 100, "green"],
    ["C2", 92, "green"],
    ["C3", 64, "amber"],
    ["C4", 28, "red"],
    ["C5", 0, "off"],
  ];
  const teams = operation?.teams ?? [
    { id: "alpha", label: "ALPHA", personnel: 6, assignment: "C3", etaSec: 130 },
    { id: "bravo", label: "BRAVO", personnel: 6, assignment: "C4", etaSec: 205 },
    { id: "k9", label: "K9 UNIT", personnel: 2, assignment: "C3", etaSec: 105 },
  ];
  const radio = operation?.radio?.slice(-5) ?? [];
  const bravo = teams.find((team) => team.id === "bravo") ?? teams[1];
  const clearTarget = sectors.find(([, pct]) => pct < 100)?.[0] ?? "C4";
  return (
    <aside className="context-panel sar-panel">
      <div className="panel-kicker">{operation?.subjectName?.toUpperCase() ?? "SECTOR C"} · LIVE SEARCH</div>
      <h2>SEARCH SECTORS</h2>
      <div className="sector-list">
        {sectors.map(([name, pct, tone]) => (
          <div key={name}><b>{name}</b><span><i className={tone} style={{ width: `${pct}%` }} /></span><em>{pct}%</em></div>
        ))}
      </div>
      <div className="section-title"><span>TEAMS</span><b>3 DEPLOYED</b></div>
      <div className="team-list">
        {teams.map((team) => (
          <div key={team.id}>
            {team.id === "k9" ? <ShieldChevron size={20} /> : <UsersThree size={20} />}
            <span><b>{team.label.toUpperCase()}</b><small>{team.personnel} personnel · Searching {team.assignment}</small></span>
            <em>{String(Math.floor(team.etaSec / 60)).padStart(2, "0")}:{String(team.etaSec % 60).padStart(2, "0")}</em>
          </div>
        ))}
      </div>
      <div className="section-title"><span>LIVE RADIO</span><b><i /> CH 1</b></div>
      <div className="radio-log">
        {(radio.length ? radio : [
          { atSec: 0, time: "22:17:45", source: "ALPHA", text: "L1 C3 corridor clear, moving south." },
          { atSec: 0, time: "22:17:52", source: "COMMAND", text: "Copy Alpha. Check service doors." },
          { atSec: 0, time: "22:18:01", source: "BRAVO", text: "Crowd build-up at East Gate." },
        ]).map((entry, index) => (
          <p key={`${entry.atSec}-${index}`}>
            <time>{entry.time ?? new Date(entry.atSec * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</time>
            <b>{entry.source}:</b> {entry.text}
          </p>
        ))}
      </div>
      <button className="panel-action blue" type="button" onClick={() => {
        commandActions?.reassignSearchTeam?.("bravo", "C5");
        setActionState("bravo-reassigned");
      }}>
        <UsersThree size={18} /> {bravo?.assignment === "C5" ? `BRAVO REASSIGNED · C5` : `REASSIGN ${bravo?.label?.toUpperCase() ?? "BRAVO"} TO C5`}
      </button>
      <button className="panel-action primary" type="button" onClick={() => {
        commandActions?.markSearchSectorClear?.(clearTarget);
        setActionState(`area-cleared:${clearTarget}`);
      }}>
        <Check size={18} /> {actionState.startsWith("area-cleared:")
          ? `${actionState.split(":")[1]} MARKED CLEAR`
          : `MARK ${clearTarget} CLEAR`}
      </button>
      {!commandState && <div className="reference-tag">REFERENCE INTERPRETATION · CONCEPT 03</div>}
    </aside>
  );
}

const FEATURE_CONTENT = {
  incidents: {
    kicker: "ACTIVE OPERATIONS",
    title: "INCIDENTS",
    meta: "2 active · 1 acknowledged",
  },
  team: {
    kicker: "LIVE PERSONNEL",
    title: "TEAM STATUS",
    meta: "31 on shift · 4 responding",
  },
  coverage: {
    kicker: "MESH & POSITIONING",
    title: "COVERAGE",
    meta: "96% venue confidence",
  },
  muster: {
    kicker: "EVACUATION CONTROL",
    title: "MUSTER",
    meta: "749 / 1,000 accounted for",
  },
  assets: {
    kicker: "SITE INFRASTRUCTURE",
    title: "ASSETS",
    meta: "7 / 8 gateways live",
  },
};

function FeaturePanel({ activeNav, onClose, onFeatureAction, featureState, onOpenTool, commandState, commandActions }) {
  const content = FEATURE_CONTENT[activeNav];
  if (!content) return null;

  return (
    <aside className="context-panel feature-panel">
      <div className="feature-panel-head">
        <div>
          <div className="panel-kicker">{content.kicker}</div>
          <h2>{content.title}</h2>
          <p>{content.meta}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close workspace"><X size={17} /></button>
      </div>

      {activeNav === "incidents" && (
        <>
          {(commandState?.incidents?.filter((incident) => incident.status !== "resolved").slice(0, 3) ?? [
            { id: "medical", kind: "medical", status: "active", title: "North Gate", sub: "2 responders · ETA 01:24" },
            { id: "welfare", kind: "welfare", status: "acknowledged", title: "Service Corridor B", sub: "No response 01:12" },
          ]).map((incident, index) => (
            <div className={`feature-hero ${index === 0 ? "alert" : "caution"}`} key={incident.id}>
              {index === 0 ? <FirstAid size={22} weight="bold" /> : <Warning size={22} weight="bold" />}
              <span>
                <small>{incident.kind.toUpperCase()} · {incident.status.toUpperCase()}</small>
                <b>{incident.title}</b>
                <em>{incident.sub}</em>
              </span>
              <button type="button" onClick={() => onFeatureAction(incident.id)}>{index === 0 ? "OPEN" : "VIEW"}</button>
            </div>
          ))}
          <div className="section-title"><span>RECENTLY RESOLVED</span><b>4 TODAY</b></div>
          <div className="plain-rows">
            {(commandState?.incidents?.filter((incident) => incident.status === "resolved").slice(0, 4) ?? [
              { id: "gate-e", title: "Gate E congestion", sub: "21:48 · resolved" },
              { id: "lost-property", title: "Lost property assist", sub: "21:22 · closed" },
            ]).map((incident) => (
              <span key={incident.id}><i className="ok" /><b>{incident.title}</b><em>{incident.sub}</em></span>
            ))}
          </div>
        </>
      )}

      {activeNav === "team" && (
        <>
          <div className="feature-stats">
            <Metric label="ON POST" value={commandState?.staff?.filter((item) => item.status === "on_post").length ?? 24} tone="ok" />
            <Metric label="RESPONDING" value={commandState?.staff?.filter((item) => item.status === "responding").length ?? 4} tone="info" />
            <Metric label="WELFARE" value={commandState?.staff?.filter((item) => item.status === "sos" || item.status === "lone").length ?? 1} tone="alert" />
          </div>
          <div className="section-title"><span>ON-DUTY STAFF</span><b>LIVE POSITIONS</b></div>
          <div className="people-roster">
            {(commandState?.staff?.slice(0, 7).map((item) => [
              item.name.split(" ").map((part) => part[0]).join("").slice(0, 2),
              item.name,
              `${item.status.replaceAll("_", " ")} · ${item.zoneName}`,
              item.status === "sos" ? "alert" : item.status === "no_signal" ? "off" : item.status === "responding" ? "info" : "ok",
            ]) ?? [
              ["CE", "Cal Ellis", "Responding · North Gate", "ok"],
              ["MC", "Maya Chen", "Available · Level 2", "ok"],
              ["NP", "Nia Patel", "No response · 01:12", "alert"],
            ]).map(([initials, name, status, tone]) => (
              <button type="button" key={name} onClick={() => onFeatureAction(name)}>
                <i className={tone}>{initials}</i>
                <span><b>{name}</b><small>{status}</small></span>
                <Eye size={16} />
              </button>
            ))}
          </div>
        </>
      )}

      {activeNav === "coverage" && (
        <>
          <div className="coverage-score">
            <div><span>{commandState?.coverage ?? 96}</span><em>%</em></div>
            <p><b>VENUE CONFIDENCE</b><small>Position freshness under 5 seconds across 6 of 7 operational zones.</small></p>
          </div>
          <div className="section-title"><span>GATEWAYS & ANCHORS</span><b>LIVE</b></div>
          <div className="health-list">
            {(commandState?.coverageRows?.slice(0, 6) ?? [
              { label: "North Gate mesh", coverage: 100, level: "good" },
              { label: "Arena interior", coverage: 98, level: "good" },
              { label: "Service yard", coverage: 94, level: "good" },
              { label: "South perimeter", coverage: 71, level: "thin" },
            ]).map((row) => (
              <HealthRow
                key={row.id ?? row.label}
                label={row.label}
                value={`${row.coverage}%`}
                tone={row.level === "good" ? "ok" : row.level === "gap" ? "alert" : "caution"}
              />
            ))}
          </div>
          <div className="feature-hero caution">
            <WifiHigh size={22} />
            <span><small>DEGRADED ASSET</small><b>Gateway 07</b><em>Last relay 41s · inspect power</em></span>
            <button type="button" onClick={() => onFeatureAction("gateway-07")}>LOCATE</button>
          </div>
          <button className="panel-action primary" type="button" onClick={() => onFeatureAction("coverage-scan")}>
            <Crosshair size={18} /> {featureState === "coverage-scan" ? "LIVE SCAN RUNNING" : "RUN LIVE COVERAGE SCAN"}
          </button>
        </>
      )}

      {activeNav === "muster" && (
        <>
          <div className="muster-total">
            <span><b>{commandState?.muster?.accounted ?? 749}</b><small>ACCOUNTED FOR</small></span>
            <em>/ {commandState?.muster?.total ?? "1,000"}</em>
          </div>
          <div className="muster-progress"><i style={{ width: `${commandState?.muster?.total ? Math.round(commandState.muster.accounted / commandState.muster.total * 100) : 74.9}%` }} /></div>
          <div className="section-title"><span>MUSTER POINTS</span><b>3 ACTIVE</b></div>
          <div className="health-list">
            <HealthRow label={commandState?.muster?.assemblyPoint ?? "Field A"} value={`${commandState?.muster?.accounted ?? 437} / ${commandState?.muster?.total ?? 500}`} tone="ok" />
            <HealthRow label="Outstanding staff" value={String(commandState?.muster?.outstanding ?? 3)} tone={commandState?.muster?.outstanding ? "alert" : "ok"} />
            <HealthRow label="Mesh check-ins" value={commandState?.sourceLabel ?? "SCRIPTED"} tone="info" />
          </div>
          <div className="plain-rows prominent">
            {(commandState?.staff?.filter((member) => !member.mustered).slice(0, 4) ?? [
              { id: "nia", name: "Nia Patel", zoneName: "Level 2", status: "sos" },
            ]).map((member) => (
              <span key={member.id}><i className={member.status === "sos" ? "alert" : "caution"} /><b>{member.name}</b><em>{member.zoneName} · {member.status.replaceAll("_", " ")}</em></span>
            ))}
          </div>
          <button className="panel-action primary" type="button" onClick={() => onFeatureAction("muster-refresh")}>
            <UsersThree size={18} /> {featureState === "muster-refresh" ? "HEADCOUNT REFRESHED" : "REFRESH HEADCOUNT"}
          </button>
          <button className="panel-action blue" type="button" onClick={() => {
            commandState?.muster?.active ? commandActions?.standDownMuster?.() : commandActions?.callMuster?.();
            onFeatureAction(commandState?.muster?.active ? "muster-stood-down" : "muster-called");
          }}>
            <Flag size={18} /> {commandState?.muster?.active ? "STAND DOWN MUSTER" : "CALL MUSTER"}
          </button>
        </>
      )}

      {activeNav === "assets" && (
        <>
          <div className="feature-stats">
            <Metric label="GATEWAYS" value="7/8" tone="ok" />
            <Metric label="CAMERAS" value="42" tone="info" />
            <Metric label="DOORS" value="18" />
          </div>
          <div className="section-title"><span>ASSET HEALTH</span><b>67 REGISTERED</b></div>
          <div className="asset-grid">
            {[
              ["GW", "Gateway 07", "Degraded · 41s", "caution"],
              ["AN", "Anchor E-04", "Live · 2s", "ok"],
              ["CAM", "Camera L2-18", "Streaming", "ok"],
              ["DOOR", "Door B-14", "Secured", "info"],
              ["GW", "Gateway 03", "Live · 1s", "ok"],
              ["CAM", "Camera N-02", "Maintenance", "caution"],
            ].map(([kind, label, status, tone]) => (
              <button type="button" key={label} onClick={() => onFeatureAction(label)}>
                <i className={tone}>{kind}</i>
                <span><b>{label}</b><small>{status}</small></span>
              </button>
            ))}
          </div>
          <button className="panel-action blue" type="button" onClick={() => onFeatureAction("commissioning")}>
            <SlidersHorizontal size={18} /> OPEN COMMISSIONING VIEW
          </button>
        </>
      )}
      <button
        className="panel-action workspace-link"
        type="button"
        onClick={() => onOpenTool?.({
          incidents: "incident",
          team: "roster",
          coverage: "heatmap",
          muster: "muster",
          assets: "assets",
        }[activeNav])}
      >
        <ArrowRight size={18} /> OPEN FULL OPERATIONAL WORKSPACE
      </button>
    </aside>
  );
}

function HealthRow({ label, value, tone }) {
  return (
    <div className={`health-row ${tone}`}>
      <span><i /><b>{label}</b></span>
      <em>{value}</em>
    </div>
  );
}

function BottomTimeline({ demoId, playing, setPlaying, cursor, setCursor, commandState }) {
  const incident = commandState?.activeIncident;
  const searchOperation = commandState?.searchOperation;
  const liveRows = incident
    ? [
        [incident.kind.toUpperCase(), `${incident.zoneName} · ${incident.status}`, "red", 69],
        ...incident.responders.slice(0, 3).map((responder, index) => [
          responder.displayName,
          `${String(responder.state).replaceAll("_", " ")}${responder.distanceM != null ? ` · ${responder.distanceM}m` : ""}`,
          responder.state === "clear" ? "green" : "green",
          Math.max(42, 82 - index * 12),
        ]),
        ["MESH COVERAGE", `${commandState.coverage}% confidence`, commandState.coverage < 85 ? "amber" : "green", commandState.coverage],
      ]
    : null;
  const searchRows = searchOperation
    ? [
        ["MISSING PERSON", `${searchOperation.subjectName} · last confirmed`, "blue", 46],
        ...searchOperation.teams.map((team, index) => [
          `TEAM ${team.label.toUpperCase()}`,
          `${team.status.replaceAll("_", " ")} · ${team.assignment}`,
          "green",
          Math.max(48, 84 - index * 9),
        ]),
        ["SEARCH PROGRESS", `${searchOperation.sectors.filter((sector) => sector.status === "clear").length}/${searchOperation.sectors.length} sectors clear`, "amber",
          Math.round(searchOperation.sectors.reduce((sum, sector) => sum + sector.progressPct, 0) / searchOperation.sectors.length)],
      ]
    : null;
  const rows = demoId === "fusion-live" && liveRows
    ? liveRows
    : demoId === "sar" && searchRows
      ? searchRows
      : demoId === "sar"
    ? [
        ["MISSING PERSON", "Last contact", "blue", 46],
        ["TEAM ALPHA", "Searching L1 C3", "green", 72],
        ["TEAM BRAVO", "En route to G C4", "green", 84],
        ["K9 UNIT", "Sweep active", "green", 66],
        ["MESH COVERAGE", "96% healthy", "green", 96],
      ]
    : demoId.includes("investigation") || demoId === "person-search"
      ? [
          ["NIA PATEL", "Last verified 22:14:05", "blue", 54],
          ["CAL ELLIS", "En route · 00:46", "green", 76],
          ["MAYA CHEN", "Available · 01:06", "green", 61],
          ["GUARD 12", "Unavailable", "off", 42],
        ]
      : [
          ["MEDICAL", "North Gate · active", "red", 69],
          ["CAL ELLIS", "En route · 00:46", "green", 78],
          ["GUARD 12", "Responding · 01:12", "green", 64],
          ["GATEWAY 07", "Degraded", "amber", 47],
        ];
  return (
    <section className="timeline-dock">
      <div className="timeline-head">
        <button type="button" aria-label={playing ? "Pause timeline" : "Play timeline"} onClick={() => setPlaying((v) => !v)}>{playing ? <Pause size={15} weight="fill" /> : <Play size={15} weight="fill" />}</button>
        <b>ACTIVITY TIMELINE</b>
        <span>22:10</span><span>22:12</span><span>22:14</span><span>22:16</span><strong>22:18</strong><span>22:20</span><span>22:22</span>
        <em>LIVE</em>
      </div>
      <div className="timeline-body">
        <div className="timeline-rows">
          {rows.map(([label, sub, tone, width]) => (
            <div className={`track-row ${tone}`} key={label}>
              <div><b>{label}</b><span>{sub}</span></div>
              <div className="track"><i style={{ width: `${width}%` }} /><span style={{ left: `${width}%` }} /></div>
            </div>
          ))}
          <input type="range" min="8" max="96" value={cursor} onChange={(e) => setCursor(Number(e.target.value))} aria-label="Timeline cursor" />
          <div className="cursor-line" style={{ left: `calc(210px + (100% - 230px) * ${cursor / 100})` }}><span>22:18</span></div>
        </div>
      </div>
    </section>
  );
}

function CommandDock({ demoId, setViewMode, setActiveFloor, setCommandNotice, commandState, commandActions, openTool }) {
  const defaultPrompt = demoId === "sar"
    ? "show unsearched areas within 100 m of last contact"
    : demoId.includes("investigation") || demoId === "person-search"
      ? "isolate Level 2 and show Nia’s last known trail"
      : "show coverage around North Gate";
  const [value, setValue] = useState(defaultPrompt);
  const submit = () => {
    const incident = commandState?.activeIncident;
    if (/acknowledge|accept/i.test(value) && incident?.id) {
      commandActions?.acknowledgeIncident?.(incident.id);
      setCommandNotice(`${incident.id} acknowledged · audit entry written`);
    } else if (/resolve|close incident/i.test(value) && incident?.id) {
      commandActions?.resolveIncident?.(incident.id);
      setCommandNotice(`${incident.id} resolved · operational state reconciled`);
    } else if (/dispatch|send nearest|converge/i.test(value) && incident?.id) {
      commandActions?.dispatchIncident?.(incident.id, value);
      setCommandNotice(`Dispatch sent over mesh · ${incident.id}`);
    } else if (/muster|evacuat/i.test(value)) {
      commandActions?.callMuster?.();
      openTool?.("muster");
      setCommandNotice("Muster called · headcount workspace opened");
    } else if (/audit|search record/i.test(value)) {
      openTool?.("audit");
      setCommandNotice("Assisted search and audit workspace opened");
    } else if (/level 2|trail|nia|last known/i.test(value)) {
      setActiveFloor("L2");
      setViewMode("focus");
      setCommandNotice("Level 2 isolated · last-known trail visible");
    } else if (/unsearched|sector/i.test(value)) {
      setActiveFloor("L1");
      setViewMode("exploded");
      setCommandNotice("Unsearched sectors highlighted within 100 m");
    } else {
      setViewMode("three");
      setCommandNotice("Coverage layer focused on North Gate");
    }
  };
  return (
    <div className="command-dock">
      <Microphone size={20} />
      <span>Ask Loc8:</span>
      <input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
      <button type="button" onClick={submit}><ArrowRight size={18} /></button>
    </div>
  );
}

export function App({
  onOpenTool = () => {},
  commandState = null,
  commandActions = {},
  renderWorkspace = null,
}) {
  const [demoId, setDemoIdState] = useState("fusion-live");
  const demo = useMemo(() => DEMOS.find((item) => item.id === demoId) ?? DEMOS[0], [demoId]);
  const [activeNav, setActiveNav] = useState("live");
  const [viewMode, setViewMode] = useState("three");
  const [activeFloor, setActiveFloor] = useState("ALL");
  const [layers, setLayers] = useState({
    people: true,
    routes: true,
    coverage: true,
    cameras: false,
    search: true,
    muster: true,
  });
  const [selected, setSelected] = useState({ type: "incident", id: "north-gate", label: "Medical · North Gate" });
  const [panelOpen, setPanelOpen] = useState(true);
  const [actionState, setActionState] = useState("");
  const [playing, setPlaying] = useState(true);
  const [cursor, setCursor] = useState(62);
  const [commandNotice, setCommandNotice] = useState("Live operational state · select any marker");
  const [featureState, setFeatureState] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  const openTool = (workspace) => {
    if (!workspace) return;
    if (renderWorkspace) setActiveWorkspace(workspace);
    onOpenTool(workspace);
  };

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setCursor((current) => (current >= 96 ? 8 : current + 1));
    }, 900);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    const incident = commandState?.activeIncident;
    if (!incident || demoId !== "fusion-live") return;
    setSelected({
      type: "incident",
      id: incident.id,
      incidentId: incident.id,
      label: incident.title,
    });
  }, [commandState?.activeIncident?.id, demoId]);

  const setDemoId = (id) => {
    const next = DEMOS.find((item) => item.id === id) ?? DEMOS[0];
    setDemoIdState(id);
    setViewMode(next.defaultView);
    setActiveFloor(id === "sar" ? "ALL" : id === "fusion-live" ? "ALL" : "L2");
    setPanelOpen(true);
    setActionState("");
    setActiveNav("live");
    setFeatureState("");
    setActiveWorkspace(null);
    setSelected(id === "sar"
      ? { type: "sector", id: "sector-c", label: "Search Sector C" }
      : id === "fusion-live"
        ? { type: "incident", id: "north-gate", label: "Medical · North Gate" }
        : { type: "person", id: "nia", label: "Nia Patel" });
    setCommandNotice(`${next.label} loaded · scene state preserved`);
  };

  const toggleLayer = (id) => setLayers((current) => ({ ...current, [id]: !current[id] }));

  const navigateFeature = (next) => {
    if (activeWorkspace) {
      const workspace = WORKSPACE_BY_NAV[next];
      if (workspace) {
        setActiveWorkspace(workspace);
        setActiveNav(next);
        setCommandNotice(`${next.replaceAll("_", " ")} workspace opened`);
      }
      return;
    }
    if (next === "search") {
      openTool("audit");
      setCommandNotice("Assisted search and audit workspace opened");
      return;
    }
    if (next === "commissioning") {
      openTool("commissioning");
      setCommandNotice("Commissioning and Map Builder opened");
      return;
    }
    setActiveNav(next);
    setPanelOpen(true);
    setFeatureState("");
    if (next === "coverage") {
      setLayers((current) => ({ ...current, coverage: true }));
      setSelected({ type: "anchor", id: "anchor-south", label: "South perimeter coverage" });
      setCommandNotice("Coverage workspace · degraded south perimeter highlighted");
    } else if (next === "muster") {
      setLayers((current) => ({ ...current, muster: true, routes: true }));
      setSelected({ type: "muster", id: "muster-east", label: "Muster Field B" });
      setCommandNotice("Muster workspace · live headcount visible");
    } else if (next === "team") {
      setLayers((current) => ({ ...current, people: true }));
      setSelected({ type: "person", id: "cal", label: "Cal Ellis" });
      setCommandNotice("Team workspace · on-duty staff visible");
    } else if (next === "assets") {
      setLayers((current) => ({ ...current, coverage: true, cameras: true }));
      setSelected({ type: "anchor", id: "anchor-south", label: "Gateway 07" });
      setCommandNotice("Asset workspace · infrastructure layers enabled");
    } else if (next === "incidents") {
      setSelected({ type: "incident", id: "medical-north", label: "Medical · North Gate" });
      setCommandNotice("Incident workspace · 2 active events");
    } else {
      setCommandNotice("Live operational state · select any marker");
    }
  };

  const handleFeatureAction = (value) => {
    setFeatureState(value);
    const incident = commandState?.incidents?.find((item) => item.id === value);
    if (incident) {
      commandActions?.selectIncident?.(incident.id);
      setDemoId("fusion-live");
      setSelected({ type: "incident", id: incident.id, incidentId: incident.id, label: incident.title });
      setCommandNotice(`${incident.id} opened · ${incident.zoneName}`);
      return;
    }
    if (value === "medical") {
      setDemoId("fusion-live");
      setSelected({ type: "incident", id: "medical-north", label: "Medical · North Gate" });
      setCommandNotice("Medical incident opened · North Gate");
      return;
    }
    if (value === "welfare" || value === "Nia Patel") {
      setDemoId("fusion-investigation");
      setCommandNotice("Person investigation opened · Nia Patel");
      return;
    }
    if (value === "coverage-scan") {
      setLayers((current) => ({ ...current, coverage: true }));
      setCommandNotice("Live coverage scan running · 7 gateways");
      return;
    }
    if (value === "muster-refresh") {
      setCommandNotice("Muster headcount refreshed · 749 accounted for");
      return;
    }
    if (value === "commissioning") {
      openTool("commissioning");
      setCommandNotice("Commissioning asset layer opened");
      return;
    }
    setSelected({ type: activeNav === "team" ? "person" : "asset", id: String(value).toLowerCase().replaceAll(" ", "-"), label: String(value) });
    setCommandNotice(`${value} selected`);
  };

  const handleSelect = (item) => {
    setSelected(item);
    setPanelOpen(true);
    if (
      item?.incidentId ||
      (item?.type === "incident" && commandState?.sceneIncidents?.some((incident) => incident.id === item.id))
    ) {
      commandActions?.selectIncident?.(item.incidentId ?? item.id);
    }
    setCommandNotice(`${item?.label ?? item?.id ?? "Map object"} selected`);
  };

  const isLive = demoId === "fusion-live";
  const isSar = demoId === "sar";
  const isPerson = demoId === "person-search" || demoId === "fusion-investigation";

  return (
    <div className="command-app">
      <TopBar demo={demo} demoId={demoId} setDemoId={setDemoId} commandState={commandState} />
      <LeftRail activeNav={activeWorkspace ? (NAV_BY_WORKSPACE[activeWorkspace] ?? activeNav) : activeNav} setActiveNav={navigateFeature} commandState={commandState} />

      <main className={`workspace ${panelOpen ? "panel-open" : ""} ${activeWorkspace ? "workspace-tool-open" : ""}`}>
        {activeWorkspace && renderWorkspace ? (
          renderWorkspace({
            workspace: activeWorkspace,
            onClose: () => setActiveWorkspace(null),
            onNavigate: setActiveWorkspace,
          })
        ) : (
          <>
        <section className="scene-shell">
          <VenueScene
            demoId={demoId}
            viewMode={viewMode}
            activeFloor={activeFloor}
            layers={layers}
            selected={selected}
            onSelect={handleSelect}
            people={commandState?.scenePeople}
            incidents={commandState?.sceneIncidents}
            teams={commandState?.sceneTeams}
          />
          <div className="scene-vignette" />
          <ViewControls
            viewMode={viewMode}
            setViewMode={setViewMode}
            activeFloor={activeFloor}
            setActiveFloor={setActiveFloor}
            layers={layers}
            toggleLayer={toggleLayer}
          />
          {isLive
            ? <LiveSummary actionState={actionState} setActionState={setActionState} commandState={commandState} commandActions={commandActions} openTool={openTool} />
            : <SearchSummary reference={isSar ? "sar" : "person"} actionState={actionState} setActionState={setActionState} commandState={commandState} commandActions={commandActions} />}
          <div className="scene-status">
            <i className="live-dot" />
            <span>{commandNotice}</span>
            <b>{selected?.label ?? "No selection"}</b>
          </div>
          {!panelOpen && (
            <button className="open-panel" type="button" onClick={() => setPanelOpen(true)}>
              <ListMagnifyingGlass size={18} /> OPEN DETAILS
            </button>
          )}
        </section>

        {panelOpen && activeNav !== "live" && (
          <FeaturePanel
            activeNav={activeNav}
            onClose={() => setPanelOpen(false)}
            onFeatureAction={handleFeatureAction}
            featureState={featureState}
            onOpenTool={openTool}
            commandState={commandState}
            commandActions={commandActions}
          />
        )}
        {panelOpen && activeNav === "live" && isLive && <IncidentPanel actionState={actionState} setActionState={setActionState} onClose={() => setPanelOpen(false)} onOpenTool={openTool} commandState={commandState} commandActions={commandActions} />}
        {panelOpen && activeNav === "live" && isPerson && <PersonPanel actionState={actionState} setActionState={setActionState} reference={demoId === "person-search"} onOpenTool={openTool} commandState={commandState} commandActions={commandActions} />}
        {panelOpen && activeNav === "live" && isSar && <SarPanel actionState={actionState} setActionState={setActionState} commandState={commandState} commandActions={commandActions} />}
          </>
        )}

        <BottomTimeline demoId={demoId} playing={playing} setPlaying={setPlaying} cursor={cursor} setCursor={setCursor} commandState={commandState} />
        <CommandDock key={`${demoId}-${activeWorkspace ?? "site"}`} demoId={demoId} setViewMode={setViewMode} setActiveFloor={setActiveFloor} setCommandNotice={setCommandNotice} commandState={commandState} commandActions={commandActions} openTool={openTool} />
      </main>
    </div>
  );
}

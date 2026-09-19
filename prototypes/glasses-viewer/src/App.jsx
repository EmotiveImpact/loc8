import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowsOut,
  Bluetooth,
  Buildings,
  CornersIn,
  Broadcast,
  CaretRight,
  CheckCircle,
  CircleNotch,
  Code,
  Desktop,
  DeviceMobile,
  Gear,
  Headset,
  Info,
  Lightning,
  Link,
  ListBullets,
  Play,
  Radio,
  SlidersHorizontal,
  Sparkle,
  User,
  Users,
  WifiHigh,
  WifiSlash,
  X,
} from "@phosphor-icons/react";
import { scenarios, roles } from "./data/scenarios.js";
import { createLiveBridge, venueSummary } from "./model/operationalState.js";
import { useViewerStore } from "./store/useViewerStore.js";
import { GlassesHud } from "./components/Hud.jsx";

function Logo() {
  return (
    <span className="brand">
      LOC<span>8</span>
    </span>
  );
}

function ScenarioRail({ scenario }) {
  const roleFilter = useViewerStore((state) => state.roleFilter);
  const setRoleFilter = useViewerStore((state) => state.setRoleFilter);
  const setScenario = useViewerStore((state) => state.setScenario);

  const filtered = useMemo(
    () => scenarios.filter((item) => roleFilter === "all" || item.role === roleFilter),
    [roleFilter],
  );

  return (
    <aside className="scenario-rail">
      <div className="rail-heading">
        <p>PRODUCT STATES</p>
        <span>16 / 16</span>
      </div>
      <div className="role-filter" role="group" aria-label="Filter scenarios by role">
        <button className={roleFilter === "all" ? "active" : ""} onClick={() => setRoleFilter("all")}>ALL</button>
        <button className={roleFilter === "guard" ? "active" : ""} onClick={() => setRoleFilter("guard")}>GUARD</button>
        <button className={roleFilter === "command" ? "active" : ""} onClick={() => setRoleFilter("command")}>COMMAND</button>
      </div>
      <nav className="scenario-list" aria-label="Glasses scenarios">
        {filtered.map((item) => (
          <button
            key={item.id}
            className={item.id === scenario.id ? "active" : ""}
            onClick={() => setScenario(item.id)}
          >
            <span>{String(item.order).padStart(2, "0")}</span>
            <div>
              <strong>{item.shortTitle}</strong>
              <small>{item.role} · {item.density}</small>
            </div>
            <CaretRight weight="bold" />
          </button>
        ))}
      </nav>
    </aside>
  );
}

function Inspector({ scenario }) {
  const connectionState = useViewerStore((state) => state.connectionState);
  const bridgeUrl = useViewerStore((state) => state.bridgeUrl);
  const bridge = useViewerStore((state) => state.bridge);
  const events = useViewerStore((state) => state.events);
  const setBridgeUrl = useViewerStore((state) => state.setBridgeUrl);
  const setBridge = useViewerStore((state) => state.setBridge);
  const setConnectionState = useViewerStore((state) => state.setConnectionState);
  const addEvent = useViewerStore((state) => state.addEvent);
  const runDemoBeat = useViewerStore((state) => state.runDemoBeat);
  const performAction = useViewerStore((state) => state.performAction);
  const [bridgeError, setBridgeError] = useState("");

  const connect = () => {
    bridge?.stop();
    setBridgeError("");
    setConnectionState("reconnecting");
    try {
      const live = createLiveBridge({
        url: bridgeUrl,
        onStatus: setConnectionState,
        onPacket: addEvent,
      });
      setBridge(live);
      addEvent({
        at: new Date().toLocaleTimeString([], { hour12: false }),
        source: "viewer",
        label: `Connecting to ${bridgeUrl}`,
      });
    } catch (error) {
      setBridgeError(error instanceof Error ? error.message : "Bridge connection failed");
      setConnectionState("offline");
    }
  };

  const disconnect = () => {
    bridge?.stop();
    setBridge(null);
    setConnectionState("simulated");
    addEvent({
      at: new Date().toLocaleTimeString([], { hour12: false }),
      source: "viewer",
      label: "Returned to deterministic simulation",
    });
  };

  return (
    <aside className="inspector">
      <section>
        <p className="inspector-label">CURRENT VIEW</p>
        <h2>{scenario.title}</h2>
        <p>{scenario.description}</p>
        <div className="role-badge">
          {scenario.role === "guard" ? <User weight="fill" /> : <Users weight="fill" />}
          <span><strong>{roles[scenario.role].label}</strong><small>{roles[scenario.role].detail}</small></span>
        </div>
      </section>

      <section>
        <p className="inspector-label">SCENARIO ACTIONS</p>
        <div className="inspector-actions">
          {scenario.actions.map((action, index) => (
            <button key={action} className={index === 0 ? "primary" : ""} onClick={() => performAction(action)}>
              {index === 0 ? <Lightning weight="fill" /> : <CaretRight weight="bold" />}
              {action}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="inspector-label">DATA SOURCE</p>
        <div className={`connection-state state-${connectionState}`}>
          {connectionState === "live" ? <WifiHigh weight="bold" /> : connectionState === "reconnecting" ? <CircleNotch className="spin" /> : connectionState === "offline" ? <WifiSlash /> : <Sparkle weight="fill" />}
          <span>
            <strong>{connectionState === "simulated" ? "SIMULATED ENGINE" : connectionState.toUpperCase()}</strong>
            <small>{connectionState === "simulated" ? "deterministic test data" : bridgeUrl}</small>
          </span>
        </div>
        <label className="bridge-input">
          <span>Guard/Command bridge URL</span>
          <input value={bridgeUrl} onChange={(event) => setBridgeUrl(event.target.value)} />
        </label>
        {bridgeError && <p className="bridge-error">{bridgeError}</p>}
        <div className="bridge-actions">
          <button onClick={connect}><Link weight="bold" /> CONNECT</button>
          <button onClick={disconnect}><X weight="bold" /> SIM MODE</button>
        </div>
        <button className="demo-beat" onClick={runDemoBeat}><Play weight="fill" /> RUN NEXT LIVE BEAT</button>
      </section>

      <section className="event-log">
        <p className="inspector-label">OPERATIONAL EVENT LOG</p>
        {events.slice(0, 6).map((event, index) => (
          <div key={`${event.at}-${index}`}>
            <span>{event.at}</span>
            <p><strong>{event.label}</strong><small>{event.source}</small></p>
          </div>
        ))}
      </section>
    </aside>
  );
}

function ViewerToolbar({ scenario }) {
  const immersive = useViewerStore((state) => state.immersive);
  const toggleImmersive = useViewerStore((state) => state.toggleImmersive);
  const previousScenario = useViewerStore((state) => state.previousScenario);
  const nextScenario = useViewerStore((state) => state.nextScenario);
  const connectionState = useViewerStore((state) => state.connectionState);

  return (
    <div className="viewer-toolbar">
      <div className="scenario-step">
        <button onClick={previousScenario} aria-label="Previous scenario"><ArrowLeft weight="bold" /></button>
        <span><b>{String(scenario.order).padStart(2, "0")}</b> / 16</span>
        <button onClick={nextScenario} aria-label="Next scenario"><ArrowRight weight="bold" /></button>
      </div>
      <div className="viewport-label">
        <Headset weight="fill" />
        <span><strong>OPTICAL VIEW</strong><small>1680 × 945 reference · interactive</small></span>
      </div>
      <div className="toolbar-status">
        <span className={`source-dot source-${connectionState}`} />
        {connectionState === "simulated" ? "SIMULATED" : connectionState.toUpperCase()}
      </div>
      <button className="immersive-button" onClick={toggleImmersive}>
        {immersive ? <CornersIn weight="bold" /> : <ArrowsOut weight="bold" />}
        {immersive ? "EXIT VIEW" : "IMMERSIVE"}
      </button>
    </div>
  );
}

function TechnicalStrip() {
  return (
    <footer className="technical-strip">
      <span><Code weight="bold" /> @loc8/engine</span>
      <span><Buildings weight="bold" /> {venueSummary.levels} levels · {venueSummary.spaces} spaces</span>
      <span><Radio weight="bold" /> {venueSummary.routes} route edges</span>
      <span><Broadcast weight="bold" /> 25-byte mesh protocol</span>
      <span><DeviceMobile weight="bold" /> Guard phone companion boundary</span>
    </footer>
  );
}

export function App() {
  const activeScenarioId = useViewerStore((state) => state.activeScenarioId);
  const activeScenario = useViewerStore((state) => state.activeScenario);
  const immersive = useViewerStore((state) => state.immersive);
  const toast = useViewerStore((state) => state.toast);
  const previousScenario = useViewerStore((state) => state.previousScenario);
  const nextScenario = useViewerStore((state) => state.nextScenario);
  const toggleImmersive = useViewerStore((state) => state.toggleImmersive);
  const scenario = activeScenario();

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowLeft") previousScenario();
      if (event.key === "ArrowRight") nextScenario();
      if (event.key.toLowerCase() === "f") toggleImmersive();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previousScenario, nextScenario, toggleImmersive]);

  useEffect(() => {
    document.title = `Loc8 Glasses · ${scenario.title}`;
  }, [activeScenarioId, scenario.title]);

  return (
    <main className={immersive ? "app immersive" : "app"}>
      <header className="app-header">
        <div className="app-brand">
          <Logo />
          <span>GLASSES VIEWER</span>
          <em>BETA</em>
        </div>
        <div className="app-summary">
          <span><CheckCircle weight="fill" /> 16 PRODUCT STATES</span>
          <span><Desktop weight="bold" /> LOCAL VIEWER</span>
          <span><Bluetooth weight="bold" /> HARDWARE-READY BOUNDARY</span>
        </div>
        <button><Gear weight="bold" /> SETTINGS</button>
      </header>

      <div className="app-layout">
        {!immersive && <ScenarioRail scenario={scenario} />}
        <section className="viewer-stage">
          <ViewerToolbar scenario={scenario} />
          <div className="viewport-wrap">
            <GlassesHud scenario={scenario} />
            <div className="viewer-toast" key={toast}><Info weight="fill" /> {toast}</div>
          </div>
          <div className="viewer-help">
            <span><SlidersHorizontal weight="bold" /> Use the controls or click HUD actions</span>
            <span>← → change state</span>
            <span>F immersive view</span>
          </div>
        </section>
        {!immersive && <Inspector scenario={scenario} />}
      </div>
      {!immersive && <TechnicalStrip />}
    </main>
  );
}

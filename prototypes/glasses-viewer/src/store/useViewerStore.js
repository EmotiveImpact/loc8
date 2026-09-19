import { create } from "zustand";
import { scenarios, scenarioById } from "../data/scenarios.js";
import { createDemoEvent, initialOperations } from "../model/operationalState.js";
import { destinationForAction } from "../model/navigation.js";

const timestamp = () => new Date().toLocaleTimeString([], { hour12: false });
const floorForScenario = (id, currentFloor) => {
  if (id === "site-3d" || id === "multi-incident") return "ALL";
  if (id === "floor-3d" || id === "map-2d") return "L2";
  return currentFloor;
};

export const useViewerStore = create((set, get) => ({
  activeScenarioId: "calm",
  roleFilter: "all",
  immersive: false,
  voiceState: "idle",
  connectionState: "simulated",
  bridgeUrl: "ws://localhost:8787",
  bridge: null,
  floor: "ALL",
  showLayers: {
    people: true,
    routes: true,
    coverage: true,
    cameras: false,
  },
  operations: initialOperations,
  toast: "Viewer ready · simulated engine",
  events: [
    { at: timestamp(), source: "viewer", label: "Sixteen-state product model loaded" },
    { at: timestamp(), source: "shared engine", label: "Synthetic four-level venue compiled" },
  ],
  demoSequence: 0,

  activeScenario: () => scenarioById[get().activeScenarioId],
  setScenario: (id) =>
    set((state) => ({
      activeScenarioId: id,
      floor: floorForScenario(id, state.floor),
      voiceState: "idle",
      toast: `${scenarioById[id].title} opened`,
    })),
  nextScenario: () => {
    const index = scenarios.findIndex((scenario) => scenario.id === get().activeScenarioId);
    const next = scenarios[(index + 1) % scenarios.length];
    set((state) => ({
      activeScenarioId: next.id,
      floor: floorForScenario(next.id, state.floor),
      voiceState: "idle",
      toast: `${next.title} opened`,
    }));
  },
  previousScenario: () => {
    const index = scenarios.findIndex((scenario) => scenario.id === get().activeScenarioId);
    const next = scenarios[(index - 1 + scenarios.length) % scenarios.length];
    set((state) => ({
      activeScenarioId: next.id,
      floor: floorForScenario(next.id, state.floor),
      voiceState: "idle",
      toast: `${next.title} opened`,
    }));
  },
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  toggleImmersive: () => set((state) => ({ immersive: !state.immersive })),
  setVoiceState: (voiceState) => set({ voiceState }),
  setFloor: (floor) => set({ floor, toast: `Floor scope · ${floor}` }),
  toggleLayer: (layer) =>
    set((state) => ({
      showLayers: { ...state.showLayers, [layer]: !state.showLayers[layer] },
      toast: `${layer} layer ${state.showLayers[layer] ? "hidden" : "shown"}`,
    })),
  setBridgeUrl: (bridgeUrl) => set({ bridgeUrl }),
  setBridge: (bridge) => set({ bridge }),
  setConnectionState: (connectionState) => set({ connectionState }),
  addEvent: (event) => set((state) => ({ events: [event, ...state.events].slice(0, 12) })),
  runDemoBeat: () => {
    const sequence = get().demoSequence;
    const event = createDemoEvent(sequence);
    set((state) => ({
      demoSequence: sequence + 1,
      events: [event, ...state.events].slice(0, 12),
      toast: event.label,
    }));
  },
  performAction: (label) => {
    const bridge = get().bridge;
    const active = get().activeScenario();
    const destination = destinationForAction(label);
    let frames = 0;
    if (bridge && /dispatch|divert|send|call|assign|mark/i.test(label)) {
      frames = bridge.sendDispatch(`${active.title} · ${label}`);
    }
    const event = {
      at: timestamp(),
      source: bridge ? "live bridge" : "simulated engine",
      label: `${label}${frames ? ` · ${frames} mesh frames` : ""}`,
    };
    set((state) => ({
      ...(destination ? { activeScenarioId: destination } : {}),
      ...(destination ? { floor: floorForScenario(destination, state.floor) } : {}),
      events: [event, ...state.events].slice(0, 12),
      toast: destination ? `${scenarioById[destination].title} opened` : `${label} · confirmed`,
      voiceState: "confirmed",
    }));
  },
  setToast: (toast) => set({ toast }),
}));

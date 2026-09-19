import {
  compileVenuePackage,
  createSyntheticFourLevelVenue,
} from "@loc8/engine/building/index.ts";
import { BridgedTransport } from "@loc8/engine/transport/BridgedTransport.ts";
import { fragmentText } from "@loc8/engine/core/textFragments.ts";
import { opsMsg } from "@loc8/engine/core/opsMessages.ts";

export const venue = compileVenuePackage(createSyntheticFourLevelVenue());

export const venueSummary = {
  packageId: venue.package.packageId,
  mapVersion: venue.package.mapVersion,
  levels: venue.package.levels.length,
  spaces: venue.package.spaces.length,
  routes: venue.package.routeEdges.length,
  exits: venue.package.portals.filter((portal) => portal.finalExit).length,
  anchors: venue.package.places.filter((place) => place.kind === "anchor").length,
  gateways: venue.package.places.filter((place) => place.kind === "gateway").length,
};

export const initialOperations = {
  people: [
    { id: 101, name: "Cal Ellis", badge: "Guard 12", state: "available", distanceM: 64, eta: "00:46", floor: 0 },
    { id: 102, name: "Maya Chen", badge: "Guard 08", state: "busy", distanceM: 143, eta: "01:39", floor: 1 },
    { id: 105, name: "Nia Patel", badge: "Guard 05", state: "no_response", distanceM: 38, eta: null, floor: 2 },
    { id: 112, name: "Jordan Lee", badge: "Guard 16", state: "available", distanceM: 118, eta: "01:24", floor: 0 },
  ],
  incidents: [
    { id: "INC-0142", kind: "medical", priority: 1, location: "North Gate", status: "active", responders: 2 },
    { id: "INC-0139", kind: "welfare", priority: 2, location: "Level 2", status: "overdue", responders: 0 },
    { id: "INC-0137", kind: "crowd", priority: 3, location: "East Gate", status: "high density", responders: 2 },
  ],
  anchors: [
    { id: "E-02", state: "healthy", signal: -54, battery: 91 },
    { id: "E-03", state: "healthy", signal: -61, battery: 78 },
    { id: "E-04", state: "degraded", signal: -78, battery: 22 },
    { id: "E-05", state: "relaying", signal: -65, battery: 69 },
  ],
  muster: { accounted: 877, total: 1128, assistance: 4 },
};

const packetLabel = (packet) => {
  if (packet.type === "position") return `Position · Guard ${String(packet.senderId).padStart(2, "0")}`;
  if (packet.type === "sos") return `SOS · Guard ${String(packet.senderId).padStart(2, "0")}`;
  if (packet.type === "quickReply") return `Status ${packet.quickReplyCode ?? 0} · Guard ${String(packet.senderId).padStart(2, "0")}`;
  if (packet.type === "text") return `Text fragment · Guard ${String(packet.senderId).padStart(2, "0")}`;
  return `${packet.type} · Guard ${String(packet.senderId).padStart(2, "0")}`;
};

export function createLiveBridge({ url, onStatus, onPacket }) {
  const transport = new BridgedTransport(null, { url, reconnectMs: 3000 });
  transport.onMeshStatus((status) => onStatus(status.connected ? "live" : "reconnecting"));
  transport.onPacket((packet) => {
    onPacket({
      source: "live bridge",
      label: packetLabel(packet),
      packet,
      at: new Date().toLocaleTimeString([], { hour12: false }),
    });
  });
  transport.start();

  let msgId = 400;
  return {
    sendDispatch(label, targetId = 101) {
      const text = opsMsg.dispatch(label);
      const packets = fragmentText({
        senderId: 900,
        targetId,
        msgId: msgId++,
        text,
        timestampSec: Math.floor(Date.now() / 1000),
      });
      packets.forEach((packet) => transport.broadcast(packet));
      return packets.length;
    },
    stop() {
      transport.stop();
    },
  };
}

export function createDemoEvent(sequence = 0) {
  const beats = [
    "Welfare check raised · Nia Patel",
    "Cal Ellis selected · 64 m",
    "Dispatch sent over shared protocol",
    "Guard 12 acknowledged · en route",
    "Anchor E-04 degraded · battery 22%",
    "Muster A updated · 437 / 500",
  ];
  return {
    source: "simulated engine",
    label: beats[sequence % beats.length],
    at: new Date().toLocaleTimeString([], { hour12: false }),
  };
}

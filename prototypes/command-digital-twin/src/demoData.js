const position = (x, z, floorId = "G", y = 0) => ({ x, y, z, floorId });

export const FLOOR_LABELS = [
  { id: "RF", short: "RF", label: "Roof & plant", elevation: 14.4 },
  { id: "L3", short: "03", label: "Hospitality & command", elevation: 10.8 },
  { id: "L2", short: "02", label: "East / west concourse", elevation: 7.2 },
  { id: "L1", short: "01", label: "Main concourse & bowl", elevation: 3.6 },
  { id: "G", short: "00", label: "Field, service & loading", elevation: 0 },
  { id: "SITE", short: "S", label: "External site", elevation: -0.15 },
];

export const FLOOR_OPTIONS = FLOOR_LABELS;

export const VENUE_MODEL = {
  id: "northbank-arena",
  name: "Northbank Arena",
  centre: position(0, 0, "L1", 4),
  bounds: { width: 190, depth: 132 },
  buildings: [
    {
      id: "arena",
      label: "Northbank Arena",
      kind: "arena",
      footprint: { x: 0, z: 0, width: 96, depth: 70, radius: 13 },
      floors: ["G", "L1", "L2", "L3", "RF"],
    },
    {
      id: "west-hall",
      label: "West Exhibition Hall",
      kind: "hall",
      footprint: { x: -70, z: 12, width: 34, depth: 52, radius: 5 },
      floors: ["G", "L1"],
    },
    {
      id: "operations",
      label: "Site operations",
      kind: "operations",
      footprint: { x: 64, z: 29, width: 29, depth: 20, radius: 3 },
      floors: ["G", "L1", "L2"],
    },
  ],
  siteFeatures: [
    { id: "north-gate", label: "North Gate", kind: "gate", at: position(10, -59, "SITE") },
    { id: "east-gate", label: "East Gate", kind: "gate", at: position(89, -3, "SITE") },
    { id: "south-gate", label: "South Gate", kind: "gate", at: position(-6, 59, "SITE") },
    { id: "muster-north", label: "North Muster", kind: "muster", at: position(-48, -52, "SITE") },
    { id: "muster-east", label: "East Muster", kind: "muster", at: position(78, 38, "SITE") },
    { id: "ambulance", label: "Ambulance rendezvous", kind: "response", at: position(68, -48, "SITE") },
  ],
  rooms: [
    { id: "east-concourse", label: "East Concourse", floorId: "L2", x: 37, z: -1, width: 15, depth: 49 },
    { id: "service-b", label: "Service Corridor B", floorId: "L2", x: 22, z: 22, width: 28, depth: 8 },
    { id: "control", label: "Event Control", floorId: "L3", x: -17, z: -27, width: 26, depth: 10 },
    { id: "medical", label: "Medical Room 2", floorId: "L1", x: 39, z: -23, width: 9, depth: 12 },
    { id: "loading", label: "Loading Bay", floorId: "G", x: -32, z: 27, width: 29, depth: 12 },
  ],
};

export const LAYER_DEFINITIONS = [
  { id: "people", label: "People", group: "Live", colour: "#62e5ff", defaultVisible: true },
  { id: "incidents", label: "Incidents", group: "Live", colour: "#ff5c72", defaultVisible: true },
  { id: "routes", label: "Response routes", group: "Live", colour: "#85f9d0", defaultVisible: true },
  { id: "trails", label: "Movement trails", group: "Investigation", colour: "#39a5ff", defaultVisible: true },
  { id: "search", label: "Search sectors", group: "Response", colour: "#b58cff", defaultVisible: false },
  { id: "crowd", label: "Crowd flow", group: "Response", colour: "#ffbd66", defaultVisible: false },
  { id: "muster", label: "Muster areas", group: "Response", colour: "#5ff29c", defaultVisible: false },
  { id: "cameras", label: "Cameras", group: "Infrastructure", colour: "#87a9ff", defaultVisible: false },
  { id: "anchors", label: "Loc8 anchors", group: "Infrastructure", colour: "#31d6d0", defaultVisible: false },
  { id: "coverage", label: "Mesh coverage", group: "Infrastructure", colour: "#45d5ff", defaultVisible: false },
];

export const LAYER_OPTIONS = LAYER_DEFINITIONS;

export const PEOPLE = [
  {
    id: "nia-patel",
    name: "Nia Patel",
    initials: "NP",
    role: "Guest",
    status: "missing",
    colour: "#39a5ff",
    at: position(34, 4, "L2", 7.2),
    lastSeen: "20:41",
    location: "East Concourse · L2",
    detail: "Blue jacket · white trainers · ticket 2E-114",
    device: "Guest pass · signal lost",
  },
  {
    id: "cal-ellis",
    name: "Cal Ellis",
    initials: "CE",
    role: "Response officer",
    status: "responding",
    colour: "#5ff2cc",
    at: position(11, -53, "SITE"),
    location: "North Gate",
    device: "Glasses G-014 · 96%",
  },
  {
    id: "maya-chen",
    name: "Maya Chen",
    initials: "MC",
    role: "Incident commander",
    status: "command",
    colour: "#b58cff",
    at: position(-15, -27, "L3", 10.8),
    location: "Event Control · L3",
    device: "Command 01 · online",
  },
  {
    id: "jo-okafor",
    name: "Jo Okafor",
    initials: "JO",
    role: "Search lead",
    status: "searching",
    colour: "#7aa7ff",
    at: position(25, 20, "L2", 7.2),
    location: "Service Corridor B · L2",
    device: "Glasses G-022 · 83%",
  },
  {
    id: "ravi-singh",
    name: "Ravi Singh",
    initials: "RS",
    role: "Medic",
    status: "responding",
    colour: "#ff657a",
    at: position(40, -20, "L1", 3.6),
    location: "Medical Room 2 · L1",
    device: "Medic unit 2 · online",
  },
  {
    id: "elena-brooks",
    name: "Elena Brooks",
    initials: "EB",
    role: "Zone supervisor",
    status: "available",
    colour: "#5ff29c",
    at: position(-37, 3, "L1", 3.6),
    location: "West Concourse · L1",
    device: "Glasses G-031 · 72%",
  },
  {
    id: "amara-reed",
    name: "Amara Reed",
    initials: "AR",
    role: "Steward",
    status: "searching",
    colour: "#f7cf6b",
    at: position(44, 15, "L2", 7.2),
    location: "East Concourse · L2",
    device: "Radio R-118 · online",
  },
  {
    id: "leo-morgan",
    name: "Leo Morgan",
    initials: "LM",
    role: "Security officer",
    status: "evacuating",
    colour: "#ffb45e",
    at: position(-8, 38, "SITE"),
    location: "South Gate approach",
    device: "Glasses G-007 · 61%",
  },
];

export const INCIDENTS = [
  {
    id: "INC-204",
    code: "P1",
    title: "Missing person · Nia Patel",
    status: "active",
    priority: "high",
    opened: "20:43",
    location: "East Concourse · L2",
    at: position(34, 4, "L2", 7.2),
    owner: "Jo Okafor",
    summary: "Last confirmed by Camera 2E-17; guest-pass signal ended 38 seconds later.",
  },
  {
    id: "INC-219",
    code: "MED",
    title: "Medical assistance",
    status: "responding",
    priority: "urgent",
    opened: "20:47",
    location: "North Gate · outer lane",
    at: position(18, -54, "SITE"),
    owner: "Ravi Singh",
    summary: "Medic unit approaching from East Gate; response route remains clear.",
  },
  {
    id: "INC-221",
    code: "OPS",
    title: "Restricted door held open",
    status: "monitoring",
    priority: "medium",
    opened: "20:49",
    location: "Loading Bay · G",
    at: position(-34, 28, "G", 0),
    owner: "Elena Brooks",
    summary: "Door G-14 open for 01:38; nearest officer notified.",
  },
  {
    id: "INC-231",
    code: "MAJOR",
    title: "Major incident · east structure",
    status: "active",
    priority: "critical",
    opened: "20:52",
    location: "Sector C · east arena",
    at: position(42, 10, "L1", 3.6),
    owner: "Maya Chen",
    summary: "Local alarm, partial mesh loss and unverified occupancy across the east structure.",
  },
];

export const SEARCH_SECTORS = [
  { id: "A", label: "Sector A", area: "West Hall", state: "clear", progress: 100, teamId: "alpha", colour: "#50dfa0" },
  { id: "B", label: "Sector B", area: "North concourse", state: "clear", progress: 100, teamId: "bravo", colour: "#50dfa0" },
  { id: "C", label: "Sector C", area: "East arena", state: "searching", progress: 64, teamId: "charlie", colour: "#ffb45e" },
  { id: "D", label: "Sector D", area: "South service", state: "assigned", progress: 31, teamId: "delta", colour: "#8ca8ff" },
  { id: "E", label: "Sector E", area: "External perimeter", state: "queued", progress: 0, teamId: null, colour: "#788394" },
];

export const TEAM_ASSIGNMENTS = [
  { id: "alpha", name: "Team Alpha", lead: "Elena Brooks", members: 4, sectorId: "A", status: "complete", eta: "Clear" },
  { id: "bravo", name: "Team Bravo", lead: "Cal Ellis", members: 3, sectorId: "B", status: "redeploying", eta: "01:20" },
  { id: "charlie", name: "Team Charlie", lead: "Jo Okafor", members: 5, sectorId: "C", status: "searching", eta: "04:30" },
  { id: "delta", name: "Team Delta", lead: "Leo Morgan", members: 4, sectorId: "D", status: "searching", eta: "06:10" },
  { id: "medical-2", name: "Medic Unit 2", lead: "Ravi Singh", members: 2, sectorId: "C", status: "staged", eta: "Ready" },
];

export const RADIO_LOG = [
  { time: "20:56:18", from: "Charlie 1", text: "Command, entering the east service spine now." },
  { time: "20:55:42", from: "Command", text: "Copy. Sector C remains priority; report every cleared room." },
  { time: "20:55:09", from: "Bravo 1", text: "North concourse clear. Moving to reinforce Charlie." },
  { time: "20:54:31", from: "Medic 2", text: "Staged at East Gate with access lane maintained." },
  { time: "20:53:58", from: "Delta 1", text: "South stairs flowing. No counter-flow observed." },
];

export const MUSTER_COUNTS = {
  totalExpected: 2480,
  accountedFor: 2326,
  unverified: 154,
  percent: 94,
  areas: [
    { id: "north", label: "North Muster", count: 1084, capacity: 1300, trend: "+38/min" },
    { id: "east", label: "East Muster", count: 762, capacity: 900, trend: "+22/min" },
    { id: "south", label: "South Muster", count: 480, capacity: 800, trend: "+14/min" },
  ],
};

const liveTimeline = [
  { time: "20:41", type: "person", title: "Nia Patel last confirmed", detail: "Camera 2E-17 · East Concourse" },
  { time: "20:43", type: "incident", title: "INC-204 opened", detail: "Missing-person workflow started" },
  { time: "20:47", type: "medical", title: "Medical call received", detail: "North Gate · outer lane" },
  { time: "20:49", type: "door", title: "Door G-14 alert", detail: "Loading Bay · supervisor notified" },
  { time: "20:51", type: "route", title: "Cal Ellis rerouted", detail: "North Gate route remains clear" },
];

const investigationTimeline = [
  { time: "20:39:48", type: "camera", title: "Camera 2E-11", detail: "Nia enters East Concourse with two guests" },
  { time: "20:40:26", type: "anchor", title: "Anchor A2-044", detail: "Guest pass detected · confidence 92%" },
  { time: "20:41:07", type: "camera", title: "Last visual", detail: "Nia turns toward Service Corridor B" },
  { time: "20:41:45", type: "signal", title: "Signal lost", detail: "No detection after anchor A2-051" },
  { time: "20:43:12", type: "incident", title: "INC-204 created", detail: "Jo Okafor assigned as search lead" },
  { time: "20:44:30", type: "dispatch", title: "Search pair dispatched", detail: "Cal Ellis and Amara Reed notified" },
];

const sarTimeline = [
  { time: "20:52:04", type: "alarm", title: "East local alarm", detail: "Multiple sources · Sector C" },
  { time: "20:52:31", type: "incident", title: "Major incident declared", detail: "Maya Chen assumes command" },
  { time: "20:53:10", type: "evacuation", title: "Phased evacuation begins", detail: "East and south zones first" },
  { time: "20:54:02", type: "search", title: "Search sectors assigned", detail: "Four teams deployed" },
  { time: "20:55:09", type: "clear", title: "Sector B clear", detail: "Bravo redeploying to Sector C" },
  { time: "20:56:18", type: "search", title: "Sector C at 64%", detail: "East service spine entered" },
];

const demo = (config) => ({
  venue: VENUE_MODEL,
  floors: FLOOR_LABELS,
  layers: LAYER_DEFINITIONS,
  people: PEOPLE,
  incidents: INCIDENTS,
  searchSectors: SEARCH_SECTORS,
  teams: TEAM_ASSIGNMENTS,
  radioLog: RADIO_LOG,
  muster: MUSTER_COUNTS,
  ...config,
});

const SCENARIOS = {
  "fusion-live-site": demo({
    id: "fusion-live-site",
    navLabel: "Fusion · Live",
    eyebrow: "COMMAND / LIVE SITE",
    title: "Northbank Arena",
    subtitle: "Event night · 20:51:34 · Live",
    intent: "A balanced everyday command workspace combining the clean exploded venue with the richer campus controls.",
    mode: "live",
    camera: "site",
    selectedIncidentId: "INC-219",
    selectedPersonId: "cal-ellis",
    selectedFloorId: null,
    activeLayers: ["people", "incidents", "routes"],
    metrics: [
      { id: "attendance", label: "Attendance", value: "12,480", detail: "82% capacity", state: "neutral" },
      { id: "staff", label: "Staff online", value: "48 / 51", detail: "3 on break", state: "good" },
      { id: "incidents", label: "Active incidents", value: "3", detail: "1 urgent", state: "warning" },
      { id: "mesh", label: "Mesh health", value: "96%", detail: "18 / 19 gateways", state: "good" },
    ],
    timeline: liveTimeline,
  }),
  "fusion-investigation": demo({
    id: "fusion-investigation",
    navLabel: "Fusion · Investigate",
    eyebrow: "COMMAND / PERSON INVESTIGATION",
    title: "Find Nia Patel",
    subtitle: "INC-204 · Active for 08:22",
    intent: "A cinematic floor cutaway with the stronger investigation panel, movement evidence and dispatch workflow.",
    mode: "investigation",
    camera: "floor-focus",
    selectedIncidentId: "INC-204",
    selectedPersonId: "nia-patel",
    selectedFloorId: "L2",
    activeLayers: ["people", "incidents", "routes", "trails", "cameras"],
    metrics: [
      { id: "elapsed", label: "Time missing", value: "08:22", detail: "Since 20:41", state: "warning" },
      { id: "confidence", label: "Last fix", value: "92%", detail: "Anchor A2-044", state: "good" },
      { id: "responders", label: "Searching", value: "4", detail: "2 approaching", state: "neutral" },
      { id: "coverage", label: "Area checked", value: "61%", detail: "L2 east", state: "neutral" },
    ],
    timeline: investigationTimeline,
  }),
  "person-search": demo({
    id: "person-search",
    navLabel: "Concept · Person",
    eyebrow: "INCIDENT / PERSON SEARCH",
    title: "Nia Patel · last known position",
    subtitle: "East Concourse · Level 02 · 20:41",
    intent: "A faithful version of the focused person-search concept: one opened floor, evidence trail and decisive right rail.",
    mode: "investigation",
    camera: "floor-cutaway",
    selectedIncidentId: "INC-204",
    selectedPersonId: "nia-patel",
    selectedFloorId: "L2",
    activeLayers: ["people", "routes", "trails", "cameras", "anchors"],
    metrics: [
      { id: "last-seen", label: "Last seen", value: "20:41", detail: "Camera 2E-17", state: "warning" },
      { id: "search-radius", label: "Search radius", value: "84 m", detail: "6 spaces", state: "neutral" },
      { id: "nearby", label: "Nearby staff", value: "6", detail: "4 available", state: "good" },
      { id: "cameras", label: "Cameras checked", value: "7 / 12", detail: "Next: 2E-22", state: "neutral" },
    ],
    timeline: investigationTimeline,
  }),
  "search-and-rescue": demo({
    id: "search-and-rescue",
    navLabel: "Concept · SAR",
    eyebrow: "MAJOR INCIDENT / SEARCH & RESCUE",
    title: "Northbank Arena · Sector C",
    subtitle: "INC-231 · Major incident · 20:56:18",
    intent: "A faithful campus-scale response view with exploded floors, search sectors, muster, radio and team coordination.",
    mode: "major-incident",
    camera: "exploded-site",
    selectedIncidentId: "INC-231",
    selectedPersonId: "maya-chen",
    selectedFloorId: null,
    selectedSectorId: "C",
    activeLayers: ["people", "incidents", "routes", "search", "crowd", "muster", "coverage"],
    metrics: [
      { id: "accounted", label: "Accounted for", value: "2,326", detail: "94% of expected", state: "good" },
      { id: "unverified", label: "Unverified", value: "154", detail: "Falling · 74/min", state: "warning" },
      { id: "teams", label: "Search teams", value: "4", detail: "16 responders", state: "neutral" },
      { id: "mesh", label: "Mesh health", value: "88%", detail: "2 nodes degraded", state: "warning" },
    ],
    timeline: sarTimeline,
  }),
};

export const DEMO_ORDER = [
  "fusion-live-site",
  "fusion-investigation",
  "person-search",
  "search-and-rescue",
];

const DEMO_ALIASES = {
  live: "fusion-live-site",
  fusion: "fusion-live-site",
  investigate: "fusion-investigation",
  investigation: "fusion-investigation",
  person: "person-search",
  search: "person-search",
  sar: "search-and-rescue",
  rescue: "search-and-rescue",
};

const toDemo = (id) => {
  const source = SCENARIOS[id];
  const incident = INCIDENTS.find((item) => item.id === source.selectedIncidentId);
  const person = PEOPLE.find((item) => item.id === source.selectedPersonId);
  const floor = FLOOR_LABELS.find((item) => item.id === source.selectedFloorId);
  const sector = SEARCH_SECTORS.find((item) => item.id === source.selectedSectorId);
  const team = sector
    ? TEAM_ASSIGNMENTS.find((item) => item.id === sector.teamId)
    : TEAM_ASSIGNMENTS.find((item) => item.lead === person?.name);

  return {
    id,
    label: source.navLabel,
    kicker: source.eyebrow,
    title: source.title,
    scenario: {
      ...source,
      topStats: source.metrics,
      floor,
      layers: LAYER_DEFINITIONS.map((layer) => ({
        ...layer,
        active: source.activeLayers.includes(layer.id),
      })),
      incident,
      person,
      team,
      sector,
    },
  };
};

export const DEMOS = DEMO_ORDER.map(toDemo);
export const DEMO_BY_ID = Object.fromEntries(DEMOS.map((item) => [item.id, item]));
export const DEMO_OPTIONS = DEMOS.map(({ id, label }) => ({ id, label }));

export function resolveDemo(input, fallbackId = DEMO_ORDER[0]) {
  const raw =
    input instanceof URLSearchParams
      ? input.get("demo")
      : typeof input === "object" && input
        ? input.demo ?? input.id
        : input;
  const key = String(raw ?? "").trim().toLowerCase();
  return (
    DEMO_BY_ID[key] ??
    DEMO_BY_ID[DEMO_ALIASES[key]] ??
    DEMO_BY_ID[fallbackId] ??
    DEMO_BY_ID[DEMO_ORDER[0]]
  );
}

export function getPerson(id) {
  return PEOPLE.find((person) => person.id === id);
}

export function getIncident(id) {
  return INCIDENTS.find((incident) => incident.id === id);
}

export function getFloor(id) {
  return FLOOR_LABELS.find((floor) => floor.id === id);
}

export function getSelectedContext(selectedDemo) {
  const selected = typeof selectedDemo === "string" ? resolveDemo(selectedDemo) : selectedDemo;
  const current = selected?.scenario ?? selected;
  return {
    demo: selected,
    incident: getIncident(current?.selectedIncidentId),
    person: getPerson(current?.selectedPersonId),
    floor: getFloor(current?.selectedFloorId),
    sector: SEARCH_SECTORS.find((sector) => sector.id === current?.selectedSectorId),
  };
}

export default DEMOS;

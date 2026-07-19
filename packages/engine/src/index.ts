// @loc8/engine — shared, app-agnostic engine for the Loc8 family of apps
// (Consumer / Guard / Command). Pure logic + mesh + comms + haptics + store +
// shared design tokens. Screens, navigation and app-only UI live in each app.

// --- core: packets, geo, plus codes, trust, text fragments, types ---
export * from './core/types';
export * from './core/geoMath';
export * from './core/plusCodes';
export * from './core/trustLayer';
export * from './core/packetCodec';
export * from './core/textFragments';
export * from './core/guardStatus';
export * from './core/opsMessages';
export * from './core/proximity';
export * from './core/floorMath';
export * from './core/floorTracker';

// --- transport: location transport contract + implementations ---
export * from './transport/LocationTransport';
export * from './transport/SimulatedTransport';
export * from './transport/BleMeshTransport';
export * from './transport/BridgedTransport';
export * from './transport/seededRandom';

// --- services: mesh orchestration, haptics, notifications, permissions, boot ---
export * from './services/appServices';
export * from './services/meshService';
export * from './services/haptics';
export * from './services/floorService';
export * from './services/notifications';
export * from './services/notificationRouting';
export * from './services/blePermissions';

// --- state: crew store + mesh debug store ---
export * from './state/crewStore';
export * from './state/meshDebugStore';

// --- shared design tokens ---
export * from './ui/theme';

// Metro config for the Loc8 monorepo.
//
// The Consumer app lives at the repo root, which is ALSO the npm-workspaces
// root. Shared code lives in packages/* (e.g. @loc8/engine). SDK 57's
// `expo/metro-config` already handles monorepos automatically, but we make the
// workspace boundaries explicit so the shared engine is always watched and
// resolved from the single hoisted node_modules — and so future apps under
// apps/* inherit the same, predictable resolution.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = projectRoot; // app == workspace root in this layout

const config = getDefaultConfig(projectRoot);

// Watch the shared engine so Metro transforms its TypeScript source.
config.watchFolders = [
  projectRoot,
  path.resolve(workspaceRoot, 'packages/engine'),
];

// Resolve dependencies from the single hoisted node_modules at the root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

module.exports = config;

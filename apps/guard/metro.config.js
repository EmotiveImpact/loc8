// Metro config for the Loc8 Guard app (apps/guard) in the monorepo.
//
// Guard is a workspace app: its project root is apps/guard, but its dependencies
// and the shared engine (packages/engine = @loc8/engine) are hoisted to the repo
// root's single node_modules. We follow Expo's documented monorepo setup:
// watch the whole workspace, resolve from both node_modules folders, and disable
// hierarchical lookup so a stray nested node_modules can't shadow the hoisted one.
// See https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the workspace root so Metro transforms the shared engine's TS source.
config.watchFolders = [workspaceRoot];

// Resolve deps from the app first, then the hoisted root node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;

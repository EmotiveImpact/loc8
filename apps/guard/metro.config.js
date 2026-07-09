// Metro config for the Guard app inside the Loc8 monorepo (mirrors the root
// consumer app's config — see /metro.config.js). Watches the workspace root so
// @loc8/engine source and modules/loc8-mesh resolve, from the single hoisted
// node_modules.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Hoisted single-version workspace: don't let a stray nested node_modules win.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;

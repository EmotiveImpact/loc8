// SDK 57 detects the npm workspace; preserve its default module resolution.
// https://docs.expo.dev/guides/monorepos/#automatic-configuration-migrating-to-sdk-52
const { getDefaultConfig } = require('expo/metro-config');
module.exports = getDefaultConfig(__dirname);

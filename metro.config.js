// Expo SDK 57 configures this npm workspace and shared engine automatically.
// https://docs.expo.dev/guides/monorepos/#automatic-configuration-migrating-to-sdk-52
const { getDefaultConfig } = require('expo/metro-config');
module.exports = getDefaultConfig(__dirname);

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { meshFieldAccess } from './meshFieldAccess';

const config = Constants.expoConfig;
export const MESH_FIELD_ACCESS = meshFieldAccess({
  development: __DEV__,
  kit: process.env.EXPO_PUBLIC_MESH_FIELD_KIT,
  transport: process.env.EXPO_PUBLIC_TRANSPORT,
  mode: process.env.EXPO_PUBLIC_MESH_RELAY_MODE,
  marker: config?.extra?.loc8FieldBuild,
  applicationId: Platform.OS === 'ios' ? config?.ios?.bundleIdentifier : config?.android?.package,
});

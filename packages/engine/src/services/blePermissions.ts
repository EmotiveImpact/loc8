// src/services/blePermissions.ts
// Runtime BLE permission requests for the real mesh transport (spike brief §2).
// Android 12+ (API 31) gates scanning/advertising/connecting behind the
// runtime BLUETOOTH_SCAN / BLUETOOTH_ADVERTISE / BLUETOOTH_CONNECT permissions;
// we also request ACCESS_FINE_LOCATION because we do NOT declare
// `neverForLocation` on BLUETOOTH_SCAN (RSSI proximity), so scan results are
// location-gated. Pre-31, scanning only needs ACCESS_FINE_LOCATION (the legacy
// BLUETOOTH/BLUETOOTH_ADMIN permissions are install-time).
// iOS prompts natively when CBCentralManager/CBPeripheralManager initialize.
import { PermissionsAndroid, Platform, type Permission } from 'react-native';

/**
 * Request every runtime permission the Android mesh needs. Resolves true when
 * all are granted (or the platform needs none). Never throws.
 */
export async function ensureBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const apiLevel = typeof Platform.Version === 'number'
    ? Platform.Version
    : parseInt(String(Platform.Version), 10);

  const permissions: Permission[] = apiLevel >= 31
    ? [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]
    : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

  try {
    const results = await PermissionsAndroid.requestMultiple(permissions);
    return permissions.every((p) => results[p] === PermissionsAndroid.RESULTS.GRANTED);
  } catch {
    return false;
  }
}

/** Encode-only Open Location Code (Plus Code), 10 digits (~14m cell). Zero deps, fully offline. */
const ALPHABET = '23456789CFGHJMPQRVWX';
// Degrees covered by each digit pair, expressed in integer units of 1/8000°.
const PAIR_UNITS = [160000, 8000, 400, 20, 1];

export function encodePlusCode(latitude: number, longitude: number): string {
  const lat = Math.min(Math.max(latitude, -90), 90);
  let lon = longitude;
  while (lon < -180) lon += 360;
  while (lon >= 180) lon -= 360;

  // Integer grid units (1 unit = 1/8000 degree). Epsilon guards float edges like x.5 exactly.
  let latVal = Math.floor((lat + 90) * 8000 + 1e-9);
  let lonVal = Math.floor((lon + 180) * 8000 + 1e-9);
  if (latVal >= 180 * 8000) latVal = 180 * 8000 - 1; // clip north pole into the last cell

  let code = '';
  for (const unit of PAIR_UNITS) {
    code += ALPHABET[Math.floor(latVal / unit) % 20];
    code += ALPHABET[Math.floor(lonVal / unit) % 20];
  }
  return code.slice(0, 8) + '+' + code.slice(8);
}

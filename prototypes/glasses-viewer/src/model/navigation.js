export const actionDestinations = Object.freeze({
  "explode floors": "floor-3d",
  "switch to 2d": "map-2d",
  "2d bird's-eye": "map-2d",
  "switch to 3d": "floor-3d",
  "3d floor": "floor-3d",
  "3d site": "site-3d",
  "show site": "site-3d",
  "open incident": "incident",
  "view route": "map-2d",
});

export function destinationForAction(label) {
  return actionDestinations[label.toLowerCase()] ?? null;
}

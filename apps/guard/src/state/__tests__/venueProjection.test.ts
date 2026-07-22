import { GUARD_VENUE_PACKAGE, GUARD_VENUE_ZONES, VENUE_LEVELS } from '../guardTeam';

describe('Guard semantic venue projection', () => {
  it('derives visible levels from the shared package through the legacy wire boundary', () => {
    expect(VENUE_LEVELS).toEqual([
      { floor: 2, name: 'Level 2', short: 'L2' },
      { floor: 1, name: 'Level 1', short: 'L1' },
      { floor: 0, name: 'Ground Floor', short: 'G' },
      { floor: -1, name: 'Basement', short: 'B1' },
    ]);
    expect(GUARD_VENUE_PACKAGE.buildingId).toBe('building.synthetic.hq');
    expect(GUARD_VENUE_ZONES.map((zone) => zone.levelId)).toEqual([
      'level.basement', 'level.ground', 'level.one', 'level.two',
    ]);
  });
});

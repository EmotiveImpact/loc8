import { encodePlusCode } from '../plusCodes';

describe('encodePlusCode (10-digit Open Location Code)', () => {
  it('matches the official OLC test vector', () => {
    expect(encodePlusCode(20.3700625, 2.7821875)).toBe('7FG49QCJ+2V');
  });
  it('encodes the null island area', () => {
    expect(encodePlusCode(0, 0)).toBe('6FG22222+22');
  });
  it('clips latitude at the poles without crashing', () => {
    expect(encodePlusCode(90, 0)).toMatch(/^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2}$/);
  });
  it('normalizes longitude beyond ±180', () => {
    expect(encodePlusCode(20.3700625, 2.7821875 + 360)).toBe('7FG49QCJ+2V');
  });
});

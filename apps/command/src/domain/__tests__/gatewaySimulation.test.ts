import { createCommandLocalDemo } from '../commissioning';
import {
  COMMAND_GATEWAY_SIMULATION_KEY,
  clearCommandGatewaySimulation,
  installCommandGatewaySimulation,
  loadCommandGatewaySimulation,
  reconcileCommandGatewaySimulation,
  type KeyValueStorage,
} from '../gatewaySimulation';
import { createSyntheticFourLevelVenue } from '../../engine';

class MemoryStorage implements KeyValueStorage {
  value: string | null = null;
  getThrows = false;
  setDrops = false;

  getItem(key: string) {
    expect(key).toBe(COMMAND_GATEWAY_SIMULATION_KEY);
    if (this.getThrows) throw new Error('unavailable');
    return this.value;
  }

  setItem(key: string, value: string) {
    expect(key).toBe(COMMAND_GATEWAY_SIMULATION_KEY);
    if (!this.setDrops) this.value = value;
  }

  removeItem(key: string) {
    expect(key).toBe(COMMAND_GATEWAY_SIMULATION_KEY);
    this.value = null;
  }
}

function localDemo() {
  return createCommandLocalDemo(createSyntheticFourLevelVenue(), '2026-07-22T12:00:00.000Z');
}

describe('Command offline Gateway simulation adapter', () => {
  it('installs, reloads and reconciles an explicitly simulated copy', () => {
    const storage = new MemoryStorage();
    const venue = localDemo();
    const installed = installCommandGatewaySimulation(venue, 1_800_000_000_000, storage);
    expect(installed).toMatchObject({
      evidenceClass: 'simulation-only',
      gatewaySimulatorId: 'gateway.simulator.command.01',
      mapVersion: venue.mapVersion,
    });
    expect(Object.isFrozen(installed)).toBe(true);
    expect(loadCommandGatewaySimulation(storage)).toMatchObject({ status: 'loaded', snapshot: { mapVersion: venue.mapVersion } });
    expect(reconcileCommandGatewaySimulation(installed, venue).outcome).toBe('in-sync');
  });

  it('fails closed for absent, corrupt and unavailable storage', () => {
    const storage = new MemoryStorage();
    expect(loadCommandGatewaySimulation(storage)).toEqual({ status: 'empty', snapshot: null, error: null });
    storage.value = '{bad-json';
    expect(loadCommandGatewaySimulation(storage)).toEqual({ status: 'invalid', snapshot: null, error: 'snapshot-invalid' });
    storage.getThrows = true;
    expect(loadCommandGatewaySimulation(storage)).toEqual({ status: 'invalid', snapshot: null, error: 'storage-unavailable' });
  });

  it('does not report an install when storage drops the write', () => {
    const storage = new MemoryStorage();
    storage.setDrops = true;
    expect(() => installCommandGatewaySimulation(localDemo(), 1_800_000_000_000, storage)).toThrow('not retained');
  });

  it('rejects drafts and clears only the simulated replica', () => {
    const storage = new MemoryStorage();
    expect(() => installCommandGatewaySimulation(createSyntheticFourLevelVenue(), 1_800_000_000_000, storage)).toThrow('simulation-requires-local-demo');
    installCommandGatewaySimulation(localDemo(), 1_800_000_000_000, storage);
    clearCommandGatewaySimulation(storage);
    expect(loadCommandGatewaySimulation(storage).status).toBe('empty');
  });
});

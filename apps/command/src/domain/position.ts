import {
  makePositionReceipt, newerPosition, positionFreshness, positionElapsedClock,
  type Packet, type PositionElapsedClock, type PositionReceipt,
} from '../engine';
import type { StaffMember } from './types';

/** Never infer a position time from lastPingSec: status/muster also updates it. */
export function staffPositionFreshness(
  staff: StaffMember, nowSec: number, clock: PositionElapsedClock = positionElapsedClock(),
) {
  const allowed = ['on_duty_staff', 'sos', 'opt_in_medical', 'family_crew'].includes(staff.consent);
  return positionFreshness({
    location: staff.location, receipt: staff.positionReceipt,
    visible: allowed && staff.positionVisible !== false,
    visibleUntilSec: staff.positionVisibleUntilSec,
  }, nowSec, clock);
}

/** Live transport timestamps are claims, not authenticated GPS observation time. */
export function prepareStaffPosition(
  current: StaffMember | undefined, packet: Packet, receivedAtSec: number,
  clock: PositionElapsedClock = positionElapsedClock(),
): PositionReceipt | undefined {
  if (packet.type !== 'position' || !Number.isInteger(packet.senderId) ||
      packet.senderId < 0 || packet.senderId > 0xffffffff ||
      !newerPosition(packet.timestampSec, current?.positionReceipt?.reportedAtSec)) return undefined;
  return makePositionReceipt(packet, packet.timestampSec, receivedAtSec, 'unverified', clock);
}

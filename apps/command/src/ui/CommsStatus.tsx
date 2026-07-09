// The wedge, on screen: infrastructure comms are DOWN and the console still
// works, because presence/dispatch ride the phone-to-phone mesh. In the field
// these states come from real link monitors; the sim pins cellular/wifi down —
// the exact scenario the product is bought for (docs/strategy/security-vertical.md).
import { useCommandStore } from '../store/commandStore';

function Link({ label, up, detail }: { label: string; up: boolean; detail: string }) {
  return (
    <div className={`comms ${up ? 'up' : 'down'}`}>
      <span className="cdot" aria-hidden />
      <span className="clabel">{label}</span>
      <span className="cstate">{up ? 'LIVE' : 'DOWN'}</span>
      <span className="cdetail">{detail}</span>
    </div>
  );
}

export function CommsStatus() {
  const staff = useCommandStore((s) => s.staff);
  const live = useCommandStore((s) => s.liveConnected);
  const meshNodes = Object.values(staff).filter((s) => s.status !== 'no_signal').length;
  return (
    <div className="commswrap" role="group" aria-label="Communication links status">
      <Link label="CELLULAR" up={false} detail="congested / no service" />
      <Link label="VENUE WIFI" up={false} detail="unavailable" />
      <Link label="MESH" up detail={`${meshNodes} nodes · phone-to-phone`} />
      {live && <Link label="BRIDGE" up detail="gateway phone · real frames" />}
    </div>
  );
}

import { BridgedTransport, type BridgeSocket } from '../BridgedTransport';
import { encodePacket, PACKET_SIZE } from '../../core/packetCodec';
import type { LocationTransport } from '../LocationTransport';
import type { Packet } from '../../core/types';

const mkPacket = (over: Partial<Packet> = {}): Packet => ({
  type: 'position',
  senderId: 7,
  targetId: 0,
  latitude: 51.4924,
  longitude: -0.1003,
  headingDeg: 0,
  batteryPct: 90,
  timestampSec: 1000,
  accuracyM: 10,
  ...over,
});

class FakeSocket implements BridgeSocket {
  readyState = 0;
  binaryType = '';
  sent: ArrayBuffer[] = [];
  private listeners = new Map<string, Array<(ev: any) => void>>();
  send(data: ArrayBuffer) {
    this.sent.push(data);
  }
  close() {
    this.fire('close', {});
  }
  addEventListener(type: string, cb: (ev: any) => void) {
    const list = this.listeners.get(type) ?? [];
    list.push(cb);
    this.listeners.set(type, list);
  }
  open() {
    this.readyState = 1;
    this.fire('open', {});
  }
  receive(buf: ArrayBuffer) {
    this.fire('message', { data: buf });
  }
  private fire(type: string, ev: any) {
    for (const cb of this.listeners.get(type) ?? []) cb(ev);
  }
}

class FakeMesh implements LocationTransport {
  broadcasted: Packet[] = [];
  private cbs: Array<(p: Packet, via?: string) => void> = [];
  start() {}
  stop() {}
  broadcast(p: Packet) {
    this.broadcasted.push(p);
  }
  onPacket(cb: (p: Packet, via?: string) => void) {
    this.cbs.push(cb);
  }
  onMeshStatus() {}
  clearListeners() {
    this.cbs = [];
  }
  deliver(p: Packet) {
    for (const cb of this.cbs) cb(p);
  }
}

const setup = (inner: LocationTransport | null) => {
  const sock = new FakeSocket();
  const t = new BridgedTransport(inner, { url: 'ws://test', reconnectMs: 0, wsFactory: () => sock });
  return { sock, t };
};

describe('BridgedTransport — console mode (no local mesh)', () => {
  it('delivers relay frames as decoded packets tagged relayVia=bridge', () => {
    const { sock, t } = setup(null);
    const got: Array<[Packet, string | undefined]> = [];
    t.onPacket((p, via) => got.push([p, via]));
    t.start();
    sock.open();
    sock.receive(encodePacket(mkPacket({ type: 'sos' })));
    expect(got).toHaveLength(1);
    expect(got[0][0].type).toBe('sos');
    expect(got[0][0].senderId).toBe(7);
    expect(got[0][1]).toBe('bridge');
  });

  it('broadcast() sends the raw 25-byte frame up the socket', () => {
    const { sock, t } = setup(null);
    t.start();
    sock.open();
    t.broadcast(mkPacket({ type: 'quickReply', quickReplyCode: 2 }));
    expect(sock.sent).toHaveLength(1);
    expect(sock.sent[0].byteLength).toBe(PACKET_SIZE);
  });

  it('drops malformed frames without crashing', () => {
    const { sock, t } = setup(null);
    const got: Packet[] = [];
    t.onPacket((p) => got.push(p));
    t.start();
    sock.open();
    sock.receive(new ArrayBuffer(3));
    expect(got).toHaveLength(0);
  });
});

describe('BridgedTransport — gateway mode (wrapping a mesh)', () => {
  it('mirrors mesh packets up the socket AND to local listeners', () => {
    const mesh = new FakeMesh();
    const { sock, t } = setup(mesh);
    const got: Packet[] = [];
    t.onPacket((p) => got.push(p));
    t.start();
    sock.open();
    mesh.deliver(mkPacket({ senderId: 101 }));
    expect(got).toHaveLength(1); // app still sees the mesh packet
    expect(sock.sent).toHaveLength(1); // and Command gets the frame
  });

  it('broadcast() reaches both the mesh and the socket', () => {
    const mesh = new FakeMesh();
    const { sock, t } = setup(mesh);
    t.start();
    sock.open();
    t.broadcast(mkPacket());
    expect(mesh.broadcasted).toHaveLength(1);
    expect(sock.sent).toHaveLength(1);
  });

  it('queues nothing while the socket is closed (mesh keeps working)', () => {
    const mesh = new FakeMesh();
    const { sock, t } = setup(mesh);
    t.start(); // socket never opened
    t.broadcast(mkPacket());
    expect(mesh.broadcasted).toHaveLength(1);
    expect(sock.sent).toHaveLength(0);
  });
});

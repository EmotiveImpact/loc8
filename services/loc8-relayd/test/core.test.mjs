import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { RelaydCore } from '../src/core.mjs';
import { FRAME_BYTES } from '../src/contracts.mjs';
import { FakeAudit, FakeSink, SharedReplay, connect, makeCore, principal } from './support.mjs';

const frame = (value = 1) => new Uint8Array(FRAME_BYTES).fill(value);

describe('fail-closed product configuration', () => {
  test('requires identity, persistence, policy and audit ports', () => {
    assert.throws(() => new RelaydCore({}), /capabilityVerifier/);
  });

  test('rejects unsafe TLS, Origin and finite-bound configuration', () => {
    assert.throws(() => makeCore({ tls: { mode: 'plaintext' } }), /invalid_tls_config/);
    assert.throws(() => makeCore({ tls: { mode: 'trusted_proxy', trustedProxyAddresses: new Set() } }), /invalid_tls_config/);
    assert.throws(() => makeCore({ limits: { maxQueueBytes: 0 } }), /maxQueueBytes/);
    assert.throws(() => new RelaydCore({
      verifier: { verify() {} }, revocations: { isRevoked() {} }, replay: { consume() {} },
      policy: { authorizeConnection() {}, authorizeRoute() {} }, audit: { append() {} }, clock: { now() {} },
      tls: { mode: 'direct' }, allowedCommandOrigins: ['http://command.loc8.test'],
    }), /invalid_origin_config/);
  });
});

describe('capability, revocation and transport admission', () => {
  test('rejects missing, verifier-rejected, expired and invalid-role capabilities', async () => {
    const { core, tokens } = makeCore();
    const sink = new FakeSink();
    await assert.rejects(() => core.acceptConnection({ request: { encrypted: true }, sink }), /authentication_required/);
    await assert.rejects(() => core.acceptConnection({ capability: 'modified', request: { encrypted: true }, sink }), /invalid_capability/);
    tokens.set('expired', principal({ tokenId: 'expired', expiresAtMs: 999_999 }));
    await assert.rejects(() => core.acceptConnection({ capability: 'expired', request: { encrypted: true }, sink }), /expired_capability/);
    tokens.set('admin', principal({ tokenId: 'admin', role: 'admin' }));
    await assert.rejects(() => core.acceptConnection({ capability: 'admin', request: { encrypted: true }, sink }), /invalid_role/);
  });

  test('rejects revocation and one-use replay even after disconnect', async () => {
    const { core, tokens, revoked } = makeCore();
    revoked.add('site-a/device-r');
    tokens.set('revoked', principal({ subjectId: 'device-r', tokenId: 'revoked' }));
    await assert.rejects(() => core.acceptConnection({ capability: 'revoked', request: { encrypted: true }, sink: new FakeSink() }), /revoked/);

    const value = principal({ tokenId: 'once' });
    const first = await connect(core, tokens, 'once', value);
    await core.closeConnection(first.handle.id);
    await assert.rejects(() => core.acceptConnection({ capability: 'once', request: { encrypted: true }, sink: new FakeSink() }), /replayed/);
  });

  test('requires direct TLS or an explicitly trusted proxy and exact Command Origin', async () => {
    const direct = makeCore();
    direct.tokens.set('plain', principal({ tokenId: 'plain' }));
    await assert.rejects(() => direct.core.acceptConnection({ capability: 'plain', request: { encrypted: false }, sink: new FakeSink() }), /tls_required/);

    const proxy = makeCore({ tls: { mode: 'trusted_proxy', trustedProxyAddresses: new Set(['10.0.0.9']) } });
    proxy.tokens.set('forged', principal({ tokenId: 'forged' }));
    await assert.rejects(() => proxy.core.acceptConnection({
      capability: 'forged', request: { remoteAddress: '10.0.0.8', forwardedProto: 'https' }, sink: new FakeSink(),
    }), /tls_required/);
    proxy.tokens.set('trusted', principal({ tokenId: 'trusted' }));
    await proxy.core.acceptConnection({
      capability: 'trusted', request: { remoteAddress: '10.0.0.9', forwardedProto: 'https' }, sink: new FakeSink(),
    });

    direct.tokens.set('command', principal({ tokenId: 'command', role: 'command' }));
    await assert.rejects(() => direct.core.acceptConnection({
      capability: 'command', origin: 'https://evil.example', request: { encrypted: true }, sink: new FakeSink(),
    }), /origin_rejected/);
  });

  test('shares replay state across service processes', async () => {
    const replay = new SharedReplay();
    const a = makeCore({ replay });
    const b = makeCore({ replay });
    const value = principal({ tokenId: 'cross-process' });
    await connect(a.core, a.tokens, 'same-capability', value);
    b.tokens.set('same-capability', value);
    await assert.rejects(() => b.core.acceptConnection({
      capability: 'same-capability', request: { encrypted: true }, sink: new FakeSink(),
    }), /replayed/);
  });
});

describe('site/role routing and bounded resources', () => {
  test('routes only to the opposite role inside the exact site', async () => {
    const { core, tokens } = makeCore({ limits: { framesPerSecond: 1000, burstFrames: 1000 } });
    const gatewayA = await connect(core, tokens, 'ga', principal({ tokenId: 'ga', subjectId: 'ga' }));
    const gatewayA2 = await connect(core, tokens, 'ga2', principal({ tokenId: 'ga2', subjectId: 'ga2' }));
    const commandA = await connect(core, tokens, 'ca', principal({ tokenId: 'ca', subjectId: 'ca', role: 'command' }));
    const commandB = await connect(core, tokens, 'cb', principal({ tokenId: 'cb', subjectId: 'cb', role: 'command', siteId: 'site-b' }));
    assert.equal(await core.receive(gatewayA.handle.id, frame(7)), 1);
    assert.equal(commandA.sink.frames.length, 1);
    assert.equal(gatewayA2.sink.frames.length, 0);
    assert.equal(commandB.sink.frames.length, 0);
  });

  test('leaks zero of 1,000 valid frames across sites', async () => {
    const { core, tokens } = makeCore({ limits: { framesPerSecond: 0, burstFrames: 1100 } });
    const gatewayA = await connect(core, tokens, 'ga', principal({ tokenId: 'ga' }));
    const commandB = await connect(core, tokens, 'cb', principal({ tokenId: 'cb', role: 'command', siteId: 'site-b' }));
    for (let i = 0; i < 1000; i++) await core.receive(gatewayA.handle.id, frame(i & 255));
    assert.equal(commandB.sink.frames.length, 0);
    assert.equal(core.snapshot().metrics.acceptedFrames, 1000);
  });

  test('drops text-shaped and wrong-size frames and enforces burst rate', async () => {
    const { core, tokens } = makeCore({ limits: { framesPerSecond: 0, burstFrames: 2 } });
    const gateway = await connect(core, tokens, 'g', principal({ tokenId: 'g' }));
    const command = await connect(core, tokens, 'c', principal({ tokenId: 'c', role: 'command' }));
    assert.equal(await core.receive(gateway.handle.id, new Uint8Array(FRAME_BYTES), { binary: false }), 0);
    assert.equal(await core.receive(gateway.handle.id, new Uint8Array(FRAME_BYTES + 1)), 0);
    assert.equal(await core.receive(gateway.handle.id, { byteLength: FRAME_BYTES }), 0);
    for (let i = 0; i < 10; i++) await core.receive(gateway.handle.id, frame(i));
    assert.equal(command.sink.frames.length, 2);
    assert.equal(core.snapshot().metrics.droppedFrames, 11);
  });

  test('sheds receivers whose queue exceeds byte or age bounds', async () => {
    const { core, tokens, clock } = makeCore({ limits: { maxQueueBytes: FRAME_BYTES, maxQueueAgeMs: 50 } });
    const gateway = await connect(core, tokens, 'g', principal({ tokenId: 'g' }));
    const command = await connect(core, tokens, 'c', principal({ tokenId: 'c', role: 'command' }));
    command.sink.queueBytes = 1;
    assert.equal(await core.receive(gateway.handle.id, frame()), 0);
    assert.equal(command.sink.closed, 'slow_consumer');

    const command2 = await connect(core, tokens, 'c2', principal({ tokenId: 'c2', subjectId: 'c2', role: 'command' }));
    command2.sink.oldest = clock.monotonicMs - 51;
    assert.equal(await core.receive(gateway.handle.id, frame()), 0);
    assert.equal(command2.sink.closed, 'slow_consumer');
  });

  test('fails closed on untrusted clock, replay partition and audit disk failure', async () => {
    const untrusted = makeCore();
    untrusted.clock.trusted = false;
    untrusted.tokens.set('clock', principal({ tokenId: 'clock' }));
    await assert.rejects(() => untrusted.core.acceptConnection({ capability: 'clock', request: { encrypted: true }, sink: new FakeSink() }), /clock_untrusted/);

    const partitioned = makeCore();
    partitioned.replay.unavailable = true;
    partitioned.tokens.set('partition', principal({ tokenId: 'partition' }));
    await assert.rejects(() => partitioned.core.acceptConnection({ capability: 'partition', request: { encrypted: true }, sink: new FakeSink() }), /partitioned/);

    const audit = new FakeAudit();
    audit.fail = true;
    const disk = makeCore({ audit });
    const diskSink = new FakeSink();
    disk.tokens.set('disk', principal({ tokenId: 'disk' }));
    await assert.rejects(() => disk.core.acceptConnection({ capability: 'disk', request: { encrypted: true }, sink: diskSink }), /disk full/);
    assert.equal(disk.core.snapshot().connectionCount, 0);
    assert.equal(disk.core.snapshot().available, false);
    assert.equal(diskSink.closed, 'audit_unavailable');
  });

  test('persists frame acceptance before send and disconnects everyone if that append fails', async () => {
    const { core, tokens, audit } = makeCore();
    const gateway = await connect(core, tokens, 'g', principal({ tokenId: 'g' }));
    const command = await connect(core, tokens, 'c', principal({ tokenId: 'c', role: 'command' }));
    audit.fail = true;
    await assert.rejects(
      () => core.receive(gateway.handle.id, frame()),
      (error) => error?.code === 'audit_unavailable',
    );
    assert.equal(command.sink.frames.length, 0);
    assert.equal(gateway.sink.closed, 'audit_unavailable');
    assert.equal(command.sink.closed, 'audit_unavailable');
    assert.equal(core.snapshot().connectionCount, 0);
    assert.equal(core.snapshot().available, false);
  });

  test('expires live sessions and rechecks capacity after concurrent asynchronous admission', async () => {
    const expiring = makeCore();
    const live = await connect(expiring.core, expiring.tokens, 'short', principal({ tokenId: 'short', expiresAtMs: 1_000_010 }));
    expiring.clock.advance(11);
    await assert.rejects(() => expiring.core.receive(live.handle.id, frame()), /session_expired/);
    assert.equal(live.sink.closed, 'session_expired');

    const pending = [];
    const replay = {
      async consume() {
        return new Promise((resolve) => pending.push(resolve));
      },
    };
    const limited = makeCore({ replay, limits: { maxConnections: 1, maxConnectionsPerSite: 1 } });
    limited.tokens.set('one', principal({ tokenId: 'one', subjectId: 'one' }));
    limited.tokens.set('two', principal({ tokenId: 'two', subjectId: 'two' }));
    const one = limited.core.acceptConnection({ capability: 'one', request: { encrypted: true }, sink: new FakeSink() });
    const two = limited.core.acceptConnection({ capability: 'two', request: { encrypted: true }, sink: new FakeSink() });
    await new Promise((resolve) => setImmediate(resolve));
    for (const resolve of pending) resolve(true);
    const settled = await Promise.allSettled([one, two]);
    assert.equal(settled.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(settled.filter((result) => result.status === 'rejected' && result.reason?.code === 'connection_limit').length, 1);
    assert.equal(limited.core.snapshot().connectionCount, 1);
  });
});

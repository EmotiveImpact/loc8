import { useEffect, useMemo, useState } from 'react';
import {
  assertVenuePackage,
  createSyntheticPlanImport,
  createFloorReplayFrames,
  createSyntheticFloorReplay,
  createSyntheticFourLevelVenue,
  floorReplayFrameAt,
  evaluatePlanRegistration,
  parsePlanImportJson,
  PLAN_REGISTRATION_MAX_RESIDUAL_M,
  PLAN_REGISTRATION_MAX_RMS_M,
  PlanRegistrationError,
  parseFloorReplayJson,
  projectLevels,
  projectPlaces,
  projectZones,
  registerPlanImport,
  routeToNearestExit,
  validateVenuePackage,
  type GatewaySimulationSnapshot,
  type EvaluatedPlanRegistration,
  type FloorReplayBundle,
  type FloorReplayEvent,
  type RouteProfile,
  type PlanImportBundle,
  type PlanRegistrationReceipt,
  type VenuePackage,
  type VenueReconciliationResult,
  type VenueRouteResult,
  type VenueSpace,
} from '../engine';
import { Icon } from '../ui/Icon';
import { Console, ConsoleTop, PageHead, Pill, SectionTitle } from '../ui/primitives';
import { createCommandLocalDemo, createCommandSuccessorDraft } from '../domain/commissioning';
import {
  clearCommandGatewaySimulation,
  installCommandGatewaySimulation,
  loadCommandGatewaySimulation,
  reconcileCommandGatewaySimulation,
  type GatewaySimulationLoadResult,
} from '../domain/gatewaySimulation';

const STORAGE_KEY = 'loc8.command.commissioning.synthetic-v1';
const ROUTE_PROFILES: RouteProfile[] = ['walking', 'step-free', 'evacuation-walking', 'evacuation-step-free'];

type CommissioningView = 'map' | 'registration' | 'gateway' | 'replay';

function cloneVenue(venue: VenuePackage): VenuePackage {
  return JSON.parse(JSON.stringify(venue)) as VenuePackage;
}

function loadLocalVenue(): VenuePackage {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return createSyntheticFourLevelVenue();
    const value = JSON.parse(stored) as VenuePackage;
    assertVenuePackage(value);
    return value;
  } catch {
    return createSyntheticFourLevelVenue();
  }
}

function levelToken(levelId: string) {
  return levelId.replace(/^level\./u, '');
}

function statusCopy(venue: VenuePackage) {
  if (venue.state === 'local-demo') return 'Local demo publication';
  if (venue.state === 'published') return 'Gateway publication';
  return 'Editable browser draft';
}

function mapLabel(space: VenueSpace) {
  if (space.ref) return space.ref;
  if (space.spaceId.includes('stairs')) return 'STAIR';
  if (space.spaceId.includes('lift')) return 'LIFT';
  if (space.spaceId.includes('ramp')) return 'RAMP';
  if (space.spaceId.includes('outside-west')) return 'EXIT W';
  if (space.spaceId.includes('outside-east')) return 'EXIT E';
  if (space.kind === 'corridor') return 'CENTRAL';
  if (space.kind === 'service') return 'PLANT';
  return space.name;
}

function reconciliationCopy(result: VenueReconciliationResult) {
  switch (result.outcome) {
    case 'not-installed': return { label: 'NOT INSTALLED', tone: 'off' as const, detail: 'The simulator has no venue copy.' };
    case 'in-sync': return { label: 'IN SYNC', tone: 'ok' as const, detail: 'Command and the simulated copy use the same stable package identity.' };
    case 'update-available': return { label: 'UPDATE AVAILABLE', tone: 'info' as const, detail: 'The simulated Gateway has a direct successor to this Command package.' };
    case 'client-ahead': return { label: 'COMMAND AHEAD', tone: 'amber' as const, detail: 'Command has a direct successor draft; the simulated copy remains unchanged.' };
    case 'identity-conflict': return { label: 'IDENTITY CONFLICT', tone: 'alert' as const, detail: 'The copies do not share an accepted identity or lineage.' };
  }
}

function GatewaySimulationView({
  venue,
  load,
  reconciliation,
  onOpenMap,
}: {
  venue: VenuePackage;
  load: GatewaySimulationLoadResult;
  reconciliation: VenueReconciliationResult;
  onOpenMap: () => void;
}) {
  const snapshot: GatewaySimulationSnapshot | null = load.status === 'loaded' ? load.snapshot : null;
  const copy = reconciliationCopy(reconciliation);
  const installedLevels = snapshot ? projectLevels(snapshot.package) : [];
  const installedPlaces = snapshot ? projectPlaces(snapshot.package) : [];
  const installedZones = snapshot ? projectZones(snapshot.package) : [];

  return (
    <section className="gateway-sim" aria-labelledby="gateway-sim-title">
      <div className="gateway-sim-head">
        <div>
          <div className="gateway-sim-eyebrow">Offline distribution exercise</div>
          <h2 id="gateway-sim-title">Command → simulated Gateway venue copy</h2>
          <p>This exercises installation, offline reload and version reconciliation in one browser. It is not a radio transfer, signed publication or durable Gateway.</p>
        </div>
        <Pill tone={copy.tone}>{copy.label}</Pill>
      </div>

      {load.status === 'invalid' && (
        <div className="gateway-sim-error" role="alert">
          <Icon name="triangle" size={17} />
          <span><b>Simulated storage rejected.</b> {load.error === 'storage-unavailable' ? 'Browser storage is unavailable.' : 'The stored snapshot is corrupt or outside the schema.'}</span>
        </div>
      )}

      <div className="gateway-flow" aria-label="Building data ownership">
        <article>
          <div className="gateway-flow-icon"><Icon name="radar" size={18} /></div>
          <div><span>Phone / field adapter</span><b>Sensor evidence at source</b><p>Future live readings stay on the phone until bounded observations are sent. No phone sensor is connected in this phase.</p></div>
        </article>
        <Icon name="arrow" size={18} />
        <article>
          <div className="gateway-flow-icon"><Icon name="grid" size={18} /></div>
          <div><span>Command browser</span><b>{venue.state === 'draft' ? 'Editable draft' : 'Immutable local demo'}</b><p>{venue.mapVersion} is stored in browser localStorage for this runnable demonstration.</p></div>
        </article>
        <Icon name="arrow" size={18} />
        <article className={snapshot ? 'installed' : ''}>
          <div className="gateway-flow-icon"><Icon name="shield" size={18} /></div>
          <div><span>Gateway simulator</span><b>{snapshot ? 'Separate offline snapshot' : 'No package installed'}</b><p>{snapshot ? `${snapshot.mapVersion} · ${(snapshot.packageBytes / 1024).toFixed(1)} KiB` : 'Create a local demo, then install its simulated copy.'}</p></div>
        </article>
      </div>

      <div className="gateway-sim-grid">
        <article className="gateway-sim-card">
          <SectionTitle>Reconciliation result</SectionTitle>
          <div className={`gateway-reconcile ${reconciliation.outcome}`}>
            <b>{copy.label}</b>
            <span>{copy.detail}</span>
          </div>
          <dl>
            <div><dt>Command map</dt><dd>{reconciliation.clientMapVersion}</dd></div>
            <div><dt>Simulated map</dt><dd>{reconciliation.gatewayMapVersion ?? 'none'}</dd></div>
            <div><dt>Comparison basis</dt><dd>stable IDs + lineage</dd></div>
          </dl>
        </article>

        <article className="gateway-sim-card">
          <SectionTitle>Installed operational projections</SectionTitle>
          {snapshot ? (
            <>
              <div className="gateway-counts">
                <span><b>{installedLevels.length}</b> levels</span>
                <span><b>{installedPlaces.length}</b> places</span>
                <span><b>{installedZones.length}</b> zones</span>
              </div>
              <dl>
                <div><dt>Package</dt><dd>{snapshot.packageId}</dd></div>
                <div><dt>Simulator</dt><dd>{snapshot.gatewaySimulatorId}</dd></div>
                <div><dt>Installed</dt><dd>{new Date(snapshot.installedAtMs).toLocaleString()}</dd></div>
              </dl>
            </>
          ) : (
            <div className="gateway-empty">
              <Icon name="doc" size={24} />
              <b>No offline copy yet</b>
              <span>{venue.state === 'local-demo' ? 'Use “Install simulated copy” above.' : 'The map must pass validation and become a local demo first.'}</span>
              <button type="button" className="btn ghost" onClick={onOpenMap}>Open map builder</button>
            </div>
          )}
        </article>
      </div>

      <div className="gateway-production-boundary">
        <SectionTitle>Production promotion gates</SectionTitle>
        <div>
          <article><Pill tone="ok">CONTRACT READY</Pill><b>Fail-closed installer</b><p>Strict envelope, provider ports, atomic append and version lineage are exercised with deterministic tests.</p></article>
          <article><Pill tone="amber">PROVIDER NEEDED</Pill><b>Signing and digest service</b><p>Choose and independently review a real cryptographic provider. Loc8 does not invent one here.</p></article>
          <article><Pill tone="amber">NATIVE REPEAT</Pill><b>Durable Gateway store</b><p>Implement SQLite/WAL or equivalent, then run concurrency, restart and power-loss drills on target hardware.</p></article>
          <article><Pill tone="off">PHYSICAL HOLD</Pill><b>Field evidence</b><p>Radio transfer, building survey and offline operations require approved hardware and a real multi-floor test venue.</p></article>
        </div>
      </div>
    </section>
  );
}

function replayTime(elapsedMs: number) {
  const seconds = Math.floor(elapsedMs / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function replayEventLabel(event: FloorReplayEvent) {
  if (event.kind === 'anchor') return `Manual anchor · ${event.levelId}`;
  if (event.kind === 'truth') return `${event.phase.replaceAll('-', ' ')} · ${event.levelId}`;
  if (event.kind === 'barometer') return `Pressure · ${event.pressureHpa.toFixed(3)} hPa`;
  if (event.kind === 'motion') return 'Motion observation · m/s² + rad/s';
  return 'Magnetic observation · μT';
}

function vectorMagnitude(vector: { x: number; y: number; z: number } | null | undefined) {
  return vector ? Math.hypot(vector.x, vector.y, vector.z) : null;
}

function SensorReplayView({ venue }: { venue: VenuePackage }) {
  const [bundle, setBundle] = useState<FloorReplayBundle>(() => createSyntheticFloorReplay(venue));
  const [cursorMs, setCursorMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [importNotice, setImportNotice] = useState('Built-in synthetic journey loaded. No phone or building was measured.');
  const frames = useMemo(() => createFloorReplayFrames(bundle, venue), [bundle, venue]);
  const frame = floorReplayFrameAt(frames, cursorMs);
  const estimate = venue.levels.find((level) => level.levelId === frame.estimatedLevelId) ?? null;
  const truth = venue.levels.find((level) => level.levelId === frame.truthLevelId) ?? null;
  const recentEvents = bundle.events.slice(Math.max(0, frame.index - 5), frame.index + 1).reverse();
  const motionMagnitude = vectorMagnitude(frame.latestMotion?.userAccelerationMps2 ?? frame.latestMotion?.accelerationIncludingGravityMps2);
  const magneticMagnitude = vectorMagnitude(frame.latestMagnetometer?.microtesla);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setCursorMs((current) => {
        const next = Math.min(bundle.durationMs, current + speed * 250);
        if (next >= bundle.durationMs) setPlaying(false);
        return next;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [bundle.durationMs, playing, speed]);

  const resetSynthetic = () => {
    setBundle(createSyntheticFloorReplay(venue));
    setCursorMs(0);
    setPlaying(false);
    setImportNotice('Built-in synthetic journey reset from the current venue package.');
  };

  const step = (direction: -1 | 1) => {
    setPlaying(false);
    if (direction < 0) {
      const previous = [...frames].reverse().find((candidate) => candidate.elapsedMs < frame.elapsedMs);
      setCursorMs(previous?.elapsedMs ?? 0);
    } else {
      const next = frames.find((candidate) => candidate.elapsedMs > frame.elapsedMs);
      setCursorMs(next?.elapsedMs ?? bundle.durationMs);
    }
  };

  const importReplayText = (json: string) => {
    try {
      const imported = parseFloorReplayJson(json, venue);
      setBundle(imported);
      setCursorMs(0);
      setPlaying(false);
      setImportNotice(`${imported.evidenceClass === 'recorded-unverified' ? 'Recorded-unverified' : 'Synthetic'} journey accepted locally: ${imported.journeyId}.`);
      return true;
    } catch {
      setImportNotice('Import rejected: the file is invalid, oversized or does not match this venue package. The current journey was kept.');
      return false;
    }
  };

  const importReplay = async (file: File | undefined) => {
    if (!file) return;
    try {
      importReplayText(await file.text());
    } catch {
      setImportNotice('Import rejected: the file could not be read. The current journey was kept.');
    }
  };

  return (
    <section className="sensor-replay" aria-labelledby="sensor-replay-title">
      <div className="sensor-replay-head">
        <div>
          <div className="gateway-sim-eyebrow">Deterministic floor journey</div>
          <h2 id="sensor-replay-title">Replay phone evidence without a building</h2>
          <p>Runs the anchored barometer tracker against declared samples and truth. Motion and magnetic evidence are visible but do not influence the estimate.</p>
        </div>
        <Pill tone={bundle.evidenceClass === 'synthetic' ? 'amber' : 'alert'}>{bundle.evidenceClass === 'synthetic' ? 'SYNTHETIC REPLAY' : 'RECORDED · UNVERIFIED'}</Pill>
      </div>

      <div className="sensor-controls">
        <button type="button" className="btn ghost" onClick={resetSynthetic}>Reset synthetic</button>
        <button type="button" className="sensor-step" onClick={() => step(-1)} aria-label="Previous replay event"><Icon name="arrow" size={15} style={{ transform: 'rotate(180deg)' }} /></button>
        <button type="button" className="btn go" onClick={() => setPlaying((value) => !value)}>{playing ? 'Pause replay' : 'Play replay'}</button>
        <button type="button" className="sensor-step" onClick={() => step(1)} aria-label="Next replay event"><Icon name="arrow" size={15} /></button>
        <label><span>Speed</span><select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label>
        <label className="sensor-import"><span>Recorded JSON</span><input type="file" accept="application/json,.json" onChange={(event) => void importReplay(event.target.files?.[0])} /></label>
        <button type="button" className="btn ghost sensor-paste-toggle" aria-expanded={pasteOpen} onClick={() => setPasteOpen((value) => !value)}>Paste JSON</button>
      </div>

      {pasteOpen && (
        <div className="sensor-paste-panel">
          <label><span>Replay JSON</span><textarea value={pastedJson} onChange={(event) => setPastedJson(event.target.value)} placeholder="Paste a loc8.floor-replay.v1 bundle for local validation" /></label>
          <button type="button" className="btn go" disabled={!pastedJson.trim()} onClick={() => { if (importReplayText(pastedJson)) setPasteOpen(false); }}>Load pasted JSON</button>
        </div>
      )}

      <div className="sensor-timeline">
        <input
          type="range" min={0} max={bundle.durationMs} step={250} value={cursorMs}
          onChange={(event) => { setPlaying(false); setCursorMs(Number(event.target.value)); }}
          aria-label="Replay timeline"
        />
        <div><span>0:00 · manual anchor</span><b>{replayTime(frame.elapsedMs)} / {replayTime(bundle.durationMs)}</b><span>0:30 · same-floor control</span></div>
      </div>

      <div className="sensor-truth-boundary" role="status">
        <Icon name="info" size={16} />
        <span><b>Replay boundary:</b> {bundle.evidenceClass === 'synthetic' ? 'every sample and truth label was generated in software.' : 'the file is structurally valid but its sensor, truth and consent evidence has not been verified.'} No floor-accuracy or physical-device result is claimed.</span>
      </div>

      <div className="sensor-replay-grid">
        <article className="sensor-level-card">
          <SectionTitle>Truth and barometer estimate</SectionTitle>
          <div className="sensor-levels">
            {[...venue.levels].sort((left, right) => right.ordinal - left.ordinal).map((level) => {
              const isTruth = level.levelId === truth?.levelId;
              const isEstimate = level.levelId === estimate?.levelId;
              return (
                <div key={level.levelId} className={`${isTruth ? 'truth' : ''} ${isEstimate ? 'estimate' : ''}`}>
                  <span>{level.levelRef}</span><b>{level.name}</b><small>{level.elevationM}m</small>
                  <em>{isTruth && isEstimate ? 'TRUTH + ESTIMATE' : isTruth ? 'DECLARED TRUTH' : isEstimate ? 'BAROMETER ESTIMATE' : ''}</em>
                </div>
              );
            })}
          </div>
          <div className="sensor-level-summary">
            <span>Truth <b>{truth?.levelRef ?? 'not declared'}</b></span>
            <span>Estimate <b>{estimate?.levelRef ?? `wire ${frame.estimatedLegacyFloor}`}</b></span>
            <span>Difference <b>{frame.estimateDeltaFloors === null ? 'n/a' : `${frame.estimateDeltaFloors} floor${Math.abs(frame.estimateDeltaFloors) === 1 ? '' : 's'}`}</b></span>
          </div>
        </article>

        <article className="sensor-observation-card">
          <SectionTitle>Latest replayed observations</SectionTitle>
          <div className="sensor-readings">
            <div><Icon name="radar" size={17} /><span>Pressure</span><b>{frame.latestBarometer ? `${frame.latestBarometer.pressureHpa.toFixed(3)} hPa` : 'waiting'}</b><small>relative only · not an absolute floor</small></div>
            <div><Icon name="arrow" size={17} /><span>Motion</span><b>{motionMagnitude === null ? 'waiting' : `${motionMagnitude.toFixed(3)} m/s²`}</b><small>displayed · not fused</small></div>
            <div><Icon name="grid" size={17} /><span>Magnetic field</span><b>{magneticMagnitude === null ? 'waiting' : `${magneticMagnitude.toFixed(2)} μT`}</b><small>displayed · not fused</small></div>
          </div>
          <dl className="sensor-context">
            <div><dt>Truth phase</dt><dd>{frame.truthPhase?.replaceAll('-', ' ') ?? 'not declared'}</dd></div>
            <div><dt>Connector</dt><dd>{frame.truthConnectorId ?? 'none'}</dd></div>
            <div><dt>Confidence</dt><dd>{frame.estimateConfidence}{frame.confirmSuggested ? ' · confirm suggested' : ''}</dd></div>
          </dl>
        </article>

        <article className="sensor-event-card">
          <SectionTitle>Replay event stream</SectionTitle>
          <div className="sensor-event-counts">
            <span><b>{frame.counts.barometer}</b> pressure</span><span><b>{frame.counts.motion}</b> motion</span><span><b>{frame.counts.magnetometer}</b> magnetic</span>
          </div>
          <ol>
            {recentEvents.map((event) => <li key={event.sequence}><time>{replayTime(event.elapsedMs)}</time><span>{replayEventLabel(event)}</span></li>)}
          </ol>
        </article>

        <article className="sensor-adapter-card">
          <SectionTitle>Native adapter readiness</SectionTitle>
          <p>The Expo SDK 57 adapter is built but not running in this browser. A future consented phone action checks availability and permission before each listener.</p>
          <ul>
            <li><b>Barometer</b><span>hPa · optional iOS relative altitude · 500ms request</span></li>
            <li><b>DeviceMotion</b><span>m/s² · deg/s converted to rad/s · 100ms request</span></li>
            <li><b>Magnetometer</b><span>calibrated μT · 200ms request</span></li>
          </ul>
          <div className="sensor-holds"><Pill tone="amber">PHYSICAL REPEAT</Pill><span>Phone permission, delivered rate, background behavior and floor accuracy remain untested.</span></div>
        </article>
      </div>

      <div className="sensor-import-notice" aria-live="polite">{importNotice}</div>
    </section>
  );
}

function PlanRegistrationView({
  venue,
  onApply,
  onOpenMap,
}: {
  venue: VenuePackage;
  onApply: (next: VenuePackage, receipt: Readonly<PlanRegistrationReceipt>) => void;
  onOpenMap: (levelId: string) => void;
}) {
  const [bundle, setBundle] = useState<PlanImportBundle>(() => createSyntheticPlanImport(venue));
  const [evaluation, setEvaluation] = useState<EvaluatedPlanRegistration>(() => evaluatePlanRegistration(createSyntheticPlanImport(venue), venue));
  const [receipt, setReceipt] = useState<Readonly<PlanRegistrationReceipt> | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [notice, setNotice] = useState('Built-in synthetic source plan fitted locally. No drawing or building was measured.');
  const targetPlan = venue.floorPlans.find((candidate) => candidate.levelId === bundle.levelId)
    ?? venue.floorPlans.find((candidate) => candidate.levelId === 'level.ground')
    ?? venue.floorPlans[0];
  const identityMatches = bundle.packageId === venue.packageId && bundle.mapVersion === venue.mapVersion;

  const loadSynthetic = () => {
    const nextBundle = createSyntheticPlanImport(venue, targetPlan.levelId);
    setBundle(nextBundle);
    setEvaluation(evaluatePlanRegistration(nextBundle, venue));
    setReceipt(null);
    setNotice('Built-in synthetic source plan reset against the current venue identity.');
  };

  const importText = (json: string) => {
    try {
      const nextBundle = parsePlanImportJson(json, venue);
      const nextEvaluation = evaluatePlanRegistration(nextBundle, venue);
      setBundle(nextBundle);
      setEvaluation(nextEvaluation);
      setReceipt(null);
      setNotice(`${nextBundle.evidenceClass === 'synthetic' ? 'Synthetic' : 'Operator-unverified'} registration accepted for preview: ${nextBundle.importId}.`);
      return true;
    } catch (error) {
      const detail = error instanceof PlanRegistrationError ? error.issues[0]?.message : null;
      setNotice(`Import rejected${detail ? `: ${detail}` : ''}. The last valid preview and venue were kept.`);
      return false;
    }
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      importText(await file.text());
    } catch {
      setNotice('Import rejected: the file could not be read. The last valid preview and venue were kept.');
    }
  };

  const applyRegistration = () => {
    try {
      const validFrom = new Date().toISOString();
      const successor = venue.state === 'draft' ? undefined : createCommandSuccessorDraft(venue, validFrom);
      const result = registerPlanImport(bundle, venue, successor ? {
        successor: { packageId: successor.packageId, mapVersion: successor.mapVersion, validFrom },
      } : {});
      setReceipt(result.receipt);
      onApply(result.venue, result.receipt);
      setNotice(`Registration applied to editable draft ${result.venue.mapVersion}. Stable spaces and routes were preserved; physical review is still required.`);
    } catch (error) {
      const detail = error instanceof PlanRegistrationError ? error.issues[0]?.message : null;
      setNotice(`Apply blocked${detail ? `: ${detail}` : ''}. The venue was not changed.`);
    }
  };

  return (
    <section className="plan-registration" aria-labelledby="plan-registration-title">
      <div className="plan-registration-head">
        <div>
          <div className="gateway-sim-eyebrow">Source pixels → building metres</div>
          <h2 id="plan-registration-title">Register a floor plan with control points</h2>
          <p>Fit scale, rotation and translation before geometry enters the venue package. This development lane accepts strict JSON polygons; it does not store or upload the source drawing.</p>
        </div>
        <Pill tone={bundle.evidenceClass === 'synthetic' ? 'amber' : 'alert'}>{bundle.evidenceClass === 'synthetic' ? 'SYNTHETIC PLAN' : 'OPERATOR · UNVERIFIED'}</Pill>
      </div>

      <div className="plan-registration-controls">
        <button type="button" className="btn ghost" onClick={loadSynthetic}>Load synthetic plan</button>
        <label><span>Registration JSON</span><input type="file" accept="application/json,.json" onChange={(event) => void importFile(event.target.files?.[0])} /></label>
        <button type="button" className="btn ghost" aria-expanded={pasteOpen} onClick={() => setPasteOpen((value) => !value)}>Paste JSON</button>
        <button type="button" className="btn go" disabled={!identityMatches} onClick={applyRegistration}><Icon name="check" size={15} /> Apply to draft</button>
      </div>

      {pasteOpen && (
        <div className="plan-registration-paste">
          <label><span>Plan registration JSON</span><textarea value={pastedJson} onChange={(event) => setPastedJson(event.target.value)} placeholder="Paste a loc8.plan-import.v1 bundle for local validation" /></label>
          <button type="button" className="btn go" disabled={!pastedJson.trim()} onClick={() => { if (importText(pastedJson)) setPasteOpen(false); }}>Validate and preview</button>
        </div>
      )}

      {!identityMatches && (
        <div className="plan-registration-stale" role="alert"><Icon name="info" size={16} /><span>The venue now has a new package identity. Reload the synthetic plan or import a matching bundle before applying again.</span></div>
      )}

      <div className="plan-registration-grid">
        <article className="plan-registration-preview">
          <SectionTitle>Registration preview</SectionTitle>
          <div className="plan-preview-pair">
            <div>
              <span>Source frame · pixels</span>
              <svg viewBox={`0 0 ${bundle.sourceFrame.widthPx} ${bundle.sourceFrame.heightPx}`} role="img" aria-label="Source plan pixel geometry and control points">
                <rect width={bundle.sourceFrame.widthPx} height={bundle.sourceFrame.heightPx} />
                {bundle.shapes.map((shape) => <polygon key={shape.shapeId} points={shape.points.map((point) => `${point.xPx},${point.yPx}`).join(' ')} />)}
                {bundle.controlPoints.map((point) => <circle key={point.controlPointId} cx={point.source.xPx} cy={point.source.yPx} r="18" />)}
              </svg>
            </div>
            <Icon name="arrow" size={18} />
            <div>
              <span>Registered frame · metres</span>
              <svg viewBox={`0 0 ${targetPlan.widthM} ${targetPlan.heightM}`} role="img" aria-label="Transformed plan geometry and registered control points">
                <rect width={targetPlan.widthM} height={targetPlan.heightM} />
                {evaluation.transformedShapes.map((shape) => <polygon key={shape.shapeId} points={shape.points.map((point) => `${point.xM},${point.yM}`).join(' ')} />)}
                {bundle.controlPoints.map((point) => <circle key={point.controlPointId} cx={point.target.xM} cy={point.target.yM} r="0.65" />)}
              </svg>
            </div>
          </div>
          <div className="plan-preview-legend"><span><i /> imported space polygon</span><span><i className="control" /> registered control point</span></div>
        </article>

        <article className="plan-registration-fit">
          <SectionTitle>Similarity fit</SectionTitle>
          <div className="plan-fit-gates">
            <div><span>RMS residual</span><b>{evaluation.rmsResidualM.toFixed(3)}m</b><small>gate ≤ {PLAN_REGISTRATION_MAX_RMS_M.toFixed(2)}m</small></div>
            <div><span>Max residual</span><b>{evaluation.maxResidualM.toFixed(3)}m</b><small>gate ≤ {PLAN_REGISTRATION_MAX_RESIDUAL_M.toFixed(2)}m</small></div>
          </div>
          <dl>
            <div><dt>Scale</dt><dd>{evaluation.transform.scaleMPerPx.toFixed(5)} m/px</dd></div>
            <div><dt>Rotation</dt><dd>{evaluation.transform.rotationDeg.toFixed(3)}°</dd></div>
            <div><dt>Translation X</dt><dd>{evaluation.transform.translateXM.toFixed(3)}m</dd></div>
            <div><dt>Translation Y</dt><dd>{evaluation.transform.translateYM.toFixed(3)}m</dd></div>
            <div><dt>Shapes</dt><dd>{evaluation.transformedShapes.length}</dd></div>
          </dl>
          <div className="plan-fit-pass"><Icon name="check" size={15} /><span><b>Development gates pass</b> · fit is eligible to enter an editable draft, not to claim survey accuracy.</span></div>
        </article>

        <article className="plan-registration-points">
          <SectionTitle>Control-point residuals</SectionTitle>
          <div className="plan-point-table" role="table" aria-label="Control-point observations and residuals">
            <div role="row" className="head"><span>Point</span><span>Source px</span><span>Target m</span><span>Residual</span></div>
            {bundle.controlPoints.map((point) => {
              const residual = evaluation.controlPointResiduals.find((candidate) => candidate.controlPointId === point.controlPointId)?.residualM ?? 0;
              return <div role="row" key={point.controlPointId}><span><b>{point.name}</b><small>{point.controlPointId}</small></span><span>{point.source.xPx.toFixed(1)}, {point.source.yPx.toFixed(1)}</span><span>{point.target.xM.toFixed(2)}, {point.target.yM.toFixed(2)}</span><span>{residual.toFixed(3)}m</span></div>;
            })}
          </div>
        </article>

        <article className="plan-registration-boundary">
          <SectionTitle>What this result means</SectionTitle>
          <ul>
            <li><Icon name="check" size={14} /><span><b>Measured in software</b> Scale, rotation, translation, residual gates and transformed bounds.</span></li>
            <li><Icon name="shield" size={14} /><span><b>Preserved</b> Stable space, connector, portal, route, zone and level identities.</span></li>
            <li><Icon name="triangle" size={14} /><span><b>Still unverified</b> Source authenticity, physical control points, plan currency and repeat-operator accuracy.</span></li>
          </ul>
          <dl>
            <div><dt>Source</dt><dd>{bundle.sourceRef.sourceId}</dd></div>
            <div><dt>Target</dt><dd>{bundle.levelId} · {bundle.targetFrameId}</dd></div>
            <div><dt>Review</dt><dd>unreviewed</dd></div>
          </dl>
          {receipt && <div className="plan-receipt"><Pill tone="ok">APPLIED LOCALLY</Pill><span>{receipt.resultingMapVersion} · {receipt.transformedShapeCount} shapes · receipt retained in this session</span><button type="button" className="btn ghost" onClick={() => onOpenMap(receipt.levelId)}>Open registered map</button></div>}
        </article>
      </div>

      <div className="sensor-import-notice" aria-live="polite">{notice}</div>
    </section>
  );
}

export function Commissioning() {
  const [workspaceView, setWorkspaceView] = useState<CommissioningView>('map');
  const [venue, setVenue] = useState<VenuePackage>(loadLocalVenue);
  const [gatewayLoad, setGatewayLoad] = useState<GatewaySimulationLoadResult>(() => loadCommandGatewaySimulation(window.localStorage));
  const [selectedLevelId, setSelectedLevelId] = useState('level.ground');
  const [selectedSpaceId, setSelectedSpaceId] = useState('space.ground.corridor');
  const [routeProfile, setRouteProfile] = useState<RouteProfile>('evacuation-step-free');
  const [rampClosed, setRampClosed] = useState(false);
  const [route, setRoute] = useState<VenueRouteResult | null>(null);
  const [notice, setNotice] = useState('Synthetic fixture loaded. No physical-building claim.');

  const levels = useMemo(() => projectLevels(venue), [venue]);
  const projectedZones = useMemo(() => projectZones(venue), [venue]);
  const selectedLevel = levels.find((level) => level.levelId === selectedLevelId) ?? levels[0];
  const plan = venue.floorPlans.find((candidate) => candidate.levelId === selectedLevel.levelId)!;
  const levelSpaces = venue.spaces.filter((space) => space.levelId === selectedLevel.levelId);
  const selectedSpace = venue.spaces.find((space) => space.spaceId === selectedSpaceId) ?? levelSpaces[0];
  const issues = useMemo(() => validateVenuePackage(venue), [venue]);
  const gatewaySnapshot = gatewayLoad.status === 'loaded' ? gatewayLoad.snapshot : null;
  const reconciliation = useMemo(() => reconcileCommandGatewaySimulation(gatewaySnapshot, venue), [gatewaySnapshot, venue]);
  const editable = venue.state === 'draft';
  const routeNodeIds = route?.outcome === 'ok' ? new Set(route.nodeIds) : new Set<string>();
  const routeSegments = route?.outcome === 'ok'
    ? route.edgeIds.map((edgeId) => venue.routeEdges.find((edge) => edge.edgeId === edgeId)).filter((edge) => edge !== undefined)
    : [];

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(venue));
  }, [venue]);

  useEffect(() => {
    if (!levelSpaces.some((space) => space.spaceId === selectedSpaceId)) {
      setSelectedSpaceId(levelSpaces[0]?.spaceId ?? '');
    }
  }, [levelSpaces, selectedSpaceId]);

  const updateDraft = (change: (next: VenuePackage) => void, message: string) => {
    if (!editable) return;
    const next = cloneVenue(venue);
    change(next);
    setVenue(next);
    setRoute(null);
    setNotice(message);
  };

  const renameSelected = (name: string) => updateDraft((next) => {
    const space = next.spaces.find((candidate) => candidate.spaceId === selectedSpace.spaceId);
    if (space) space.name = name;
  }, 'Display name changed; stable space ID preserved.');

  const changeSelectedKind = (kind: VenueSpace['kind']) => updateDraft((next) => {
    const space = next.spaces.find((candidate) => candidate.spaceId === selectedSpace.spaceId);
    if (space) space.kind = kind;
  }, 'Object kind changed; stable space ID and route references preserved.');

  const moveSelected = (xM: number, yM: number) => {
    if (!editable) return;
    const next = cloneVenue(venue);
    const nextPlan = next.floorPlans.find((candidate) => candidate.levelId === selectedLevel.levelId)!;
    const shape = nextPlan.shapes.find((candidate) => candidate.spaceId === selectedSpace.spaceId);
    if (!shape) {
      setNotice('This object has no editable plan geometry.');
      return;
    }
    const moved = shape.points.map((point) => ({ xM: point.xM + xM, yM: point.yM + yM }));
    if (moved.every((point) => point.xM >= 0 && point.yM >= 0 && point.xM <= nextPlan.widthM && point.yM <= nextPlan.heightM)) {
      shape.points = moved;
      setVenue(next);
      setRoute(null);
      setNotice(`Geometry moved ${xM || yM}m on the local coordinate frame.`);
    } else {
      setNotice('Movement blocked at the registered floor-plan boundary.');
    }
  };

  const addRoom = () => updateDraft((next) => {
    const token = levelToken(selectedLevel.levelId);
    const count = next.spaces.filter((space) => space.spaceId.startsWith(`space.${token}.field-room`)).length + 1;
    const suffix = `field-room-${count}`;
    const spaceId = `space.${token}.${suffix}`;
    const nodeId = `node.${token}.${suffix}.primary`;
    const corridor = next.spaces.find((space) => space.spaceId === `space.${token}.corridor`)!;
    const portalId = `portal.${token}.${suffix}`;
    const x = 38 + ((count - 1) % 3) * 6;
    const space: VenueSpace = {
      spaceId,
      levelId: selectedLevel.levelId,
      kind: 'room',
      name: `Field room ${count}`,
      ref: `${selectedLevel.levelRef}-F${String(count).padStart(2, '0')}`,
      navigable: true,
      egressRequired: true,
      stepFreeEgressRequired: true,
      nodeId,
    };
    next.spaces.push(space);
    next.floorPlans.find((candidate) => candidate.levelId === selectedLevel.levelId)!.shapes.push({
      shapeId: `shape.${token}.${suffix}`,
      spaceId,
      points: [{ xM: x, yM: 24 }, { xM: x + 5, yM: 24 }, { xM: x + 5, yM: 30 }, { xM: x, yM: 30 }],
    });
    next.routeNodes.push({ nodeId, levelId: selectedLevel.levelId, spaceId, kind: 'space', position: { xM: x + 2.5, yM: 27 } });
    next.portals.push({
      portalId,
      levelId: selectedLevel.levelId,
      kind: 'door',
      name: `Field room ${count} door`,
      fromSpaceId: corridor.spaceId,
      toSpaceId: spaceId,
      direction: 'both',
      finalExit: false,
      availability: 'open',
      emergencyUse: true,
      accessibility: { stepFree: 'yes', wheelchair: 'yes' },
    });
    next.routeEdges.push({
      edgeId: `edge.${token}.${suffix}`,
      fromNodeId: corridor.nodeId!,
      toNodeId: nodeId,
      kind: 'door',
      bidirectional: true,
      distanceM: 2,
      durationSec: 3,
      availability: 'open',
      emergencyUse: true,
      accessibility: { stepFree: 'yes', wheelchair: 'yes' },
      connectorId: null,
      portalId,
    });
    next.zones.find((zone) => zone.levelId === selectedLevel.levelId)?.spaceIds.push(spaceId);
    setSelectedSpaceId(spaceId);
  }, 'A room, stable IDs, geometry, door and route edge were added together.');

  const addZone = () => updateDraft((next) => {
    const token = levelToken(selectedLevel.levelId);
    const count = next.zones.filter((zone) => zone.zoneId.startsWith(`zone.${token}.field`)).length + 1;
    next.zones.push({
      zoneId: `zone.${token}.field-${count}`,
      levelId: selectedLevel.levelId,
      name: `Field zone ${count}`,
      spaceIds: [selectedSpace.spaceId],
    });
  }, `A zone was created around ${selectedSpace.name}.`);

  const calculateRoute = () => {
    const startNode = venue.spaces.find((space) => space.spaceId === 'space.two.north')?.nodeId;
    if (!startNode) return;
    const result = routeToNearestExit(venue, {
      fromNodeId: startNode,
      profile: routeProfile,
      closedConnectorIds: rampClosed ? ['connector.east-ramp'] : [],
    });
    setRoute(result);
    if (result.outcome === 'ok') {
      setNotice(`Route found across ${result.levelIds.length} levels in ${result.totalDurationSec}s.`);
    } else {
      setNotice('No eligible route: the selected profile and closure state are being enforced.');
    }
  };

  const publishLocalDemo = () => {
    const found = validateVenuePackage(venue);
    if (found.length > 0) {
      setNotice(`Publication blocked by ${found.length} validation issue${found.length === 1 ? '' : 's'}.`);
      return;
    }
    setVenue(createCommandLocalDemo(venue, new Date().toISOString()));
    setNotice('Immutable local demo created in this browser. It is not signed or deployed to a Gateway.');
  };

  const startNewDraft = () => {
    const next = createCommandSuccessorDraft(venue, new Date().toISOString());
    setVenue(next);
    setNotice('New editable draft forked with publication lineage preserved.');
  };

  const installGatewaySimulation = () => {
    try {
      const snapshot = installCommandGatewaySimulation(venue, Date.now(), window.localStorage);
      setGatewayLoad({ status: 'loaded', snapshot, error: null });
      setNotice('Simulation-only offline copy installed and reloaded from browser storage. No Gateway, radio or signature claim.');
    } catch {
      setGatewayLoad(loadCommandGatewaySimulation(window.localStorage));
      setNotice('Simulated install failed closed; no successful Gateway copy is being reported.');
    }
  };

  const clearGatewaySimulation = () => {
    try {
      clearCommandGatewaySimulation(window.localStorage);
      setGatewayLoad({ status: 'empty', snapshot: null, error: null });
      setNotice('Simulated Gateway copy removed. The Command venue package was not changed.');
    } catch {
      setNotice('Browser storage could not remove the simulated copy.');
    }
  };

  return (
    <>
      <PageHead
        title="Building commissioning"
        sub="Model a venue once; Guard, Command and future Gateway packages consume the same stable building objects."
      />
      <Console>
        <ConsoleTop
          site={<><b>{venue.name}</b> · synthetic training venue</>}
          tag={{ text: venue.state === 'draft' ? 'BROWSER DRAFT' : 'LOCAL DEMO', variant: venue.state === 'draft' ? 'amber' : 'ok' }}
        />

        <div className="commission-views" role="tablist" aria-label="Commissioning tools">
          <button type="button" role="tab" aria-selected={workspaceView === 'map'} className={workspaceView === 'map' ? 'active' : ''} onClick={() => setWorkspaceView('map')}>
            <Icon name="grid" size={15} /> Map builder
          </button>
          <button type="button" role="tab" aria-selected={workspaceView === 'registration'} className={workspaceView === 'registration' ? 'active' : ''} onClick={() => setWorkspaceView('registration')}>
            <Icon name="doc" size={15} /> Plan registration
          </button>
          <button type="button" role="tab" aria-selected={workspaceView === 'gateway'} className={workspaceView === 'gateway' ? 'active' : ''} onClick={() => setWorkspaceView('gateway')}>
            <Icon name="shield" size={15} /> Gateway simulation
            {gatewaySnapshot && <span className="commission-view-dot">1</span>}
          </button>
          <button type="button" role="tab" aria-selected={workspaceView === 'replay'} className={workspaceView === 'replay' ? 'active' : ''} onClick={() => setWorkspaceView('replay')}>
            <Icon name="radar" size={15} /> Sensor replay
          </button>
        </div>

        <div className="commission-actions">
          <div>
            <div className="commission-kicker">Commissioning workspace</div>
            <div className="commission-title">{workspaceView === 'map' ? 'Four-level venue package' : workspaceView === 'registration' ? 'Floor-plan control-point registration' : workspaceView === 'gateway' ? 'Offline Gateway distribution' : 'Phone sensor journey replay'}</div>
            <div className="commission-meta">{workspaceView === 'map' ? `${venue.mapVersion} · ${statusCopy(venue)}` : workspaceView === 'registration' ? `${venue.mapVersion} · source pixels to building metres` : workspaceView === 'gateway' ? `${reconciliationCopy(reconciliation).label} · simulation-only` : `${venue.mapVersion} · development replay only`}</div>
          </div>
          <div className="commission-action-buttons">
            {workspaceView === 'map' ? (
              <>
                <button className="btn ghost" type="button" onClick={() => {
                  const reset = createSyntheticFourLevelVenue();
                  setVenue(reset);
                  setSelectedLevelId('level.ground');
                  setRoute(null);
                  setNotice('Synthetic fixture reset in browser-local draft state.');
                }}>
                  Reset fixture
                </button>
                {editable ? (
                  <button className="btn go" type="button" onClick={publishLocalDemo} disabled={issues.length > 0}>
                    <Icon name="check" size={16} /> Create local demo
                  </button>
                ) : (
                  <button className="btn go" type="button" onClick={startNewDraft}>
                    <Icon name="plus" size={16} /> New draft
                  </button>
                )}
              </>
            ) : workspaceView === 'registration' ? (
              <Pill tone="amber">NO SURVEY CLAIM</Pill>
            ) : workspaceView === 'gateway' ? (
              <>
                {(gatewaySnapshot || gatewayLoad.status === 'invalid') && (
                  <button className="btn ghost" type="button" onClick={clearGatewaySimulation}>Remove simulated copy</button>
                )}
                <button className="btn go" type="button" onClick={installGatewaySimulation} disabled={venue.state !== 'local-demo'}>
                  <Icon name="check" size={16} /> {gatewaySnapshot ? 'Replace simulated copy' : 'Install simulated copy'}
                </button>
              </>
            ) : (
              <Pill tone="amber">NO LIVE SENSOR</Pill>
            )}
          </div>
        </div>

        <div className="commission-truth" role="status">
          <Icon name="info" size={16} />
          <span><b>Evidence boundary:</b> {workspaceView === 'map'
            ? 'synthetic geometry, browser-local storage, unsigned package. Gateway distribution and physical survey remain unclaimed.'
            : workspaceView === 'registration'
              ? 'the built-in plan is synthetic and imported JSON remains operator-unverified. No source drawing, measured control point or field accuracy is claimed.'
            : workspaceView === 'gateway'
              ? 'this is a browser-local replica labelled simulation-only. Production signing, durable Gateway storage, radio transfer and physical proof remain unclaimed.'
              : 'this view replays synthetic or recorded-unverified samples. No phone is connected and no building, background-mode or floor-accuracy result is claimed.'}</span>
        </div>

        {workspaceView === 'map' ? (
          <>
        <div className="commission-grid">
          <aside className="commission-levels" aria-label="Venue levels">
            <SectionTitle>Building levels</SectionTitle>
            {levels.map((level) => {
              const count = venue.spaces.filter((space) => space.levelId === level.levelId).length;
              const zoneCount = projectedZones.filter((zone) => zone.levelId === level.levelId).length;
              return (
                <button
                  type="button"
                  key={level.levelId}
                  className={`commission-level ${selectedLevel.levelId === level.levelId ? 'active' : ''}`}
                  onClick={() => setSelectedLevelId(level.levelId)}
                  aria-pressed={selectedLevel.levelId === level.levelId}
                >
                  <span className="commission-level-ref">{level.levelRef}</span>
                  <span><b>{level.name}</b><small>{count} spaces · {zoneCount} zone{zoneCount === 1 ? '' : 's'} · {level.elevationM}m</small></span>
                </button>
              );
            })}
            <div className="commission-validation">
              <SectionTitle>Validation gate</SectionTitle>
              <Pill tone={issues.length === 0 ? 'ok' : 'alert'}>{issues.length === 0 ? 'READY' : `${issues.length} ISSUES`}</Pill>
              <p>{issues.length === 0 ? 'References, geometry, routes and legacy floor codes are coherent.' : issues[0].message}</p>
            </div>
          </aside>

          <section className="commission-map-column">
            <header className="commission-map-head">
              <div>
                <b>{selectedLevel.name}</b>
                <span>{selectedLevel.levelId} · local frame metres</span>
              </div>
              <div className="commission-map-tools">
                <button type="button" onClick={addRoom} disabled={!editable}><Icon name="plus" size={14} /> Add room</button>
                <button type="button" onClick={addZone} disabled={!editable}><Icon name="grid" size={14} /> Add zone</button>
              </div>
            </header>
            <div className="commission-map-wrap">
              <svg className="commission-map" viewBox={`0 0 ${plan.widthM} ${plan.heightM}`} role="img" aria-labelledby="commission-map-title">
                <title id="commission-map-title">Editable floor plan for {selectedLevel.name}</title>
                <defs>
                  <pattern id="commission-grid-pattern" width="2" height="2" patternUnits="userSpaceOnUse">
                    <path d="M 2 0 L 0 0 0 2" className="commission-grid-line" />
                  </pattern>
                </defs>
                <rect width={plan.widthM} height={plan.heightM} className="commission-grid-fill" />
                {plan.shapes.map((shape) => {
                  const space = venue.spaces.find((candidate) => candidate.spaceId === shape.spaceId)!;
                  const selected = space.spaceId === selectedSpace.spaceId;
                  return (
                    <g key={shape.shapeId} className={`commission-shape ${space.kind} ${selected ? 'selected' : ''}`}>
                      <polygon
                        points={shape.points.map((point) => `${point.xM},${point.yM}`).join(' ')}
                        tabIndex={0}
                        role="button"
                        aria-label={`Select ${space.name}`}
                        onClick={() => setSelectedSpaceId(space.spaceId)}
                        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedSpaceId(space.spaceId); }}
                      />
                      <text x={shape.points.reduce((sum, point) => sum + point.xM, 0) / shape.points.length} y={shape.points.reduce((sum, point) => sum + point.yM, 0) / shape.points.length}>
                        {mapLabel(space)}
                      </text>
                    </g>
                  );
                })}
                {routeSegments.map((edge) => {
                  const from = venue.routeNodes.find((node) => node.nodeId === edge.fromNodeId);
                  const to = venue.routeNodes.find((node) => node.nodeId === edge.toNodeId);
                  if (!from || !to || from.levelId !== selectedLevel.levelId || to.levelId !== selectedLevel.levelId) return null;
                  return <line key={edge.edgeId} x1={from.position.xM} y1={from.position.yM} x2={to.position.xM} y2={to.position.yM} className="commission-route-line" />;
                })}
                {venue.routeNodes.filter((node) => node.levelId === selectedLevel.levelId && routeNodeIds.has(node.nodeId)).map((node) => (
                  <circle key={node.nodeId} cx={node.position.xM} cy={node.position.yM} r="0.7" className="commission-route-node" />
                ))}
              </svg>
              <div className="commission-map-legend">
                <span><i className="room" /> room</span><span><i className="route" /> active route</span><span><i className="selected" /> selection</span>
              </div>
            </div>
          </section>

          <aside className="commission-inspector">
            <SectionTitle>Selected object</SectionTitle>
            <div className="commission-object-id">{selectedSpace.spaceId}</div>
            <label className="field commission-field">
              <span>Display name</span>
              <input value={selectedSpace.name} onChange={(event) => renameSelected(event.target.value)} disabled={!editable} />
            </label>
            <label className="field commission-field">
              <span>Object kind</span>
              <select value={selectedSpace.kind} onChange={(event) => changeSelectedKind(event.target.value as VenueSpace['kind'])} disabled={!editable}>
                <option value="room">room</option>
                <option value="corridor">corridor</option>
                <option value="lobby">lobby</option>
                <option value="service">service</option>
                <option value="outdoor">outdoor</option>
                <option value="void">void</option>
              </select>
            </label>
            <dl className="commission-facts">
              <div><dt>Kind</dt><dd>{selectedSpace.kind}</dd></div>
              <div><dt>Reference</dt><dd>{selectedSpace.ref ?? 'none'}</dd></div>
              <div><dt>Primary node</dt><dd>{selectedSpace.nodeId ?? 'not navigable'}</dd></div>
              <div><dt>Egress</dt><dd>{selectedSpace.stepFreeEgressRequired ? 'step-free required' : 'standard'}</dd></div>
            </dl>
            <SectionTitle>Move geometry</SectionTitle>
            <div className="commission-nudge" aria-label="Move selected geometry">
              <button type="button" onClick={() => moveSelected(0, -1)} disabled={!editable}>↑ 1m</button>
              <button type="button" onClick={() => moveSelected(-1, 0)} disabled={!editable}>← 1m</button>
              <button type="button" onClick={() => moveSelected(1, 0)} disabled={!editable}>1m →</button>
              <button type="button" onClick={() => moveSelected(0, 1)} disabled={!editable}>1m ↓</button>
            </div>
            <p className="commission-help">Labels can change; stable IDs do not. Geometry edits are validated before a local demo can be created.</p>
          </aside>
        </div>

        <div className="commission-route-panel">
          <div>
            <SectionTitle>Cross-floor egress check</SectionTitle>
            <b>Level 2 north room → nearest final exit</b>
            <span>Reuses the same route graph that operational clients receive.</span>
          </div>
          <label>
            <span>Profile</span>
            <select value={routeProfile} onChange={(event) => setRouteProfile(event.target.value as RouteProfile)}>
              {ROUTE_PROFILES.map((profile) => <option key={profile}>{profile}</option>)}
            </select>
          </label>
          <label className="commission-check">
            <input type="checkbox" checked={rampClosed} onChange={(event) => setRampClosed(event.target.checked)} /> East ramp closed
          </label>
          <button type="button" className="btn" onClick={calculateRoute}><Icon name="arrow" size={15} /> Calculate</button>
          <div className={`commission-route-result ${route?.outcome ?? ''}`}>
            {route === null && 'Not yet calculated'}
            {route?.outcome === 'ok' && <><b>{route.totalDurationSec}s</b><span>{route.levelIds.length} levels · {route.connectorIds.join(', ') || 'same floor'}</span></>}
            {route?.outcome === 'no-route' && <><b>No route</b><span>{route.reason}</span></>}
            {route?.outcome === 'invalid-request' && <><b>Invalid</b><span>{route.reason}</span></>}
          </div>
        </div>
        <div className="commission-audit">
          <Icon name="doc" size={14} />
          {venue.publication.publishedAt ? (
            <span><b>Publication record</b> · {venue.publication.authority} · unsigned · {venue.publication.publishedBy} · {venue.publication.publishedAt}</span>
          ) : (
            <span><b>Draft record</b> · parent {venue.parentMapVersion ?? 'none'} · no publication authority or signature</span>
          )}
        </div>
          </>
        ) : workspaceView === 'registration' ? (
          <PlanRegistrationView
            venue={venue}
            onApply={(next, receipt) => {
              setVenue(next);
              setSelectedLevelId(receipt.levelId);
              setRoute(null);
              setNotice(`Plan registration applied locally to ${receipt.levelId}; physical review remains required.`);
            }}
            onOpenMap={(levelId) => { setSelectedLevelId(levelId); setWorkspaceView('map'); }}
          />
        ) : workspaceView === 'gateway' ? (
          <GatewaySimulationView
            venue={venue}
            load={gatewayLoad}
            reconciliation={reconciliation}
            onOpenMap={() => setWorkspaceView('map')}
          />
        ) : (
          <SensorReplayView venue={venue} />
        )}
        <div className="commission-notice" aria-live="polite">{notice}</div>
      </Console>
    </>
  );
}

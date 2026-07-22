import { useEffect, useMemo, useState } from 'react';
import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ensureBlePermissions } from '@loc8/engine';
import {
  addPacketListener,
  addStatusListener,
  broadcastFieldTest,
  getFieldDiagnostics,
  releaseFieldDiagnostics,
  start,
  startFieldDiagnostics,
  stop,
  stopFieldDiagnostics,
  type MeshFieldDiagnosticsSnapshot,
  type MeshFieldRole,
} from '../modules/loc8-mesh';
import {
  MESH_FIELD_BLOCKS,
  encodeFieldJsonl,
  fieldAttemptPacket,
  fieldContextIssue,
  fieldExportFilename,
  participatingRoles,
} from '../src/research/meshFieldProtocol';

const FIELD_MODE = __DEV__ &&
  process.env.EXPO_PUBLIC_MESH_FIELD_KIT === '1' &&
  process.env.EXPO_PUBLIC_TRANSPORT === 'ble';

type Phase = 'idle' | 'active' | 'sending' | 'closed';

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function MeshFieldScreen() {
  if (!FIELD_MODE) return <Unavailable />;
  return <FieldHarness />;
}

function Unavailable() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.unavailable}>
        <Text style={styles.title}>MESH-01 FIELD KIT DISABLED</Text>
        <Text style={styles.body}>
          Rebuild a native development client with EXPO_PUBLIC_TRANSPORT=ble and
          EXPO_PUBLIC_MESH_FIELD_KIT=1. This route is intentionally unavailable in normal builds.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function FieldHarness() {
  const [runId, setRunId] = useState('mesh01-physical-001');
  const [cohortId, setCohortId] = useState('ios-ios-ios');
  const [role, setRole] = useState<MeshFieldRole>('A');
  const [blockIndex, setBlockIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [sent, setSent] = useState(0);
  const [received, setReceived] = useState(0);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [degraded, setDegraded] = useState(false);
  const [snapshot, setSnapshot] = useState<MeshFieldDiagnosticsSnapshot | null>(null);
  const [sharedFileUri, setSharedFileUri] = useState<string | null>(null);
  const [exportConfirmed, setExportConfirmed] = useState(false);
  const [recovering, setRecovering] = useState(true);
  const [attemptLoopStarted, setAttemptLoopStarted] = useState(false);
  const [notice, setNotice] = useState('Select the same run, cohort and block on every participating phone.');
  const [error, setError] = useState<string | null>(null);

  const block = MESH_FIELD_BLOCKS[blockIndex];
  const roles = useMemo(() => participatingRoles(block), [block]);
  const participates = roles.includes(role);
  const isSource = role === block.sourceRole;
  const locked = phase === 'active' || phase === 'sending';
  const unexported = phase === 'closed' && snapshot !== null && !exportConfirmed;
  const filename = fieldExportFilename(runId, block.blockId, role);

  useEffect(() => {
    let active = true;
    let packetSub: ReturnType<typeof addPacketListener> | undefined;
    let statusSub: ReturnType<typeof addStatusListener> | undefined;

    async function initialize() {
      try {
        packetSub = addPacketListener(() => {
          if (active) setReceived((value) => value + 1);
        });
        statusSub = addStatusListener((status) => {
          if (!active) return;
          setNearbyCount(status.nearbyCount);
          setDegraded(status.degraded === true);
        });
        const recovered = await getFieldDiagnostics();
        if (!active) return;
        const first = recovered.events[0];
        if (!first) return;
        const recoveredBlockIndex = MESH_FIELD_BLOCKS.findIndex((candidate) => candidate.blockId === first.blockId);
        if (recoveredBlockIndex < 0) {
          setError(`Native snapshot has unknown block ${first.blockId}; preserve it and stop this run.`);
          return;
        }
        setRunId(first.runId);
        setCohortId(first.cohortId);
        setRole(first.deviceRole);
        setBlockIndex(recoveredBlockIndex);
        setSent(recovered.events.filter((event) => event.action === 'origin').length);
        setReceived(recovered.events.filter((event) => event.action === 'application-delivery').length);
        setSnapshot(recovered);
        setSharedFileUri(null);
        setExportConfirmed(false);
        setAttemptLoopStarted(recovered.active);
        setPhase(recovered.active ? 'active' : 'closed');
        setNotice(
          recovered.active
            ? 'Recovered an active snapshot after reload. Treat the block as interrupted; stop and secure it as INCOMPLETE.'
            : 'Recovered a closed unexported snapshot after reload. Secure and hash it before starting anything else.',
        );
      } catch (caught) {
        if (active) setError(message(caught));
      } finally {
        if (active) setRecovering(false);
      }
    }

    void initialize();
    return () => {
      active = false;
      packetSub?.remove();
      statusSub?.remove();
    };
  }, []);

  function resetForSelection(nextBlock: number, nextRole = role) {
    if (locked || unexported) return;
    setBlockIndex(nextBlock);
    setRole(nextRole);
    setPhase('idle');
    setSnapshot(null);
    setSharedFileUri(null);
    setExportConfirmed(false);
    setAttemptLoopStarted(false);
    setSent(0);
    setReceived(0);
    setNearbyCount(0);
    setDegraded(false);
    setError(null);
    setNotice('Selection changed. Confirm it on every participating phone before starting.');
  }

  async function beginBlock() {
    setError(null);
    if (recovering) {
      setError('Wait for native snapshot recovery to finish.');
      return;
    }
    if (unexported) {
      setError('Copy the closed JSONL export before starting another block.');
      return;
    }
    const contextIssue = fieldContextIssue(runId, cohortId);
    if (contextIssue) {
      setError(contextIssue);
      return;
    }
    if (!participates) {
      setError(`Role ${role} must remain stopped for ${block.blockId}.`);
      return;
    }
    let diagnosticsStarted = false;
    try {
      const allowed = await ensureBlePermissions();
      if (!allowed) throw new Error('Required Bluetooth/location permissions were not granted.');
      await startFieldDiagnostics(runId, cohortId, block.blockId, role, block.sourceRole);
      diagnosticsStarted = true;
      await start();
      setPhase('active');
      setSnapshot(null);
      setSharedFileUri(null);
      setExportConfirmed(false);
      setAttemptLoopStarted(false);
      setSent(0);
      setReceived(0);
      setNotice(
        isSource
          ? 'Diagnostics active. Wait for the runbook topology/link check, then send the frozen attempts.'
          : 'Diagnostics active. Do not send from this phone; wait for the source and watch ingress.',
      );
    } catch (caught) {
      setError(message(caught));
      await stop().catch(() => {});
      if (diagnosticsStarted) {
        try {
          await stopFieldDiagnostics();
          const interrupted = await getFieldDiagnostics();
          setSnapshot(interrupted);
          setPhase('closed');
          setNotice('Native mesh start failed after diagnostics began. Secure this snapshot and classify the block INCOMPLETE.');
        } catch (recoveryError) {
          setError(`${message(caught)}; recorder recovery also failed: ${message(recoveryError)}`);
          setPhase('idle');
        }
      } else {
        setPhase('idle');
      }
    }
  }

  async function sendAttempts() {
    if (phase !== 'active' || !isSource || attemptLoopStarted) return;
    setError(null);
    setAttemptLoopStarted(true);
    setPhase('sending');
    setSent(0);
    try {
      for (let sequence = 0; sequence < block.expectedAttempts; sequence += 1) {
        if (AppState.currentState !== 'active') {
          throw new Error('App left the foreground; stop/export this interrupted block as INCOMPLETE.');
        }
        await broadcastFieldTest(fieldAttemptPacket(role, sequence), sequence);
        setSent(sequence + 1);
        if (sequence + 1 < block.expectedAttempts) await pause(1_000);
      }
      setNotice(`All ${block.expectedAttempts} numbered attempts were submitted. Wait 10 seconds, then stop/export on every participating phone.`);
    } catch (caught) {
      setError(message(caught));
      setNotice('Attempt loop interrupted. Preserve the evidence; do not silently rerun this block under the same ID.');
    } finally {
      setPhase('active');
    }
  }

  async function closeBlock() {
    if (phase !== 'active') return;
    setError(null);
    try {
      await stopFieldDiagnostics();
      const closed = await getFieldDiagnostics();
      await stop();
      setSnapshot(closed);
      setSharedFileUri(null);
      setExportConfirmed(false);
      setPhase('closed');
      setNotice(
        closed.overflowCount === 0
          ? 'Snapshot closed. Copy it now; starting another block would replace the native buffer.'
          : `FATAL EVIDENCE CONDITION: native buffer overflowed ${closed.overflowCount} time(s).`,
      );
    } catch (caught) {
      setError(message(caught));
    }
  }

  async function shareExport() {
    if (!snapshot) return;
    let file: File | null = null;
    try {
      const jsonl = encodeFieldJsonl(snapshot.events);
      const available = await Sharing.isAvailableAsync();
      if (!available) throw new Error('System file sharing is not available on this device.');
      file = new File(Paths.cache, filename);
      file.create({ overwrite: true });
      file.write(jsonl);
      await Sharing.shareAsync(file.uri, {
        dialogTitle: `Secure MESH-01 export: ${filename}`,
        mimeType: 'application/x-ndjson',
        UTI: 'public.json',
      });
      setSharedFileUri(file.uri);
      setNotice(`Share sheet closed for ${filename}. Verify the exact file in the approved encrypted bundle and record its SHA-256 before confirming below.`);
    } catch (caught) {
      if (file?.exists) file.delete();
      setSharedFileUri(null);
      setError(message(caught));
    }
  }

  async function confirmSecuredExport() {
    if (!snapshot || !sharedFileUri) return;
    try {
      const cacheFile = new File(sharedFileUri);
      if (cacheFile.exists) cacheFile.delete();
      await releaseFieldDiagnostics();
      setExportConfirmed(true);
      setSharedFileUri(null);
      setNotice(`Operator confirmed ${filename} is secured and hashed. The transient app-cache copy was deleted; the next block may now start.`);
    } catch (caught) {
      setError(message(caught));
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>RESEARCH BUILD · PHYSICAL EVIDENCE</Text>
        <Text style={styles.title}>MESH-01 THREE-PHONE RELAY</Text>
        <Text style={styles.warning}>
          Synthetic packets only. Foreground/screen-on. No security, range, venue, background or pilot claim.
        </Text>

        <Section title="Run context">
          <Label text="RUN ID" />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!locked && phase !== 'closed'}
            onChangeText={setRunId}
            style={styles.input}
            value={runId}
          />
          <Label text="COHORT ID" />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!locked && phase !== 'closed'}
            onChangeText={setCohortId}
            style={styles.input}
            value={cohortId}
          />
          <Label text="THIS PHONE" />
          <View style={styles.row}>
            {(['A', 'B', 'C'] as const).map((candidate) => (
              <Choice
                key={candidate}
                disabled={locked || unexported}
                label={candidate}
                onPress={() => resetForSelection(blockIndex, candidate)}
                selected={role === candidate}
              />
            ))}
          </View>
        </Section>

        <Section title={`Block ${blockIndex + 1} of ${MESH_FIELD_BLOCKS.length}`}>
          <Text style={styles.blockId}>{block.blockId}</Text>
          <Text style={styles.body}>
            {block.kind} · {block.sourceRole} → {block.destinationRole}
            {block.relayRole ? ` via ${block.relayRole}` : ''} · {block.expectedAttempts} attempts at 1/s
          </Text>
          <Text style={[styles.body, !participates && styles.danger]}>
            Participating phones: {roles.join(', ')}. {participates ? `This phone is ${isSource ? 'SOURCE' : 'OBSERVER'}.` : `Role ${role} MUST STAY OFF.`}
          </Text>
          <View style={styles.row}>
            <Button
              disabled={locked || unexported || blockIndex === 0}
              label="Previous"
              onPress={() => resetForSelection(blockIndex - 1)}
            />
            <Button
              disabled={locked || unexported || blockIndex === MESH_FIELD_BLOCKS.length - 1}
              label="Next"
              onPress={() => resetForSelection(blockIndex + 1)}
            />
          </View>
        </Section>

        <Section title="Live evidence">
          <Metric label="phase" value={recovering ? 'RECOVERING' : phase.toUpperCase()} />
          <Metric label="nearby links" value={String(nearbyCount)} danger={block.kind.startsWith('isolation') && nearbyCount > 0} />
          <Metric label="attempts submitted" value={`${sent}/${isSource ? block.expectedAttempts : 0}`} />
          <Metric label="application deliveries" value={String(received)} />
          <Metric label="scan-only degraded" value={degraded ? 'YES' : 'NO'} danger={degraded} />
          {snapshot && <Metric label="export lines / overflow" value={`${snapshot.events.length} / ${snapshot.overflowCount}`} danger={snapshot.overflowCount > 0} />}
        </Section>

        <View style={styles.actions}>
          <Button disabled={recovering || phase !== 'idle' || !participates} label="1 · Start diagnostics + BLE" onPress={beginBlock} primary />
          <Button disabled={phase !== 'active' || !isSource || attemptLoopStarted} label={`2 · Send ${block.expectedAttempts} attempts`} onPress={sendAttempts} primary />
          <Button disabled={phase !== 'active'} label="3 · Stop + freeze snapshot" onPress={closeBlock} />
          <Button disabled={!snapshot} label="4 · Share JSONL file" onPress={shareExport} />
          <Button
            disabled={!snapshot || !sharedFileUri || exportConfirmed}
            label={exportConfirmed ? '5 · Secured export confirmed' : '5 · Confirm secured + SHA-256 recorded'}
            onPress={confirmSecuredExport}
          />
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>{notice}</Text>
          {error && <Text style={styles.error}>{error}</Text>}
          {snapshot && <Text style={styles.filename}>{filename}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

function Choice(props: { label: string; selected: boolean; disabled: boolean; onPress(): void }) {
  return (
    <Pressable
      disabled={props.disabled}
      onPress={props.onPress}
      style={[styles.choice, props.selected && styles.choiceSelected, props.disabled && styles.disabled]}
    >
      <Text style={styles.choiceText}>{props.label}</Text>
    </Pressable>
  );
}

function Button(props: { label: string; disabled?: boolean; primary?: boolean; onPress(): void }) {
  return (
    <Pressable
      disabled={props.disabled}
      onPress={props.onPress}
      style={[styles.button, props.primary && styles.buttonPrimary, props.disabled && styles.disabled]}
    >
      <Text style={styles.buttonText}>{props.label}</Text>
    </Pressable>
  );
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, danger && styles.danger]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#080b12' },
  content: { padding: 18, paddingBottom: 64, gap: 14 },
  unavailable: { flex: 1, justifyContent: 'center', padding: 28, gap: 16 },
  kicker: { color: '#55d6be', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#f6f8ff', fontSize: 22, fontWeight: '900', letterSpacing: 0.4 },
  warning: { color: '#ffcb66', fontSize: 12, lineHeight: 18, borderLeftWidth: 3, borderLeftColor: '#ffcb66', paddingLeft: 10 },
  section: { backgroundColor: '#111725', borderWidth: 1, borderColor: '#273249', borderRadius: 14, padding: 14, gap: 9 },
  sectionTitle: { color: '#f6f8ff', fontSize: 15, fontWeight: '800' },
  label: { color: '#8d9ab3', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginTop: 4 },
  input: { color: '#f6f8ff', backgroundColor: '#090d16', borderColor: '#35435f', borderWidth: 1, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 10, fontSize: 14 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  choice: { minWidth: 56, alignItems: 'center', padding: 12, borderRadius: 9, borderWidth: 1, borderColor: '#35435f', backgroundColor: '#090d16' },
  choiceSelected: { borderColor: '#55d6be', backgroundColor: '#16322f' },
  choiceText: { color: '#f6f8ff', fontWeight: '900' },
  blockId: { color: '#55d6be', fontSize: 18, fontWeight: '900' },
  body: { color: '#bdc7da', fontSize: 12, lineHeight: 18 },
  actions: { gap: 9 },
  button: { flex: 1, minHeight: 46, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#4a5a78', backgroundColor: '#182034' },
  buttonPrimary: { backgroundColor: '#176b61', borderColor: '#55d6be' },
  buttonText: { color: '#f6f8ff', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  disabled: { opacity: 0.35 },
  metric: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  metricLabel: { color: '#8d9ab3', fontSize: 12 },
  metricValue: { color: '#f6f8ff', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  notice: { gap: 8, borderRadius: 12, backgroundColor: '#0e1421', padding: 14 },
  noticeText: { color: '#bdc7da', fontSize: 12, lineHeight: 18 },
  error: { color: '#ff6b72', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  danger: { color: '#ff6b72' },
  filename: { color: '#55d6be', fontSize: 11, fontFamily: 'monospace' },
});

type FieldAccessInput = {
  development: boolean;
  kit: string | undefined;
  transport: string | undefined;
  mode: string | undefined;
  marker: unknown;
  applicationId: string | undefined;
};

export function meshFieldAccess(input: FieldAccessInput): { enabled: boolean; internal: boolean; commit: string | null } {
  const flags = input.kit === '1' && input.transport === 'ble';
  const marker = input.marker as Record<string, unknown> | null;
  const mode = input.mode ?? 'current';
  const validMode = mode === 'current' || mode === 'branch';
  const app = marker?.app;
  const expectedId = `${app === 'guard' ? 'com.emotiveimpact.loc8guard' : 'com.emotiveimpact.loc8'}.field.${mode}`;
  const internal = flags && validMode && marker?.schema === 'loc8.internal-field-build.v1' &&
    (app === 'public' || app === 'guard') && marker.mode === mode &&
    marker.applicationId === expectedId && input.applicationId === expectedId &&
    typeof marker.commit === 'string' && /^[0-9a-f]{40}$/.test(marker.commit);
  return {
    enabled: flags && (input.development || internal),
    internal,
    commit: internal ? marker.commit as string : null,
  };
}

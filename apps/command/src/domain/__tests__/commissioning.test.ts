import { createSyntheticFourLevelVenue } from '../../engine';
import {
  canCreateCommandLocalDemo,
  createCommandLocalDemo,
  createCommandSuccessorDraft,
} from '../commissioning';

describe('Command commissioning publication policy', () => {
  it('moves a valid draft to an unsigned browser-local snapshot and then forks lineage', () => {
    const draft = createSyntheticFourLevelVenue();
    expect(canCreateCommandLocalDemo(draft)).toBe(true);
    const publication = createCommandLocalDemo(draft, '2026-07-22T12:00:00.000Z');
    expect(publication).toMatchObject({
      state: 'local-demo',
      mapVersion: 'map.synthetic.local.002',
      parentMapVersion: 'map.synthetic.draft.001',
      publication: {
        authority: 'browser-local',
        signed: false,
        contentSha256: null,
        publishedBy: 'operator.command.01',
      },
    });
    expect(canCreateCommandLocalDemo(publication)).toBe(false);

    const successor = createCommandSuccessorDraft(publication, '2026-07-22T13:00:00.000Z');
    expect(successor).toMatchObject({
      state: 'draft',
      mapVersion: 'map.synthetic.draft.003',
      parentMapVersion: 'map.synthetic.local.002',
      publication: { publishedAt: null, publishedBy: null },
    });
  });

  it('blocks local publication when a draft fails validation', () => {
    const draft = createSyntheticFourLevelVenue();
    draft.levels[0].levelId = 'BAD ID';
    expect(canCreateCommandLocalDemo(draft)).toBe(false);
    expect(() => createCommandLocalDemo(draft, '2026-07-22T12:00:00.000Z')).toThrow('valid draft');
  });
});

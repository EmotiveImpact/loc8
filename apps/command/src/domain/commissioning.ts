import {
  createLocalDemoPublication,
  forkVenueDraft,
  validateVenuePackage,
  type VenuePackage,
} from '../engine';

export function canCreateCommandLocalDemo(venue: VenuePackage) {
  return venue.state === 'draft' && validateVenuePackage(venue).length === 0;
}

export function createCommandLocalDemo(venue: VenuePackage, publishedAt: string): VenuePackage {
  if (!canCreateCommandLocalDemo(venue)) throw new Error('Command local demo requires a valid draft');
  const publication = createLocalDemoPublication(venue, {
    packageId: 'package.synthetic.hq.local.002',
    mapVersion: 'map.synthetic.local.002',
    publishedAt,
    publishedBy: 'operator.command.01',
  });
  return JSON.parse(JSON.stringify(publication.package)) as VenuePackage;
}

export function createCommandSuccessorDraft(venue: VenuePackage, validFrom: string): VenuePackage {
  return forkVenueDraft(venue, {
    packageId: 'package.synthetic.hq.draft.003',
    mapVersion: 'map.synthetic.draft.003',
    validFrom,
  });
}

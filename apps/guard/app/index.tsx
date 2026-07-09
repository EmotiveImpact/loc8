import { Redirect } from 'expo-router';
import { useGuardStore } from '../src/store/guardStore';

export default function Index() {
  const onDuty = useGuardStore((s) => s.onDuty);
  return <Redirect href={onDuty ? '/(tabs)/map' : '/shift'} />;
}

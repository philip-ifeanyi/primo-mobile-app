import Introduction from '@/components/intro';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  return (
    <SafeAreaProvider>
      <Introduction />
    </SafeAreaProvider>
  );
}

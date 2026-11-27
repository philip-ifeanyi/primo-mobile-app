import { colors, sizes } from '@/theme';
import { type ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Shared chrome for the five tab screens: canvas background, scrolling body. */
export function TabScreen({ children }: { children: ReactNode }) {
  return (
    // No bottom edge: the tab bar already sits on the bottom inset.
    <SafeAreaView
      style={styles.screen}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingHorizontal: sizes.screenPaddingFlow,
    paddingTop: 12,
    paddingBottom: 20,
  },
});

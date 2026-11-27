import { colors, sizes } from '@/theme';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type FlowFooterProps = {
  children: ReactNode;
  /**
   * Lay the actions out side by side, as checkout's Back + Pay pair does.
   *
   * The default is a column: a lone Button stretches itself with
   * `alignSelf: 'stretch'`, which in a row would stretch its height instead of
   * its width and leave the CTA hugging the left edge.
   */
  row?: boolean;
};

/** Sticky white action bar at the foot of the buy-flow screens. */
export function FlowFooter({ children, row = false }: FlowFooterProps) {
  return (
    <View style={[styles.footer, row ? styles.row : styles.column]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: 10,
    paddingHorizontal: sizes.screenPaddingFlow,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  column: { flexDirection: 'column' },
});

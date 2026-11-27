import { colors } from '@/theme';
import { Platform, StyleSheet, Text, View } from 'react-native';

type PlaceholderProps = {
  height: number;
  radius?: number;
  caption?: string;
};

/**
 * Stand-in for illustrations and editorial images that have not been
 * delivered yet. Keeps the final size so layouts do not shift when the real
 * asset lands.
 */
export function Placeholder({ height, radius = 0, caption }: PlaceholderProps) {
  return (
    <View style={[styles.box, { height, borderRadius: radius }]}>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: 'stretch',
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 10,
    color: colors.textMuted,
  },
});

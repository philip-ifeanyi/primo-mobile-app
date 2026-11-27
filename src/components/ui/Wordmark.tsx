import { Text } from '@/components/ui/Text';
import { text } from '@/theme';
import { Image as ExpoImage } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/** assets/images/logo.png is 185x229 — taller than it is wide. */
const LOGO_ASPECT = 185 / 229;

type WordmarkProps = {
  /** Type size for "primo"; the mark is scaled to sit on the same line. */
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * The Primo lockup: the shield mark beside the "primo" wordmark.
 *
 * The handoff only specifies the wordmark, so the mark was dropped when the
 * design was built. Keeping both in one component means the two places that
 * show the brand cannot drift apart again.
 */
export function Wordmark({
  fontSize = text.wordmark.fontSize,
  style,
}: WordmarkProps) {
  // A touch taller than the cap height so the mark reads as the same weight
  // as the type rather than sitting small next to it.
  const markHeight = Math.round(fontSize * 1.35);

  return (
    <View
      style={[styles.row, style]}
      accessibilityRole="image"
      accessibilityLabel="Primo"
    >
      <ExpoImage
        source={require('@/assets/images/logo.png')}
        style={{ height: markHeight, width: markHeight * LOGO_ASPECT }}
        contentFit="contain"
        // Decorative: the row already carries the brand name for screen readers.
        accessible={false}
      />
      <Text
        variant="wordmark"
        color="primary"
        style={{
          fontSize,
          lineHeight: Math.round(fontSize * 1.2),
          letterSpacing: fontSize * -0.03,
        }}
      >
        primo
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

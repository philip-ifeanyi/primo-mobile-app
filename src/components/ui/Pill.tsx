import { colors, radius } from '@/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

const TONES = {
  success: { background: colors.success, text: 'successInk' },
  accent: { background: colors.accent, text: 'accentInk' },
  /** The "Popular" tag on a product card. */
  neutral: { background: colors.field, text: 'ink' },
} as const;

type PillProps = {
  label: string;
  tone?: keyof typeof TONES;
};

export function Pill({ label, tone = 'success' }: PillProps) {
  const palette = TONES[tone];

  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}>
      <Text
        variant="pill"
        color={palette.text}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
});

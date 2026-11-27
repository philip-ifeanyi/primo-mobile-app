import { colors, radius } from '@/theme';
import { StyleSheet, View } from 'react-native';

/** 0 = empty, 1 = weak, 2 = fair, 3 = strong. */
export function scorePassword(value: string): 0 | 1 | 2 | 3 {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-zA-Z]/.test(value) && /[0-9]/.test(value)) score += 1;
  if (/[^a-zA-Z0-9]/.test(value) || value.length >= 12) score += 1;
  return Math.min(score, 3) as 0 | 1 | 2 | 3;
}

export function PasswordStrength({ score }: { score: 0 | 1 | 2 | 3 }) {
  return (
    <View style={styles.row}>
      {[1, 2, 3].map((segment) => (
        <View
          key={segment}
          style={[styles.segment, segment <= score && styles.segmentFilled]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 10,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.bar,
    backgroundColor: colors.border,
  },
  segmentFilled: { backgroundColor: colors.primary },
});

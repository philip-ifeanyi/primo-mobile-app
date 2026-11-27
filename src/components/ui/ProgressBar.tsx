import { colors, radius, sizes } from '@/theme';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

type ProgressBarProps = {
  /** 0 to 1. */
  progress: number;
  color?: string;
  /** Defaults to the spec's 7; the document upload bar is 6. */
  height?: number;
};

/** Spec: height 7, radius 99, track `field`, fill `primary`, width animates 300ms. */
export function ProgressBar({
  progress,
  color = colors.primary,
  height = sizes.progressHeight,
}: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, progress));

  const animated = useDerivedValue(
    () => withTiming(clamped, { duration: 300 }),
    [clamped]
  );

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animated.value * 100}%`,
  }));

  return (
    <View
      style={[styles.track, { height }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View
        style={[styles.fill, { backgroundColor: color }, fillStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: radius.pill,
    backgroundColor: colors.field,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});

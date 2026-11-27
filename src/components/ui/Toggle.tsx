import { colors, radius } from '@/theme';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

const TRACK_WIDTH = 46;
const TRACK_HEIGHT = 28;
const PADDING = 3;
const KNOB = TRACK_HEIGHT - PADDING * 2;

type ToggleProps = {
  value: boolean;
  onChange: (next: boolean) => void;
  accessibilityLabel?: string;
};

/** Spec: 46x28 track, 22pt knob, `primary` when on. */
export function Toggle({ value, onChange, accessibilityLabel }: ToggleProps) {
  const progress = useDerivedValue(
    () => withTiming(value ? 1 : 0, { duration: 180 }),
    [value]
  );

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * (TRACK_WIDTH - KNOB - PADDING * 2) }],
  }));

  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={[styles.track, value ? styles.trackOn : styles.trackOff]}
    >
      <Animated.View style={[styles.knob, knobStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    padding: PADDING,
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: colors.primary },
  trackOff: { backgroundColor: colors.borderStrong },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
});

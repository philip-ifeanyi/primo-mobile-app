import { colors, radius } from '@/theme';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type SpinnerProps = {
  size?: number;
  /** Ring thickness. The spec uses 2 at 18pt and 3 at 40pt. */
  thickness?: number;
  trackColor?: string;
  color?: string;
};

/** Spec: 0.8s linear rotation, track `border` with a `primary` top edge. */
export function Spinner({
  size = 18,
  thickness = 2,
  trackColor = colors.border,
  color = colors.primary,
}: SpinnerProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 800, easing: Easing.linear }),
      // -1 repeats forever; the third argument false stops it reversing.
      -1,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderWidth: thickness,
          borderColor: trackColor,
          borderTopColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: { borderRadius: radius.pill },
});

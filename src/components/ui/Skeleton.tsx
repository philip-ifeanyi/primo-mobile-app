import { colors } from '@/theme';
import { useEffect } from 'react';
import { type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type SkeletonProps = {
  width: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Loading bar. The spec's shimmer is a gradient sweep; there is no gradient
 * library in the project, so this pulses between the same two greys on the
 * same 1.1s linear loop instead.
 */
export function Skeleton({ width, height, radius = 7, style }: SkeletonProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 550, easing: Easing.linear }),
      -1,
      true
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.field },
        style,
      ]}
    >
      <Animated.View
        style={[
          { flex: 1, borderRadius: radius, backgroundColor: colors.border },
          animatedStyle,
        ]}
      />
    </Animated.View>
  );
}

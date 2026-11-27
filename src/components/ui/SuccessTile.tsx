import { colors } from '@/theme';
import Feather from '@expo/vector-icons/Feather';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type SuccessTileProps = {
  size?: number;
  radius?: number;
};

/**
 * Spec: pop animation, scale 0.6 -> 1.08 -> 1 over 450ms ease-out, opacity 0 -> 1.
 * Shared by the KYC "approved" step and the purchase success screen.
 */
export function SuccessTile({ size = 96, radius = 32 }: SuccessTileProps) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.08, { duration: 300, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 150 })
    );
    opacity.value = withTiming(1, { duration: 300 });
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: radius },
        animatedStyle,
      ]}
    >
      <Feather
        name="check"
        size={size * 0.42}
        color={colors.successInk}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});

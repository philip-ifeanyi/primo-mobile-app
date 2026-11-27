import { colors, radius } from '@/theme';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

// Spec: active dot 22x7, inactive 7x7, width animates over 200ms.
const DOT_SIZE = 7;
const ACTIVE_WIDTH = 22;
const GAP = 7;
const DURATION = 200;

type PageIndicatorProps = {
  count: number;
  activeIndex: number;
  activeColor?: string;
  inactiveColor?: string;
};

export function PageIndicator({
  count,
  activeIndex,
  activeColor = colors.primary,
  inactiveColor = colors.border,
}: PageIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => (
        <Dot
          key={index}
          active={index === activeIndex}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
      ))}
    </View>
  );
}

type DotProps = {
  active: boolean;
  activeColor: string;
  inactiveColor: string;
};

function Dot({ active, activeColor, inactiveColor }: DotProps) {
  const progress = useDerivedValue(
    () => withTiming(active ? 1 : 0, { duration: DURATION }),
    [active]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    width: DOT_SIZE + progress.value * (ACTIVE_WIDTH - DOT_SIZE),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor]
    ),
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: radius.pill,
  },
});

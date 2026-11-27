import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { BRAND } from './Button';

const DOT_SIZE = 8;
const ACTIVE_WIDTH = 26;
const GAP = 8;
const DURATION = 250;
const ACTIVE_COLOR = BRAND;
const INACTIVE_COLOR = '#E5E7EB';

type PageIndicatorProps = {
  count: number;
  activeIndex: number;
  activeColor?: string;
  inactiveColor?: string;
};

export function PageIndicator({
  count,
  activeIndex,
  activeColor = ACTIVE_COLOR,
  inactiveColor = INACTIVE_COLOR,
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
    borderRadius: DOT_SIZE / 2,
  },
});

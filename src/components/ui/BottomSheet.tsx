import { colors, radius } from '@/theme';
import { type ReactNode, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ENTER_MS = 280;
const EXIT_MS = 200;
const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 800;

type BottomSheetProps = {
  /**
   * Pass a function to get hold of `close`, so content can dismiss the sheet
   * through the exit animation rather than being unmounted from under it.
   */
  children: ReactNode | ((close: () => void) => ReactNode);
  /** Called once the exit animation has finished. */
  onDismiss: () => void;
  /**
   * Render through a native modal rather than in place.
   *
   * Needed whenever the sheet is mounted inside a ScrollView: the root is
   * absolutely positioned, which resolves against the scrolled content and
   * would put the sheet wherever the content happens to be rather than at the
   * bottom of the screen. Screens that are themselves a transparentModal
   * route, like the KYC gate, do not need it.
   */
  portal?: boolean;
};

export function BottomSheet({
  children,
  onDismiss,
  portal = false,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  // Start fully off-screen; screenHeight is always further than the sheet is tall.
  const translateY = useSharedValue(screenHeight);
  const [sheetHeight, setSheetHeight] = useState(screenHeight);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: ENTER_MS });
  }, [translateY]);

  const close = () => {
    translateY.value = withTiming(sheetHeight, { duration: EXIT_MS }, (done) => {
      if (done) runOnJS(onDismiss)();
    });
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      // Clamp at 0 so the sheet can be dragged down but never yanked upward.
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      const shouldDismiss =
        event.translationY > DISMISS_DISTANCE ||
        event.velocityY > DISMISS_VELOCITY;

      if (shouldDismiss) {
        translateY.value = withTiming(sheetHeight, { duration: EXIT_MS }, (done) => {
          if (done) runOnJS(onDismiss)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Scrim fades in step with the sheet's travel.
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, sheetHeight || 1],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const onSheetLayout = (event: LayoutChangeEvent) => {
    setSheetHeight(event.nativeEvent.layout.height);
  };

  const sheet = (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityLabel="Dismiss"
        />
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          onLayout={onSheetLayout}
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 24 },
            sheetStyle,
          ]}
        >
          <View style={styles.grabber} />
          {typeof children === 'function' ? children(close) : children}
        </Animated.View>
      </GestureDetector>
    </View>
  );

  if (!portal) return sheet;

  return (
    <Modal
      visible
      transparent
      // The sheet runs its own enter and exit animations.
      animationType="none"
      // Lets the scrim cover the status and navigation bars on Android.
      statusBarTranslucent
      navigationBarTranslucent
      // Android's hardware back button.
      onRequestClose={close}
    >
      {sheet}
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 18,
  },
});

import { colors, radius, sizes, text as textStyles } from '@/theme';
import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

const VARIANTS = {
  primary: {
    background: colors.primary,
    text: colors.surface,
    border: 'transparent',
  },
  outline: {
    background: colors.surface,
    text: colors.primary,
    border: colors.border,
  },
  text: {
    background: 'transparent',
    text: colors.primary,
    border: 'transparent',
  },
} as const;

const SIZES = {
  md: { height: sizes.buttonHeight, radius: radius.button, paddingHorizontal: 20 },
  sm: { height: 40, radius: radius.input, paddingHorizontal: 14 },
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const palette = VARIANTS[variant];
  const dimensions = SIZES[size];
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          height: dimensions.height,
          borderRadius: dimensions.radius,
          paddingHorizontal: dimensions.paddingHorizontal,
          backgroundColor: palette.background,
          borderColor: palette.border,
        },
        fullWidth && styles.fullWidth,
        // The spec asks for opacity 0.85 on press rather than a colour shift.
        pressed && isInteractive && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[textStyles.button, { color: palette.text }, textStyle]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
});

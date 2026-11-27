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

export const BRAND = '#0076B5';

const VARIANT_COLORS = {
  primary: {
    background: BRAND,
    backgroundPressed: '#005F91',
    text: '#FFFFFF',
    border: 'transparent',
  },
  secondary: {
    background: '#E6F1F8',
    backgroundPressed: '#D2E6F3',
    text: BRAND,
    border: 'transparent',
  },
  outline: {
    background: 'transparent',
    backgroundPressed: '#E6F1F8',
    text: BRAND,
    border: BRAND,
  },
} as const;

const SIZES = {
  sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14, gap: 6 },
  md: { paddingVertical: 16, paddingHorizontal: 20, fontSize: 16, gap: 8 },
  lg: { paddingVertical: 18, paddingHorizontal: 24, fontSize: 17, gap: 10 },
} as const;

export type ButtonVariant = keyof typeof VARIANT_COLORS;
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
  const colors = VARIANT_COLORS[variant];
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
          paddingVertical: dimensions.paddingVertical,
          paddingHorizontal: dimensions.paddingHorizontal,
          gap: dimensions.gap,
          backgroundColor:
            pressed && isInteractive
              ? colors.backgroundPressed
              : colors.background,
          borderColor: colors.border,
        },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              styles.label,
              { color: colors.text, fontSize: dimensions.fontSize },
              textStyle,
            ]}
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
    borderRadius: 14,
    borderWidth: 1,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
});

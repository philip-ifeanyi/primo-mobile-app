import { Text as RNText, type TextProps } from 'react-native';
import { colors, text, type ColorToken, type TextVariant } from '@/theme';

type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: ColorToken;
};

/**
 * Always use this instead of react-native's Text.
 *
 * Font styling does not cascade in React Native: a fontFamily set on a parent
 * View is ignored by the Text inside it. Without a wrapper, every single Text
 * in the app would have to repeat its family, size, line height and tracking.
 */
export function Text({
  variant = 'body',
  color = 'ink',
  style,
  ...rest
}: AppTextProps) {
  return (
    <RNText
      style={[text[variant], { color: colors[color] }, style]}
      {...rest}
    />
  );
}

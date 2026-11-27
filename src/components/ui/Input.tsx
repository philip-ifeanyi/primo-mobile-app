import { Text } from '@/components/ui/Text';
import { colors, fonts, radius, sizes } from '@/theme';
import { type ReactNode, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import type { ColorToken } from '@/theme';

type InputProps = TextInputProps & {
  label?: string;
  /** Small line under the field, e.g. "Prefilled from Chidi's invite link". */
  helper?: string;
  helperColor?: ColorToken;
  error?: string;
  /** Static text locked inside the field, e.g. "+234". */
  prefix?: string;
  /** Tappable accessory on the right, e.g. the "Show" password toggle. */
  rightSlot?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Input({
  label,
  helper,
  helperColor = 'primary',
  error,
  prefix,
  rightSlot,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? colors.danger
    : isFocused
      ? colors.primary
      : colors.border;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text
          variant="label"
          color="ink"
          style={styles.label}
        >
          {label}
        </Text>
      ) : null}

      <View style={[styles.field, { borderColor }]}>
        {prefix ? (
          <Text
            variant="bodyLarge"
            color="ink"
            style={styles.prefix}
          >
            {prefix}
          </Text>
        ) : null}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textFaint}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />

        {rightSlot}
      </View>

      {error ? (
        <Text
          variant="caption"
          color="danger"
          style={styles.helper}
        >
          {error}
        </Text>
      ) : helper ? (
        <Text
          variant="caption"
          color={helperColor}
          style={styles.helper}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 7 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: sizes.inputHeight,
    borderRadius: radius.input,
    borderWidth: 1,
    backgroundColor: colors.field,
    paddingHorizontal: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    // No lineHeight here on purpose: on Android a lineHeight on TextInput
    // clips descenders and fights the field's fixed height.
    fontFamily: fonts.bodyRegular,
    fontSize: 16,
    color: colors.ink,
    // Android adds its own vertical padding to TextInput; zero it out so the
    // text sits centred in the 54pt field on both platforms.
    paddingVertical: 0,
  },
  prefix: { color: colors.ink },
  helper: { marginTop: 7 },
});

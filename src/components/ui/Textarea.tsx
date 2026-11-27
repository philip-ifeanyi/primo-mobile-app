import { Text } from '@/components/ui/Text';
import { colors, fonts, radius } from '@/theme';
import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

type TextareaProps = TextInputProps & {
  label?: string;
  /** Spec: 92 for the office address. */
  height?: number;
};

/** Multi-line sibling of Input: same fill and border, fixed height, no resize. */
export function Textarea({
  label,
  height = 92,
  style,
  onFocus,
  onBlur,
  ...rest
}: TextareaProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View>
      {label ? (
        <Text
          variant="label"
          color="ink"
          style={styles.label}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          { height, borderColor: isFocused ? colors.primary : colors.border },
        ]}
      >
        <TextInput
          multiline
          // Without this Android centres the first line vertically in the box.
          textAlignVertical="top"
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 7 },
  field: {
    borderRadius: radius.input,
    borderWidth: 1,
    backgroundColor: colors.field,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontFamily: fonts.bodyRegular,
    fontSize: 15,
    color: colors.ink,
    padding: 0,
  },
});

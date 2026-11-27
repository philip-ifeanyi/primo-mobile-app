import { Text } from '@/components/ui/Text';
import { colors, fonts, radius } from '@/theme';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

type CurrencyInputProps = {
  label?: string;
  /** Naira, or null when the field is empty. */
  value: number | null;
  onChange: (next: number | null) => void;
  placeholder?: string;
  /** Rejects anything larger, so a stray keypress cannot insure a billion. */
  max?: number;
};

const withSeparators = (digits: string) =>
  digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Spec: 68pt tall, primary border, ₦ prefix, 26pt amount with thousands separators. */
export function CurrencyInput({
  label,
  value,
  onChange,
  placeholder = '0',
  max = 999_999_999,
}: CurrencyInputProps) {
  // The separators are rebuilt on every keystroke, so the field is driven by
  // the formatted string and the number is what leaves the component.
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (next: string) => {
    const digits = next.replace(/\D/g, '');
    if (digits === '') {
      onChange(null);
      return;
    }

    const parsed = Number(digits);
    if (parsed > max) return;
    onChange(parsed);
  };

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
          { borderColor: isFocused ? colors.primary : colors.borderStrong },
        ]}
      >
        <Text style={styles.symbol}>₦</Text>
        <TextInput
          value={value === null ? '' : withSeparators(String(value))}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          keyboardType="number-pad"
          accessibilityLabel={label}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 7 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 68,
    borderRadius: radius.button,
    borderWidth: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
  },
  symbol: {
    fontFamily: fonts.displayMedium,
    fontSize: 22,
    color: colors.textFaint,
  },
  input: {
    flex: 1,
    minWidth: 0,
    // No lineHeight: it clips descenders on Android TextInput.
    fontFamily: fonts.displaySemi,
    fontSize: 26,
    letterSpacing: -0.52,
    color: colors.ink,
    paddingVertical: 0,
  },
});

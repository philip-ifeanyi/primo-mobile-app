import { Text } from '@/components/ui/Text';
import { colors, radius, sizes } from '@/theme';
import Feather from '@expo/vector-icons/Feather';
import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type SelectRowProps = {
  label?: string;
  /** The chosen value, or null to show `placeholder` greyed out. */
  value: string | null;
  placeholder?: string;
  onPress: () => void;
  /** Leading slot, e.g. the 28pt bank logo tile. */
  left?: ReactNode;
  /**
   * `chevron` for pickers, `change` for the date-of-birth row, `none` for the
   * document date pair, which shows the value alone.
   */
  accessory?: 'chevron' | 'change' | 'none';
  /** Defaults to the 54pt field height; the document dates are 52. */
  height?: number;
  containerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * A field-shaped row that opens something instead of taking typed input:
 * the bank picker and the two date rows.
 */
export function SelectRow({
  label,
  value,
  placeholder = 'Select',
  onPress,
  left,
  accessory = 'chevron',
  height = sizes.inputHeight,
  containerStyle,
  accessibilityLabel,
}: SelectRowProps) {
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

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityValue={{ text: value ?? placeholder }}
        style={({ pressed }) => [
          styles.row,
          { height },
          pressed && styles.pressed,
        ]}
      >
        {left}
        <Text
          variant="bodyLarge"
          color={value ? 'ink' : 'textFaint'}
          style={styles.value}
          numberOfLines={1}
        >
          {value ?? placeholder}
        </Text>

        {accessory === 'change' ? (
          <Text
            variant="label"
            color="primary"
          >
            Change
          </Text>
        ) : null}

        {accessory === 'chevron' ? (
          <Feather
            name="chevron-down"
            size={18}
            color={colors.textFaint}
          />
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 7 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
    paddingHorizontal: 16,
  },
  value: { flex: 1 },
  pressed: { opacity: 0.7 },
});

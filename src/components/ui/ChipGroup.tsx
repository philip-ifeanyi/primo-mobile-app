import { Text } from '@/components/ui/Text';
import { colors, fonts, radius } from '@/theme';
import { Pressable, StyleSheet, View } from 'react-native';

type ChipGroupProps = {
  options: readonly string[];
  value: string | null;
  onChange: (next: string) => void;
  label?: string;
};

/** Single-select pill row, e.g. the vehicle body type. */
export function ChipGroup({ options, value, onChange, label }: ChipGroupProps) {
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
        style={styles.row}
        accessibilityRole="radiogroup"
      >
        {options.map((option) => {
          const isSelected = option === value;

          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                color={isSelected ? 'surface' : 'textMuted'}
                style={styles.chipLabel}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 7 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.field,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.8 },
});

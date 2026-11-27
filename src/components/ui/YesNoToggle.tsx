import { Text } from '@/components/ui/Text';
import { colors, radius } from '@/theme';
import { Pressable, StyleSheet, View } from 'react-native';

type YesNoToggleProps = {
  /** null leaves both sides unselected. */
  value: boolean | null;
  onChange: (next: boolean) => void;
  accessibilityLabel?: string;
};

/**
 * Two-up pill switch on the medical step. Yes fills `primary`; No fills white
 * on the `field` track, so an unanswered row reads as neither.
 */
export function YesNoToggle({
  value,
  onChange,
  accessibilityLabel,
}: YesNoToggleProps) {
  return (
    <View style={styles.track}>
      {([true, false] as const).map((option) => {
        const isSelected = value === option;
        const label = option ? 'Yes' : 'No';

        return (
          <Pressable
            key={label}
            onPress={() => onChange(option)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={
              accessibilityLabel ? `${accessibilityLabel}: ${label}` : label
            }
            style={[
              styles.option,
              isSelected && (option ? styles.optionYes : styles.optionNo),
            ]}
          >
            <Text
              variant="pill"
              color={
                isSelected ? (option ? 'surface' : 'ink') : 'textMuted'
              }
              style={styles.label}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.field,
    borderRadius: radius.pill,
    padding: 3,
  },
  option: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  optionYes: { backgroundColor: colors.primary },
  optionNo: { backgroundColor: colors.surface },
  label: { fontSize: 12 },
});

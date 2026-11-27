import { colors } from '@/theme';
import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, View } from 'react-native';

type CheckboxProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  accessibilityLabel?: string;
};

export function Checkbox({
  checked,
  onChange,
  accessibilityLabel,
}: CheckboxProps) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? (
          <Feather
            name="check"
            size={14}
            color={colors.surface}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});

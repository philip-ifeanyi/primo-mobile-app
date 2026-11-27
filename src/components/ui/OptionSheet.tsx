import { BottomSheet } from '@/components/ui/BottomSheet';
import { Text } from '@/components/ui/Text';
import { colors, radius } from '@/theme';
import Feather from '@expo/vector-icons/Feather';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

export type Option = { key: string; label: string };

type OptionSheetProps = {
  title: string;
  options: Option[];
  selectedKey: string | null;
  onSelect: (option: Option) => void;
  onDismiss: () => void;
  /** Reserves the 28pt artwork slot, e.g. for bank logos. */
  withLogoSlot?: boolean;
};

/** Single-choice list in a sheet: banks, vehicle makes, vehicle models. */
export function OptionSheet({
  title,
  options,
  selectedKey,
  onSelect,
  onDismiss,
  withLogoSlot = false,
}: OptionSheetProps) {
  return (
    <BottomSheet
      onDismiss={onDismiss}
      // Mounted inside a step body's ScrollView, so it has to be portalled.
      portal
    >
      {(close) => (
        <>
          <Text
            variant="sectionH2"
            style={styles.title}
          >
            {title}
          </Text>

          <FlatList
            data={options}
            keyExtractor={(option) => option.key}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = item.key === selectedKey;

              return (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    close();
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                >
                  {/* Logos are not in the handoff yet; the tile holds their slot. */}
                  {withLogoSlot ? <View style={styles.logo} /> : null}
                  <Text
                    variant="bodySm"
                    style={styles.label}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  {isSelected ? (
                    <Feather
                      name="check"
                      size={18}
                      color={colors.primary}
                    />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { textAlign: 'center', marginBottom: 6 },
  // Capped so the sheet never grows past about two thirds of a phone screen.
  list: { maxHeight: 420 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: radius.thumb,
    backgroundColor: colors.border,
  },
  label: { flex: 1 },
  pressed: { opacity: 0.6 },
});

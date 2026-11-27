import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { fromIsoDate, toIsoDate } from '@/state/dates';
import { colors } from '@/theme';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

type DatePickerSheetProps = {
  title: string;
  /** Pre-selected day as ISO yyyy-mm-dd, or null to start from `fallback`. */
  value: string | null;
  /** Where the wheel opens when nothing is picked yet, e.g. 25 years ago. */
  fallback: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  /** Receives ISO yyyy-mm-dd. */
  onConfirm: (iso: string) => void;
  onDismiss: () => void;
};

/**
 * Wraps @expo/ui's picker in the app's own sheet.
 *
 * The picker is mounted with presentation="inline" on purpose. Its Android
 * default is a dialog that opens on mount and brings its own buttons, which
 * would mean two different confirm affordances across platforms; inline puts
 * both platforms inside this sheet behind one "Done".
 */
export function DatePickerSheet({
  title,
  value,
  fallback,
  minimumDate,
  maximumDate,
  onConfirm,
  onDismiss,
}: DatePickerSheetProps) {
  // The picker is uncontrolled from here on: it reports each change, and only
  // "Done" writes the result back to app state.
  const [draft, setDraft] = useState(value ?? toIsoDate(fallback));

  return (
    <BottomSheet
      onDismiss={onDismiss}
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

          <View style={styles.picker}>
            <DateTimePicker
              value={fromIsoDate(draft)}
              mode="date"
              presentation="inline"
              display="spinner"
              accentColor={colors.primary}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onValueChange={(_event, date) => setDraft(toIsoDate(date))}
            />
          </View>

          <Button
            title="Done"
            onPress={() => {
              onConfirm(draft);
              close();
            }}
          />
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { textAlign: 'center', marginBottom: 8 },
  picker: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
});

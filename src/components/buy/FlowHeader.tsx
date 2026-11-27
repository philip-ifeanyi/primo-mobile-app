import { BackButton } from '@/components/ui/BackButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import { colors, fonts, sizes } from '@/theme';
import { Pressable, StyleSheet, View } from 'react-native';

type FlowHeaderProps = {
  title: string;
  /** Second line under the title, e.g. "paystack.com". */
  subtitle?: string;
  onBack: () => void;
  /** Renders a "Cancel" word instead of the chevron. */
  backLabel?: string;
  /** Adds the progress row: [current, total]. */
  progress?: [number, number];
};

/** Header shared by the buy-flow screens: back, centred title, optional bar. */
export function FlowHeader({
  title,
  subtitle,
  onBack,
  backLabel,
  progress,
}: FlowHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        {backLabel ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
          >
            <Text
              variant="bodySm"
              color="textMuted"
              style={styles.cancelText}
            >
              {backLabel}
            </Text>
          </Pressable>
        ) : (
          <BackButton onPress={onBack} />
        )}

        <View style={styles.titleBlock}>
          <Text
            style={styles.title}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              color="textFaint"
              style={styles.subtitle}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Balances the back control so the title stays optically centred. */}
        <View style={backLabel ? styles.cancelSpacer : styles.spacer} />
      </View>

      {progress ? (
        <View style={styles.progressRow}>
          <View style={styles.flex}>
            <ProgressBar progress={progress[0] / progress[1]} />
          </View>
          <Text
            color="textMuted"
            style={styles.count}
          >
            {progress[0]}/{progress[1]}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingTop: 12,
    paddingHorizontal: sizes.screenPaddingFlow,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancel: { paddingVertical: 12 },
  pressed: { opacity: 0.6 },
  cancelText: { fontFamily: fonts.bodyMedium },
  cancelSpacer: { width: 52 },
  spacer: { width: sizes.hitArea },
  titleBlock: { flex: 1, alignItems: 'center' },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    lineHeight: 20,
  },
  subtitle: { fontSize: 11, lineHeight: 15 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  count: {
    fontFamily: fonts.displayMedium,
    fontSize: 12,
    lineHeight: 16,
  },
});

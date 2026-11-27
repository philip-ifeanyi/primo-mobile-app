import { Spinner } from '@/components/ui/Spinner';
import { Text } from '@/components/ui/Text';
import { colors, fonts, radius } from '@/theme';
import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

type StatusRowProps = {
  tone: 'pending' | 'done' | 'error';
  title: string;
  /** Second line, e.g. "Name matches your profile". */
  detail?: string;
};

/**
 * Result of a verification call: the spinner row while it is in flight, the
 * green row once it comes back. Shared by the bank resolve and the BVN check.
 */
export function StatusRow({ tone, title, detail }: StatusRowProps) {
  const isDone = tone === 'done';
  const isError = tone === 'error';

  return (
    <View
      // Live region so a screen reader announces the result without a re-focus.
      accessibilityLiveRegion="polite"
      style={[
        styles.row,
        isDone && styles.rowDone,
        isError && styles.rowError,
      ]}
    >
      {tone === 'pending' ? <Spinner /> : null}

      {isDone ? (
        <View style={styles.tick}>
          <Feather
            name="check"
            size={12}
            color={colors.successInk}
          />
        </View>
      ) : null}

      {isError ? (
        <Feather
          name="alert-circle"
          size={18}
          color={colors.danger}
        />
      ) : null}

      <View style={styles.copy}>
        {detail ? (
          <>
            <Text style={styles.title}>{title}</Text>
            <Text
              variant="caption"
              color="textMuted"
              style={styles.detail}
            >
              {detail}
            </Text>
          </>
        ) : (
          <Text
            variant="bodySm"
            color={isError ? 'danger' : 'textMuted'}
          >
            {title}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.field,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowDone: {
    backgroundColor: colors.successTint,
    borderColor: colors.success,
  },
  rowError: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
  },
  tick: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    lineHeight: 19,
  },
  detail: { fontSize: 11, lineHeight: 15 },
});

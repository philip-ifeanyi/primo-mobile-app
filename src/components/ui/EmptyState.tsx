import { colors, fonts, radius } from '@/theme';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from './Button';
import { Text } from './Text';

type EmptyStateProps = {
  title: string;
  body: string;
  /** Rendered above the title, e.g. an illustration placeholder. */
  art?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

/** Dashed card used wherever a list has nothing in it yet. */
export function EmptyState({
  title,
  body,
  art,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.card}>
      {art}
      <Text style={styles.title}>{title}</Text>
      <Text
        color="textMuted"
        style={styles.body}
      >
        {body}
      </Text>
      {actionLabel ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          fullWidth={false}
          style={styles.action}
          textStyle={styles.actionText}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 20,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },
  action: {
    height: 46,
    borderRadius: radius.input,
    paddingHorizontal: 22,
    marginTop: 16,
  },
  actionText: { fontSize: 14 },
});

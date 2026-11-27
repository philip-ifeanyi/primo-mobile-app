import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import { KYC_STEPS } from '@/state/app';
import { colors, fonts, sizes } from '@/theme';
import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type StepChromeProps = {
  /** 1-8. Drives the progress bar and the "n/8" label. */
  step: number;
  onBack: () => void;
  /** Omit to hide the Save link — there is nothing to save once submitted. */
  onSave?: () => void;
  ctaLabel: string;
  ctaDisabled?: boolean;
  onCta: () => void;
  /** Extra control under the CTA. */
  footerExtra?: ReactNode;
  children: ReactNode;
};

/**
 * The frame every KYC step sits in: header with back / title / Save, the
 * progress bar, a scrolling body and the sticky footer CTA.
 */
export function StepChrome({
  step,
  onBack,
  onSave,
  ctaLabel,
  ctaDisabled = false,
  onCta,
  footerExtra,
  children,
}: StepChromeProps) {
  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        // 'padding' on both platforms: Android 15+ (API 35) forces edge-to-edge,
        // where windowSoftInputMode="adjustResize" no longer shifts content for
        // the keyboard, so the app has to consume the IME inset itself.
        behavior="padding"
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <BackButton onPress={onBack} />

            <Text
              style={styles.headerTitle}
              numberOfLines={1}
            >
              {KYC_STEPS[step - 1]}
            </Text>

            {onSave ? (
              <Pressable
                onPress={onSave}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Save and exit"
                style={({ pressed }) => [styles.save, pressed && styles.pressed]}
              >
                <Text
                  variant="label"
                  color="primary"
                >
                  Save
                </Text>
              </Pressable>
            ) : (
              // Keeps the title optically centred when there is no Save link.
              <View style={styles.saveSpacer} />
            )}
          </View>

          <View style={styles.progressRow}>
            <View style={styles.flex}>
              <ProgressBar progress={step / KYC_STEPS.length} />
            </View>
            <Text
              color="textMuted"
              style={styles.count}
            >
              {step}/{KYC_STEPS.length}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={ctaLabel}
            disabled={ctaDisabled}
            onPress={onCta}
          />
          {footerExtra}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  header: {
    paddingTop: 12,
    paddingHorizontal: sizes.screenPaddingFlow,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    lineHeight: 20,
  },
  save: {
    minWidth: sizes.hitArea,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  saveSpacer: { width: sizes.hitArea },
  pressed: { opacity: 0.6 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  count: {
    fontFamily: fonts.displayMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  body: {
    paddingTop: 22,
    paddingHorizontal: sizes.screenPaddingFlow,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: sizes.screenPaddingFlow,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});

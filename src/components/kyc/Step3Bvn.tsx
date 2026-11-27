import { StepHeading } from '@/components/kyc/StepHeading';
import { Button } from '@/components/ui/Button';
import { StatusRow } from '@/components/ui/StatusRow';
import { Text } from '@/components/ui/Text';
import { setKycBvn, useAppState } from '@/state/app';
import { verifyBvn } from '@/state/kyc-service';
import { colors, fonts, radius } from '@/theme';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

export function Step3Bvn() {
  const bvn = useAppState((state) => state.kyc.bvn);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View>
      <StepHeading
        title="Bank Verification Number"
        subtitle="Dial *565*0# on your registered line to see your BVN."
        gap={16}
      />

      {/*
        Not the shared Input: this field is 60pt rather than 54 and carries no
        label, so the digits sit on their own as the one thing on the screen.
      */}
      <TextInput
        value={bvn.number}
        onChangeText={(next) =>
          setKycBvn({
            number: next.replace(/\D/g, '').slice(0, 11),
            status: 'idle',
            matchedName: null,
            error: null,
          })
        }
        placeholder="22187640913"
        placeholderTextColor={colors.textFaint}
        keyboardType="number-pad"
        maxLength={11}
        accessibilityLabel="Bank Verification Number"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.field,
          { borderColor: isFocused ? colors.primary : colors.border },
        ]}
      />

      <View style={styles.info}>
        <View style={styles.infoBadge}>
          <Text
            color="surface"
            style={styles.infoBadgeText}
          >
            ?
          </Text>
        </View>
        <Text
          variant="bodySm"
          color="textMuted"
          style={styles.infoCopy}
        >
          Why we need your BVN
        </Text>
        <Pressable
          hitSlop={12}
          accessibilityRole="button"
          // TODO: open the BVN explainer once the help content has a home.
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Text
            variant="label"
            color="primary"
          >
            Read
          </Text>
        </Pressable>
      </View>

      {bvn.status === 'idle' && bvn.number.length === 11 ? (
        <Button
          title="Verify BVN"
          variant="outline"
          onPress={() => void verifyBvn()}
          style={styles.verify}
          textStyle={styles.verifyText}
        />
      ) : null}

      {bvn.status === 'pending' ? (
        <StatusRow
          tone="pending"
          title="Verifying with NIBSS… this may take a moment"
        />
      ) : null}

      {bvn.status === 'done' && bvn.matchedName ? (
        <StatusRow
          tone="done"
          title="BVN verified"
          detail={`Matched to ${bvn.matchedName}`}
        />
      ) : null}

      {bvn.status === 'error' ? (
        <StatusRow
          tone="error"
          title={bvn.error ?? "We couldn't verify that BVN. Check the digits."}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 60,
    borderRadius: radius.input,
    borderWidth: 1,
    backgroundColor: colors.field,
    paddingHorizontal: 16,
    // No lineHeight: it clips descenders on Android TextInput.
    fontFamily: fonts.displayMedium,
    fontSize: 20,
    letterSpacing: 2.8,
    color: colors.ink,
    paddingVertical: 0,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    borderRadius: radius.input,
    backgroundColor: colors.field,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBadgeText: {
    fontFamily: fonts.displaySemi,
    fontSize: 14,
    lineHeight: 18,
  },
  infoCopy: { flex: 1, fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.6 },
  verify: {
    height: 48,
    borderRadius: radius.input,
    borderColor: colors.primary,
    marginTop: 12,
  },
  verifyText: { fontFamily: fonts.bodySemi, fontSize: 14 },
});

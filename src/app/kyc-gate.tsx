import { kycHref } from '@/components/kyc/navigation';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { KYC_STEPS, useAppState } from '@/state/app';
import { colors, fonts, radius } from '@/theme';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];

export default function KycGate() {
  const router = useRouter();
  const currentStep = useAppState((state) => state.kyc.currentStep);

  const stepsLeft = KYC_STEPS.length - currentStep;
  const close = () => router.back();

  return (
    <BottomSheet onDismiss={close}>
      <View style={styles.tile}>
        <Text style={styles.tileText}>
          {currentStep}/{KYC_STEPS.length}
        </Text>
      </View>

      <Text
        variant="sectionH2"
        style={styles.title}
      >
        Finish KYC to buy this cover
      </Text>

      <Text
        variant="bodySm"
        color="textMuted"
        style={styles.body}
      >
        Regulation requires us to verify your identity before a policy can be
        issued. {COUNT_WORDS[stepsLeft]} {stepsLeft === 1 ? 'step' : 'steps'}{' '}
        left, about four minutes.
      </Text>

      <View style={styles.actions}>
        <Button
          title="Continue KYC"
          // Replaces the sheet rather than stacking the wizard on top of it,
          // so dismissing the wizard does not reveal this gate again.
          onPress={() => router.replace(kycHref(currentStep))}
        />
        <Button
          title="Not now"
          variant="text"
          textStyle={styles.notNow}
          onPress={close}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 56,
    height: 56,
    borderRadius: radius.card,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  tileText: { fontFamily: fonts.displaySemi, fontSize: 20, lineHeight: 24 },
  title: {
    fontSize: 21,
    lineHeight: 27,
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    marginTop: 22,
    gap: 4,
  },
  notNow: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textMuted,
  },
});

import { Step1Details } from '@/components/kyc/Step1Details';
import { Step2Bank } from '@/components/kyc/Step2Bank';
import { Step3Bvn } from '@/components/kyc/Step3Bvn';
import { Step4Employer } from '@/components/kyc/Step4Employer';
import { Step5Medical } from '@/components/kyc/Step5Medical';
import { Step6Documents } from '@/components/kyc/Step6Documents';
import { Step7Review } from '@/components/kyc/Step7Review';
import { Step8Approved } from '@/components/kyc/Step8Approved';
import { StepChrome } from '@/components/kyc/StepChrome';
import { kycHref } from '@/components/kyc/navigation';
import { canContinue } from '@/components/kyc/validation';
import { StatusRow } from '@/components/ui/StatusRow';
import { Text } from '@/components/ui/Text';
import {
  APPROVED_KYC_STEP,
  FIRST_KYC_STEP,
  KYC_STEPS,
  REVIEW_KYC_STEP,
  advanceKycProgress,
  useAppState,
} from '@/state/app';
import { simulateApproval, submitKycForReview } from '@/state/kyc-service';
import { colors, fonts } from '@/theme';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

/** Steps 1-5 continue, 6 submits, and the last two leave the wizard. */
const CTA_LABELS: Record<number, string> = {
  1: 'Continue',
  2: 'Continue',
  3: 'Continue',
  4: 'Continue',
  5: 'Continue',
  6: 'Submit for review',
  7: 'Back to home',
  8: 'Buy insurance',
};

const STEP_BODIES: Record<number, () => React.JSX.Element> = {
  1: Step1Details,
  2: Step2Bank,
  3: Step3Bvn,
  4: Step4Employer,
  5: Step5Medical,
  6: Step6Documents,
  7: Step7Review,
  8: Step8Approved,
};

export default function KycStep() {
  const router = useRouter();
  const { step: stepParam } = useLocalSearchParams<{ step: string }>();
  const kyc = useAppState((state) => state.kyc);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const step = Number(stepParam);
  const isValidStep =
    Number.isInteger(step) && step >= FIRST_KYC_STEP && step <= KYC_STEPS.length;

  // A hand-typed or stale deep link lands on wherever the user actually got to.
  if (!isValidStep) return <Redirect href={kycHref(kyc.currentStep)} />;

  const Body = STEP_BODIES[step];
  const exit = () => router.replace('/home');

  // Replace rather than push: the header chevron walks the steps itself, so a
  // stack eight screens deep would only make the hardware back button
  // disagree with it.
  const goToStep = (next: number) => router.replace(kycHref(next));

  const back = () => {
    if (step > FIRST_KYC_STEP && step < REVIEW_KYC_STEP) goToStep(step - 1);
    // Step 1 has nothing behind it, and a submitted application cannot be
    // edited, so both leave the wizard.
    else exit();
  };

  const submit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const result = await submitKycForReview();
    setIsSubmitting(false);

    // Staying put on failure: "We're reviewing your details" would be a lie
    // about an application the server never accepted.
    if (result.ok) goToStep(REVIEW_KYC_STEP);
    else setSubmitError(result.message);
  };

  const next = () => {
    if (step === APPROVED_KYC_STEP) {
      router.replace('/insurance');
      return;
    }
    if (step === REVIEW_KYC_STEP) {
      exit();
      return;
    }
    if (step === 6) {
      void submit();
      return;
    }

    advanceKycProgress(step + 1);
    goToStep(step + 1);
  };

  return (
    <StepChrome
      step={step}
      onBack={back}
      // Nothing left to save once the application is in: these two steps are
      // reports on its status, not forms.
      onSave={step < REVIEW_KYC_STEP ? exit : undefined}
      ctaLabel={CTA_LABELS[step]}
      ctaDisabled={!canContinue(step, kyc) || isSubmitting}
      onCta={next}
      footerExtra={
        submitError ? (
          <StatusRow
            tone="error"
            title={submitError}
          />
        ) : __DEV__ && step === REVIEW_KYC_STEP ? (
          <Pressable
            onPress={() => {
              simulateApproval();
              goToStep(APPROVED_KYC_STEP);
            }}
            accessibilityRole="button"
            style={styles.simulate}
          >
            <Text style={styles.simulateText}>Dev: simulate approval</Text>
          </Pressable>
        ) : null
      }
    >
      <Body />
    </StepChrome>
  );
}

const styles = StyleSheet.create({
  simulate: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulateText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textFaint,
  },
});

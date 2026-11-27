import { StepHeading } from '@/components/kyc/StepHeading';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SelectRow } from '@/components/ui/SelectRow';
import { OptionSheet } from '@/components/ui/OptionSheet';
import { StatusRow } from '@/components/ui/StatusRow';
import { setKycBank, useAppState } from '@/state/app';
import { BANKS, resolveAccountName, shortBankName } from '@/state/kyc-service';
import { colors, fonts, radius } from '@/theme';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export function Step2Bank() {
  const bank = useAppState((state) => state.kyc.bank);
  const [pickingBank, setPickingBank] = useState(false);

  const isComplete = bank.nuban.length === 10 && bank.bankCode !== null;

  // The handoff asks for an automatic resolve the moment a full NUBAN is in,
  // with the button left as the manual retry.
  useEffect(() => {
    if (isComplete && bank.status === 'idle') void resolveAccountName();
  }, [isComplete, bank.status]);

  return (
    <View>
      <StepHeading
        title="Bank account"
        subtitle="Premium debits and claim payouts use this account."
      />

      <SelectRow
        label="Bank"
        value={bank.bankName}
        placeholder="Select your bank"
        onPress={() => setPickingBank(true)}
        left={<View style={styles.logo} />}
      />

      <View style={styles.nuban}>
        <Input
          label="Account number (NUBAN)"
          value={bank.nuban}
          onChangeText={(next) =>
            setKycBank({
              // Digits only, so a pasted "0123 4567 89" still resolves.
              nuban: next.replace(/\D/g, '').slice(0, 10),
              // Any edit invalidates a name the bank already returned.
              status: 'idle',
              accountName: null,
              error: null,
            })
          }
          placeholder="0123456789"
          keyboardType="number-pad"
          maxLength={10}
          style={styles.nubanInput}
        />
      </View>

      {bank.status === 'idle' && isComplete ? (
        <Button
          title="Resolve account name"
          variant="outline"
          onPress={() => void resolveAccountName()}
          style={styles.resolve}
          textStyle={styles.resolveText}
        />
      ) : null}

      {bank.status === 'pending' ? (
        <StatusRow
          tone="pending"
          title={`Checking with ${shortBankName(bank.bankName)}…`}
        />
      ) : null}

      {bank.status === 'done' && bank.accountName ? (
        <StatusRow
          tone="done"
          title={bank.accountName}
          detail="Name matches your profile"
        />
      ) : null}

      {bank.status === 'error' ? (
        <StatusRow
          tone="error"
          title={bank.error ?? "We couldn't check that account. Try again."}
        />
      ) : null}

      {pickingBank ? (
        <OptionSheet
          title="Choose your bank"
          options={BANKS.map((item) => ({ key: item.code, label: item.name }))}
          selectedKey={bank.bankCode}
          withLogoSlot
          onSelect={(picked) =>
            setKycBank({
              bankCode: picked.key,
              bankName: picked.label,
              // A different bank means the old name no longer applies.
              status: 'idle',
              accountName: null,
              error: null,
            })
          }
          onDismiss={() => setPickingBank(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 28,
    height: 28,
    borderRadius: radius.thumb,
    backgroundColor: colors.border,
  },
  nuban: { marginTop: 14 },
  nubanInput: {
    fontFamily: fonts.displayMedium,
    letterSpacing: 1.28,
  },
  resolve: {
    height: 48,
    borderRadius: radius.input,
    borderColor: colors.primary,
    marginTop: 12,
  },
  resolveText: { fontFamily: fonts.bodySemi, fontSize: 14 },
});

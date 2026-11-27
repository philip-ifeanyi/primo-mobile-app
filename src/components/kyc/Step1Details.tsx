import { StepHeading } from '@/components/kyc/StepHeading';
import { DatePickerSheet } from '@/components/ui/DatePickerSheet';
import { Input } from '@/components/ui/Input';
import { SelectRow } from '@/components/ui/SelectRow';
import { setKycDetails, useAppState } from '@/state/app';
import { formatLongDate, yearsAgo } from '@/state/dates';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

/** Nobody under 18 can hold a policy, and 100 is a sane floor for the wheel. */
const OLDEST = yearsAgo(100);
const YOUNGEST = yearsAgo(18);
const OPENS_AT = yearsAgo(30);

export function Step1Details() {
  const details = useAppState((state) => state.kyc.details);
  const [pickingDate, setPickingDate] = useState(false);

  return (
    <View>
      <StepHeading
        title="Your details"
        subtitle="Use the name exactly as it appears on your ID."
      />

      <View style={styles.fields}>
        <Input
          label="First name"
          value={details.firstName}
          onChangeText={(firstName) => setKycDetails({ firstName })}
          placeholder="Adaeze"
          autoComplete="given-name"
          textContentType="givenName"
        />

        <Input
          label="Surname"
          value={details.surname}
          onChangeText={(surname) => setKycDetails({ surname })}
          placeholder="Okonkwo"
          autoComplete="family-name"
          textContentType="familyName"
        />

        <SelectRow
          label="Date of birth"
          value={formatLongDate(details.dateOfBirth)}
          placeholder="Select your date of birth"
          accessory="change"
          onPress={() => setPickingDate(true)}
        />

        <Input
          label="Username"
          value={details.username}
          onChangeText={(username) => setKycDetails({ username })}
          placeholder="adaeze"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {pickingDate ? (
        <DatePickerSheet
          title="Date of birth"
          value={details.dateOfBirth}
          fallback={OPENS_AT}
          minimumDate={OLDEST}
          maximumDate={YOUNGEST}
          onConfirm={(dateOfBirth) => setKycDetails({ dateOfBirth })}
          onDismiss={() => setPickingDate(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 14 },
});

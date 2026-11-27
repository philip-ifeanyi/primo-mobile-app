import { StepHeading } from '@/components/kyc/StepHeading';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { setKycEmployer, useAppState } from '@/state/app';
import { StyleSheet, View } from 'react-native';

export function Step4Employer() {
  const employer = useAppState((state) => state.kyc.employer);

  return (
    <View>
      <StepHeading
        title="Employer"
        subtitle="Underwriters price some cover on occupation."
      />

      <View style={styles.fields}>
        <Input
          label="Employer name"
          value={employer.name}
          onChangeText={(name) => setKycEmployer({ name })}
          placeholder="Andela Nigeria Ltd"
        />

        <Input
          label="Employer phone"
          value={employer.phone}
          onChangeText={(phone) => setKycEmployer({ phone })}
          placeholder="+234 1 448 2100"
          keyboardType="phone-pad"
        />

        <Input
          label="Tax identification number"
          value={employer.tin}
          onChangeText={(tin) => setKycEmployer({ tin })}
          placeholder="1049 2277-0001"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <Textarea
          label="Office address"
          value={employer.address}
          onChangeText={(address) => setKycEmployer({ address })}
          placeholder="23 Ligali Ayorinde Street, Victoria Island, Lagos"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 14 },
});

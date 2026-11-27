import { SuccessTile } from '@/components/ui/SuccessTile';
import { Text } from '@/components/ui/Text';
import { StyleSheet, View } from 'react-native';

export function Step8Approved() {
  return (
    <View style={styles.body}>
      <SuccessTile />

      <Text
        variant="authH1"
        style={styles.title}
      >
        You&apos;re verified
      </Text>
      <Text
        color="textMuted"
        style={styles.copy}
      >
        KYC approved. You can buy any cover on Primo now.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 44, alignItems: 'center' },
  title: { textAlign: 'center', marginTop: 24, marginBottom: 10 },
  copy: {
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 290,
  },
});

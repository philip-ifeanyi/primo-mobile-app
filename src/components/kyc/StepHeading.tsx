import { Text } from '@/components/ui/Text';
import { StyleSheet, View } from 'react-native';

type StepHeadingProps = {
  title: string;
  subtitle: string;
  /** Steps 3 and 6 sit their controls closer to the subtitle than the forms do. */
  gap?: number;
};

export function StepHeading({ title, subtitle, gap = 22 }: StepHeadingProps) {
  return (
    <View style={{ marginBottom: gap }}>
      <Text
        variant="stepH1"
        style={styles.title}
      >
        {title}
      </Text>
      <Text
        variant="bodySm"
        color="textMuted"
      >
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 6 },
});

import { Spinner } from '@/components/ui/Spinner';
import { Text } from '@/components/ui/Text';
import { colors, fonts } from '@/theme';
import { StyleSheet, View } from 'react-native';

type LoadingProps = {
  title: string;
  body: string;
};

/** Centred spinner screen: pricing a quote, and setting up the mandate. */
export function Loading({ title, body }: LoadingProps) {
  return (
    <View
      style={styles.body}
      accessibilityLiveRegion="polite"
    >
      <Spinner
        size={40}
        thickness={3}
      />
      <View style={styles.copy}>
        <Text
          style={styles.title}
        >
          {title}
        </Text>
        <Text
          variant="bodySm"
          color="textMuted"
          style={styles.text}
        >
          {body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 40,
    backgroundColor: colors.surface,
  },
  copy: { gap: 6 },
  title: {
    textAlign: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 17,
    lineHeight: 23,
  },
  text: { textAlign: 'center', fontSize: 13, lineHeight: 20 },
});

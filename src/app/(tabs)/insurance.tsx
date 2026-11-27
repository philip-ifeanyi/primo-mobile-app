import { Placeholder } from '@/components/ui/Placeholder';
import { TabScreen } from '@/components/ui/TabScreen';
import { Text } from '@/components/ui/Text';
import { useAppState } from '@/state/app';
import { colors, fonts, radius } from '@/theme';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

const CATEGORIES = [
  { id: 'motor', name: 'Motor', descriptor: 'Third-party or comprehensive' },
  { id: 'health', name: 'Health & Life', descriptor: 'HMO plans and term life' },
  { id: 'travel', name: 'Travel', descriptor: 'Schengen and worldwide' },
  { id: 'home', name: 'Home', descriptor: 'Building and contents' },
  { id: 'savings', name: 'Savings', descriptor: 'Endowment with life cover' },
  { id: 'education', name: 'Education', descriptor: 'School fees protection' },
];

const COLUMNS = 2;

// Pair the tiles up so each row is a plain flex row of two equal columns.
const ROWS = Array.from(
  { length: Math.ceil(CATEGORIES.length / COLUMNS) },
  (_, row) => CATEGORIES.slice(row * COLUMNS, row * COLUMNS + COLUMNS)
);

export default function Insurance() {
  const router = useRouter();
  const kycStatus = useAppState((state) => state.kyc.status);

  const openCategory = (categoryId: string) => {
    // Gate rule: no purchase flow may start until KYC is approved.
    if (kycStatus !== 'approved') {
      router.push('/kyc-gate');
      return;
    }
    router.push({ pathname: '/buy/[category]', params: { category: categoryId } });
  };

  return (
    <TabScreen>
      <Text variant="tabH1">Insurance</Text>
      <Text
        variant="bodySm"
        color="textMuted"
        style={styles.sub}
      >
        Pick a category to get a priced quote.
      </Text>

      <View style={styles.grid}>
        {ROWS.map((row) => (
          <View
            key={row[0].id}
            style={styles.row}
          >
            {row.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => openCategory(category.id)}
                style={({ pressed }) => [
                  styles.tile,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${category.name}. ${category.descriptor}`}
              >
                <Placeholder
                  height={56}
                  radius={radius.tile}
                />
                <Text style={styles.name}>{category.name}</Text>
                <Text
                  color="textMuted"
                  style={styles.descriptor}
                >
                  {category.descriptor}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  sub: { marginTop: 6, marginBottom: 20 },
  grid: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1,
    padding: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  name: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 12,
  },
  descriptor: { fontSize: 11, lineHeight: 15, marginTop: 3 },
});

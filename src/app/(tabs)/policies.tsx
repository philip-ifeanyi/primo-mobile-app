import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { TabScreen } from '@/components/ui/TabScreen';
import { Text } from '@/components/ui/Text';
import { formatNaira, useAppState } from '@/state/app';
import { colors, fonts, radius } from '@/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const SEGMENTS = ['Policies', 'Mandates'] as const;
type Segment = (typeof SEGMENTS)[number];

export default function Policies() {
  const router = useRouter();
  const policies = useAppState((state) => state.policies);
  const [segment, setSegment] = useState<Segment>('Policies');

  return (
    <TabScreen>
      <Text variant="tabH1">Policies</Text>

      <View
        style={styles.segmented}
        accessibilityRole="tablist"
      >
        {SEGMENTS.map((item) => {
          const selected = item === segment;
          return (
            <Pressable
              key={item}
              onPress={() => setSegment(item)}
              style={[styles.segment, selected && styles.segmentSelected]}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text
                color={selected ? 'ink' : 'textMuted'}
                style={[
                  styles.segmentLabel,
                  selected && styles.segmentLabelSelected,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {segment === 'Mandates' ? (
        <EmptyState
          title="No mandates yet"
          body="Direct debit mandates you set up at checkout will show up here."
        />
      ) : policies.length === 0 ? (
        <EmptyState
          title="No policies yet"
          body="Policies you buy will show up here with documents and payment history."
          actionLabel="Buy insurance"
          onAction={() => router.navigate('/insurance')}
        />
      ) : (
        <View style={styles.list}>
          {policies.map((policy) => (
            <View
              key={policy.id}
              style={styles.card}
            >
              <View style={styles.cardTop}>
                <Text style={styles.policyName}>{policy.name}</Text>
                <Pill label="Active" />
              </View>
              <Text
                variant="caption"
                color="textMuted"
                style={styles.policyNumber}
              >
                {policy.policyNumber}
              </Text>
              <View style={styles.columns}>
                <View style={styles.flex}>
                  <Text
                    color="textFaint"
                    style={styles.columnLabel}
                  >
                    Cover
                  </Text>
                  <Text style={styles.columnValue}>
                    {formatNaira(policy.coverAmount)}
                  </Text>
                </View>
                <View style={styles.flex}>
                  <Text
                    color="textFaint"
                    style={styles.columnLabel}
                  >
                    Expires
                  </Text>
                  <Text style={styles.columnValue}>{policy.expires}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.input,
    backgroundColor: colors.field,
    marginTop: 16,
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 11,
  },
  segmentSelected: { backgroundColor: colors.surface },
  segmentLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
  segmentLabelSelected: { fontFamily: fonts.bodySemi },
  list: { gap: 12 },
  card: {
    padding: 18,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  policyName: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 },
  policyNumber: { marginBottom: 14 },
  columns: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  columnLabel: { fontSize: 11, lineHeight: 15 },
  columnValue: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
});

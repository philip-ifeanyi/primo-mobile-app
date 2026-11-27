import { StepHeading } from '@/components/kyc/StepHeading';
import { Text } from '@/components/ui/Text';
import { YesNoToggle } from '@/components/ui/YesNoToggle';
import { setMedicalAnswer, useAppState } from '@/state/app';
import { colors, fonts, radius } from '@/theme';
import { StyleSheet, TextInput, View } from 'react-native';

export function Step5Medical() {
  const medical = useAppState((state) => state.kyc.medical);

  return (
    <View>
      <StepHeading
        title="Medical history"
        subtitle="Have you contracted any of the conditions below?"
        gap={20}
      />

      <View style={styles.rows}>
        {medical.map((answer, index) => {
          const isExpanded = answer.hasCondition === true;

          return (
            <View
              key={answer.condition}
              style={[styles.row, isExpanded && styles.rowExpanded]}
            >
              <View style={styles.rowTop}>
                <Text
                  variant="bodyLarge"
                  style={styles.condition}
                >
                  {answer.condition}
                </Text>
                <YesNoToggle
                  value={answer.hasCondition}
                  accessibilityLabel={answer.condition}
                  onChange={(hasCondition) =>
                    setMedicalAnswer(index, {
                      hasCondition,
                      // Switching back to No drops any details already typed.
                      details: hasCondition ? answer.details : '',
                    })
                  }
                />
              </View>

              {isExpanded ? (
                <TextInput
                  value={answer.details}
                  onChangeText={(details) => setMedicalAnswer(index, { details })}
                  placeholder="When were you diagnosed, and how is it managed?"
                  placeholderTextColor={colors.textFaint}
                  accessibilityLabel={`${answer.condition} details`}
                  style={styles.details}
                />
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rows: { gap: 10 },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  // A declared condition stays outlined in primary so it reads as answered.
  rowExpanded: { borderColor: colors.primary },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  condition: { flex: 1, fontSize: 15 },
  details: {
    height: 48,
    marginTop: 12,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.ink,
  },
});

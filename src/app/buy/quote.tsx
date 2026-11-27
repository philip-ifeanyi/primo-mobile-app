import { FlowFooter } from '@/components/buy/FlowFooter';
import { FlowHeader } from '@/components/buy/FlowHeader';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Input } from '@/components/ui/Input';
import { OptionSheet } from '@/components/ui/OptionSheet';
import { SelectRow } from '@/components/ui/SelectRow';
import { Text } from '@/components/ui/Text';
import { setQuote, setQuoteVehicle, useAppState } from '@/state/app';
import {
  BODY_TYPES,
  loadVehicleMakes,
  loadVehicleModels,
  modelsFor,
  productById,
  useCatalogue,
} from '@/state/buy-service';
import { colors, radius, sizes } from '@/theme';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TOTAL_STEPS = 2;
/** Maps onto VehicleQuote's `isCommercial` boolean. */
const USE_TYPES = ['Private', 'Commercial'] as const;

export default function Quote() {
  const router = useRouter();
  const quote = useAppState((state) => state.quote);
  const product = productById(quote.productId);

  // Two transient steps in one route: unlike KYC there is nothing to resume,
  // so the step is local and the header chevron walks it back.
  const [step, setStep] = useState(1);
  const [picking, setPicking] = useState<'make' | 'model' | null>(null);

  // Subscribing rather than reading once: the makes arrive from the network,
  // and the models arrive a second request later.
  const makes = useCatalogue((c) => c.makes);
  const makeId = useAppState((state) => state.quote.vehicle.makeId);
  const models = useCatalogue(() => modelsFor(makeId));

  useEffect(() => {
    void loadVehicleMakes();
  }, []);

  useEffect(() => {
    if (makeId) void loadVehicleModels(makeId);
  }, [makeId]);

  // Reached without choosing a product — send the user back to the catalogue.
  if (!product) return <Redirect href="/buy/motor" />;

  const { vehicle } = quote;

  // Registration, chassis and engine numbers are all required by
  // Insurance/VehicleQuote, so the step cannot be completed without them.
  const canContinue =
    step === 1
      ? vehicle.makeId !== null &&
        vehicle.modelId !== null &&
        vehicle.year.length === 4 &&
        vehicle.colour.trim().length > 0 &&
        vehicle.registrationNo.trim().length > 0 &&
        vehicle.chassisNo.trim().length > 0 &&
        vehicle.engineNo.trim().length > 0
      : quote.value !== null && quote.value > 0 && quote.bodyType !== null;

  const back = () => {
    if (step === 2) setStep(1);
    else router.back();
  };

  const next = () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    router.push('/buy/pricing');
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        // 'padding' on both platforms: Android 15+ (API 35) forces edge-to-edge,
        // where windowSoftInputMode="adjustResize" no longer shifts content for
        // the keyboard, so the app has to consume the IME inset itself.
        behavior="padding"
      >
        <FlowHeader
          title={product.name}
          onBack={back}
          progress={[step, TOTAL_STEPS]}
        />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 ? (
            <View>
              <Text
                variant="stepH1"
                style={styles.heading}
              >
                Your vehicle
              </Text>
              <Text
                variant="bodySm"
                color="textMuted"
                style={styles.sub}
              >
                We use this to price your premium.
              </Text>

              <View style={styles.fields}>
                <SelectRow
                  label="Make"
                  value={vehicle.make}
                  placeholder="Choose a make"
                  onPress={() => setPicking('make')}
                />

                <View>
                  <SelectRow
                    label="Model"
                    value={vehicle.model}
                    placeholder={
                      vehicle.makeId ? 'Choose a model' : 'Pick a make first'
                    }
                    onPress={() => {
                      if (vehicle.makeId) setPicking('model');
                    }}
                  />
                  <Text
                    variant="caption"
                    color="textFaint"
                    style={styles.helper}
                  >
                    Models load after you pick a make
                  </Text>
                </View>

                <View style={styles.pair}>
                  <Input
                    label="Year"
                    containerStyle={styles.flex}
                    value={vehicle.year}
                    onChangeText={(year) =>
                      setQuoteVehicle({ year: year.replace(/\D/g, '').slice(0, 4) })
                    }
                    placeholder="2019"
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                  <Input
                    label="Colour"
                    containerStyle={styles.flex}
                    value={vehicle.colour}
                    onChangeText={(colour) => setQuoteVehicle({ colour })}
                    placeholder="Silver"
                  />
                </View>

                <Input
                  label="Plate number"
                  value={vehicle.registrationNo}
                  onChangeText={(registrationNo) =>
                    setQuoteVehicle({
                      registrationNo: registrationNo.toUpperCase(),
                    })
                  }
                  placeholder="ABC-123-XY"
                  autoCapitalize="characters"
                />

                <Input
                  label="Chassis number"
                  value={vehicle.chassisNo}
                  onChangeText={(chassisNo) =>
                    setQuoteVehicle({ chassisNo: chassisNo.toUpperCase() })
                  }
                  placeholder="On your vehicle licence"
                  autoCapitalize="characters"
                />

                <Input
                  label="Engine number"
                  value={vehicle.engineNo}
                  onChangeText={(engineNo) =>
                    setQuoteVehicle({ engineNo: engineNo.toUpperCase() })
                  }
                  placeholder="On your vehicle licence"
                  autoCapitalize="characters"
                />
              </View>
            </View>
          ) : (
            <View>
              <Text
                variant="stepH1"
                style={styles.heading}
              >
                Value &amp; use
              </Text>
              <Text
                variant="bodySm"
                color="textMuted"
                style={styles.sub}
              >
                Insure for what it would cost to replace today.
              </Text>

              <CurrencyInput
                label="Vehicle value"
                value={quote.value}
                onChange={(value) => setQuote({ value })}
                placeholder="4,200,000"
              />

              <View style={styles.bodyTypes}>
                <ChipGroup
                  label="Body type"
                  options={BODY_TYPES}
                  value={quote.bodyType}
                  onChange={(bodyType) => setQuote({ bodyType })}
                />
              </View>

              <View style={styles.bodyTypes}>
                <ChipGroup
                  label="How is it used?"
                  options={USE_TYPES}
                  value={vehicle.isCommercial ? 'Commercial' : 'Private'}
                  onChange={(use) =>
                    setQuoteVehicle({ isCommercial: use === 'Commercial' })
                  }
                />
              </View>

              <View style={styles.beneficiary}>
                <Text
                  variant="bodySm"
                  color="textMuted"
                  style={styles.flex}
                >
                  Add a beneficiary to this policy
                </Text>
                <Pressable
                  hitSlop={12}
                  accessibilityRole="button"
                  // TODO: beneficiaries have no screen in this batch.
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <Text
                    variant="label"
                    color="primary"
                  >
                    Add
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>

        <FlowFooter>
          <Button
            title={step === 1 ? 'Continue' : 'Get my quote'}
            disabled={!canContinue}
            onPress={next}
          />
        </FlowFooter>
      </KeyboardAvoidingView>

      {picking === 'make' ? (
        <OptionSheet
          title="Vehicle make"
          options={makes.map((make) => ({ key: make.id, label: make.name }))}
          selectedKey={vehicle.makeId}
          onSelect={(option) =>
            // A new make invalidates the model chosen under the old one. Both
            // the id (for the API) and the label (for the UI) are stored.
            setQuoteVehicle({
              makeId: option.key,
              make: option.label,
              modelId: null,
              model: null,
            })
          }
          onDismiss={() => setPicking(null)}
        />
      ) : null}

      {picking === 'model' ? (
        <OptionSheet
          title="Vehicle model"
          options={models.map((model) => ({
            key: model.id,
            label: model.name,
          }))}
          selectedKey={vehicle.modelId}
          onSelect={(option) =>
            setQuoteVehicle({ modelId: option.key, model: option.label })
          }
          onDismiss={() => setPicking(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.surface },
  body: {
    paddingTop: 22,
    paddingHorizontal: sizes.screenPaddingFlow,
    paddingBottom: 24,
  },
  heading: { marginBottom: 6 },
  sub: { marginBottom: 22 },
  fields: { gap: 14 },
  helper: { marginTop: 7 },
  pair: { flexDirection: 'row', gap: 12 },
  bodyTypes: { marginTop: 16 },
  beneficiary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    borderRadius: radius.button,
    backgroundColor: colors.field,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pressed: { opacity: 0.6 },
});

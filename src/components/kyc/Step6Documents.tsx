import { StepHeading } from '@/components/kyc/StepHeading';
import { DatePickerSheet } from '@/components/ui/DatePickerSheet';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SelectRow } from '@/components/ui/SelectRow';
import { Text } from '@/components/ui/Text';
import { setKycDocument, useAppState } from '@/state/app';
import { formatShortDate, today, yearsAgo } from '@/state/dates';
import { colors, fonts, radius } from '@/theme';
import Feather from '@expo/vector-icons/Feather';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const TEN_YEARS_AGO = yearsAgo(10);
const IN_TEN_YEARS = new Date(
  today().getFullYear() + 10,
  today().getMonth(),
  today().getDate()
);

type DateField = 'issuedOn' | 'expiresOn';

export function Step6Documents() {
  const router = useRouter();
  const document = useAppState((state) => state.kyc.document);
  const [picking, setPicking] = useState<DateField | null>(null);

  const isUploading = document.status === 'uploading';
  const isUploaded = document.status === 'uploaded';

  return (
    <View>
      <StepHeading
        title="Identity documents"
        subtitle="NIN slip, driver's licence or international passport."
        gap={20}
      />

      <Pressable
        onPress={() => router.push('/kyc/camera')}
        accessibilityRole="button"
        accessibilityLabel="Capture your document with the camera"
        style={({ pressed }) => [styles.capture, pressed && styles.pressed]}
      >
        <Feather
          name="camera"
          size={26}
          color={colors.primary}
        />
        <Text style={styles.captureLabel}>Capture with camera</Text>
        <Text
          variant="caption"
          color="textMuted"
        >
          or choose from gallery
        </Text>
      </Pressable>

      {isUploading || isUploaded ? (
        <View style={styles.uploadCard}>
          <View style={styles.uploadTop}>
            {document.uri ? (
              <ExpoImage
                source={{ uri: document.uri }}
                style={styles.thumb}
                contentFit="cover"
                accessibilityLabel="Captured document"
              />
            ) : (
              <View style={styles.thumb} />
            )}

            <View style={styles.uploadCopy}>
              <Text
                style={styles.fileName}
                numberOfLines={1}
              >
                {document.fileName}
              </Text>
              <Text
                variant="caption"
                color="textMuted"
                style={styles.uploadLabel}
                accessibilityLiveRegion="polite"
              >
                {isUploaded
                  ? 'Uploaded'
                  : `Uploading ${document.progress}% · slow connection`}
              </Text>
            </View>
          </View>

          <ProgressBar
            progress={document.progress / 100}
            height={6}
            color={isUploaded ? colors.success : colors.primary}
          />
        </View>
      ) : null}

      <View style={styles.dates}>
        <SelectRow
          label="Issued"
          value={formatShortDate(document.issuedOn)}
          placeholder="Pick a date"
          accessory="none"
          height={52}
          containerStyle={styles.dateField}
          onPress={() => setPicking('issuedOn')}
        />
        <SelectRow
          label="Expires"
          value={formatShortDate(document.expiresOn)}
          placeholder="Pick a date"
          accessory="none"
          height={52}
          containerStyle={styles.dateField}
          onPress={() => setPicking('expiresOn')}
        />
      </View>

      {picking ? (
        <DatePickerSheet
          title={picking === 'issuedOn' ? 'Issued on' : 'Expires on'}
          value={document[picking]}
          fallback={today()}
          // An ID cannot have been issued in the future, nor expire in the past.
          minimumDate={picking === 'issuedOn' ? TEN_YEARS_AGO : today()}
          maximumDate={picking === 'issuedOn' ? today() : IN_TEN_YEARS}
          onConfirm={(iso) => setKycDocument({ [picking]: iso })}
          onDismiss={() => setPicking(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  capture: {
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.card,
    backgroundColor: colors.uploadTint,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  captureLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    lineHeight: 20,
    color: colors.primary,
  },
  pressed: { opacity: 0.85 },
  uploadCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  uploadTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  thumb: {
    width: 38,
    height: 46,
    borderRadius: radius.thumb,
    backgroundColor: colors.field,
  },
  uploadCopy: { flex: 1, minWidth: 0 },
  fileName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 19,
  },
  uploadLabel: { fontSize: 11, lineHeight: 15 },
  dates: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  dateField: { flex: 1 },
});

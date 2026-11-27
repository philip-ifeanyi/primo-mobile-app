import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { startDocumentUpload } from '@/state/kyc-service';
import { colors, fonts, radius, sizes } from '@/theme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** The design's guide box: ID-1 card proportions. */
const CARD_ASPECT = 1.586;

export default function KycCamera() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [isReady, setIsReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // The user tapped "Capture with camera" to get here, so asking the OS is the
  // expected next thing: put the system prompt up rather than an in-app screen
  // whose only button asks the same question again. The ref keeps it to one
  // attempt — once answered, `canAskAgain` is false and the OS would no-op.
  const hasRequested = useRef(false);
  useEffect(() => {
    if (!permission || permission.granted || hasRequested.current) return;
    if (permission.status !== 'undetermined') return;

    hasRequested.current = true;
    void requestPermission();
  }, [permission, requestPermission]);

  /** Starts the upload and hands the user back to step 6 to watch it run. */
  const accept = (uri: string, fileName: string) => {
    startDocumentUpload({ uri, fileName });
    router.back();
  };

  const capture = async () => {
    // takePictureAsync must not be called before the preview reports ready.
    if (!cameraRef.current || !isReady || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) accept(photo.uri, 'drivers-licence-front.jpg');
    } finally {
      setIsCapturing(false);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    accept(asset.uri, asset.fileName ?? 'id-document.jpg');
  };

  // Still reading the current permission: hold a blank dark screen rather than
  // flashing a request the user may have granted already.
  if (!permission) {
    return <View style={styles.screen} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['top', 'bottom']}
      >
        <View style={styles.permission}>
          <Text
            variant="stepH1"
            color="surface"
            style={styles.permissionTitle}
          >
            Camera access needed
          </Text>
          <Text
            variant="bodySm"
            style={styles.permissionCopy}
          >
            {permission.canAskAgain
              ? 'We only use the camera to photograph the ID document you attach to your application.'
              : 'Camera access is turned off for Primo. Enable it in your device settings, or attach a photo from your gallery instead.'}
          </Text>

          {permission.canAskAgain ? (
            <Button
              title="Allow camera"
              onPress={() => void requestPermission()}
            />
          ) : null}

          <Button
            title="Choose from gallery"
            variant="outline"
            onPress={() => void pickFromGallery()}
          />
          <Button
            title="Cancel"
            variant="text"
            onPress={() => router.back()}
            textStyle={styles.cancelText}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        onCameraReady={() => setIsReady(true)}
      />

      {/* Chrome sits over the live preview, so it gets its own safe area. */}
      <SafeAreaView
        style={styles.chrome}
        edges={['top', 'bottom']}
      >
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
          >
            <Text
              variant="bodySm"
              color="surface"
              style={styles.cancelText}
            >
              Cancel
            </Text>
          </Pressable>

          <Text
            variant="bodySm"
            color="surface"
            style={styles.docLabel}
          >
            Driver&apos;s licence — front
          </Text>

          <View style={styles.topSpacer} />
        </View>

        <View style={styles.guideArea}>
          <View style={styles.guide} />
          <Text style={styles.hint}>
            Flat surface, no glare, all four corners visible.
          </Text>
        </View>

        <View style={styles.controls}>
          <Pressable
            onPress={() => void pickFromGallery()}
            hitSlop={12}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.sideControl,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.sideLabel}>Gallery</Text>
          </Pressable>

          <Pressable
            onPress={() => void capture()}
            disabled={!isReady || isCapturing}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            accessibilityState={{ disabled: !isReady || isCapturing }}
            style={({ pressed }) => [
              styles.shutter,
              (pressed || isCapturing) && styles.shutterPressed,
              !isReady && styles.shutterDisabled,
            ]}
          />

          <Pressable
            onPress={() => setTorchOn((previous) => !previous)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityState={{ selected: torchOn }}
            style={({ pressed }) => [
              styles.sideControl,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.sideLabel, torchOn && styles.sideLabelOn]}>
              Flash
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cameraBg },
  chrome: {
    flex: 1,
    paddingHorizontal: sizes.screenPaddingAuth,
    paddingTop: 12,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  cancel: { paddingVertical: 10 },
  cancelText: { fontFamily: fonts.bodyMedium },
  docLabel: { fontFamily: fonts.bodyMedium },
  topSpacer: { width: 48 },
  guideArea: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  guide: {
    aspectRatio: CARD_ASPECT,
    borderRadius: radius.button,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  hint: {
    textAlign: 'center',
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.7)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
  },
  sideControl: {
    minWidth: sizes.hitArea,
    height: sizes.hitArea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.7)',
  },
  sideLabelOn: { color: colors.surface },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: radius.pill,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: colors.surface,
  },
  shutterPressed: { opacity: 0.8 },
  shutterDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
  permission: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: sizes.screenPaddingAuth,
    gap: 12,
  },
  permissionTitle: { textAlign: 'center' },
  permissionCopy: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
});

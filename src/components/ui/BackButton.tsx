import { colors, sizes } from '@/theme';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

type BackButtonProps = {
  onPress?: () => void;
};

export function BackButton({ onPress }: BackButtonProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Feather
        name="chevron-left"
        size={26}
        color={colors.ink}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    // Spec: 44x44 hit area. Anything smaller is hard to hit with a thumb and
    // fails the platform accessibility guidelines on both iOS and Android.
    width: sizes.hitArea,
    height: sizes.hitArea,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  pressed: { opacity: 0.6 },
});

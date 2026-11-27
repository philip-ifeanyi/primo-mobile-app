import { Stack } from 'expo-router';

export default function KycLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="camera"
        // Full-screen capture: no card animation, and it keeps the dark screen
        // from showing a white card edge as it slides in.
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
    </Stack>
  );
}

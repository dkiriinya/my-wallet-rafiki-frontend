import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text } from 'react-native';
import React from 'react';

// Set global font family for all Text components in React Native
// @ts-ignore
const oldRender = Text.render;
// @ts-ignore
Text.render = function (...args: any[]) {
  const origin = oldRender.call(this, ...args);
  return React.cloneElement(origin, {
    style: [{ fontFamily: 'Inter' }, origin.props.style],
  });
};

// Prevent splash screen auto-hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Inter': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
    'JetBrainsMono': Inter_400Regular,
    'JetBrainsMono-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

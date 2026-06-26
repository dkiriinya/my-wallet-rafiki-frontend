import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text } from 'react-native';
import React from 'react';
import * as SecureStore from 'expo-secure-store';
import { ClerkProvider, Show } from '@clerk/expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SignInScreen from './signin';

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

// Clerk token cache using expo-secure-store
const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      return item;
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const queryClient = new QueryClient();

// Read clerk publishable key from expo public env
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  console.warn('Warning: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing. Authenticaton will fail.');
}

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
    <ClerkProvider publishableKey={publishableKey || ""} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <Show when="signed-in">
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </Show>
        <Show when="signed-out">
          <SignInScreen />
        </Show>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

import "../global.css";
import "../src/i18n";

import { useEffect, useState } from "react";
import { View, Image } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useSettingsStore } from "../src/stores/settings-store";
import { useAuthStore } from "../src/stores/auth-store";
import i18n from "../src/i18n";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for Zustand settings store hydration
        await new Promise<void>((resolve) => {
          const unsub = useSettingsStore.persist.onFinishHydration(() => {
            unsub();
            resolve();
          });
          // If already hydrated, resolve immediately
          if (useSettingsStore.persist.hasHydrated()) {
            unsub();
            resolve();
          }
        });

        // Sync i18n with hydrated locale
        const hydratedLocale = useSettingsStore.getState().locale;
        await i18n.changeLanguage(hydratedLocale);

        // Load current user from mock services
        await loadUser();
      } catch (e) {
        console.warn("App initialization error:", e);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [loadUser]);

  if (!appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1B2B4B', alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={require('../assets/splash-icon.png')}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

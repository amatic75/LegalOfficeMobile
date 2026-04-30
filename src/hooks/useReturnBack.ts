import { useCallback } from "react";
import { BackHandler } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";

export function useReturnBack() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  const goBack = useCallback(() => {
    if (returnTo) {
      router.replace(returnTo as any);
    } else if (router.canGoBack()) {
      router.back();
    }
  }, [returnTo, router]);

  useFocusEffect(
    useCallback(() => {
      if (!returnTo) return;
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        router.replace(returnTo as any);
        return true;
      });
      return () => sub.remove();
    }, [returnTo, router])
  );

  return { goBack, returnTo };
}

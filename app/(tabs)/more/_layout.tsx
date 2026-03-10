import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "../../../src/theme/tokens";

export default function MoreLayout() {
  const { t } = useTranslation("navigation");

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.navy.DEFAULT },
        headerTintColor: "#FFFFFF",
      }}
    >
      <Stack.Screen name="index" options={{ headerTitle: t("tabs.more") }} />
      <Stack.Screen
        name="settings"
        options={{ headerTitle: t("screens.settings") }}
      />
      <Stack.Screen
        name="profile"
        options={{ headerTitle: t("screens.profile") }}
      />
    </Stack>
  );
}

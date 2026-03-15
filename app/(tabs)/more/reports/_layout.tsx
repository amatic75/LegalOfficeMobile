import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "../../../../src/theme/tokens";

export default function ReportsLayout() {
  const { t } = useTranslation("reports");

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.navy.DEFAULT },
        headerTintColor: "#FFFFFF",
      }}
    >
      <Stack.Screen name="index" options={{ headerTitle: t("hub.title") }} />
      <Stack.Screen name="financial" options={{ headerTitle: t("financial.title") }} />
      <Stack.Screen name="cases" options={{ headerTitle: t("cases.title") }} />
      <Stack.Screen name="performance" options={{ headerTitle: t("performance.title") }} />
    </Stack>
  );
}

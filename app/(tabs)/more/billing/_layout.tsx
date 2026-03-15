import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "../../../../src/theme/tokens";

export default function BillingLayout() {
  const { t } = useTranslation("billing");

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.navy.DEFAULT },
        headerTintColor: "#FFFFFF",
      }}
    >
      <Stack.Screen name="index" options={{ headerTitle: t("list.title") }} />
      <Stack.Screen name="new" options={{ headerTitle: t("create.title") }} />
      <Stack.Screen name="[id]" options={{ headerTitle: t("title") }} />
      <Stack.Screen name="balances" options={{ headerTitle: t("balance.title") }} />
    </Stack>
  );
}

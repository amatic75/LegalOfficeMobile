import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "../../../../src/theme/tokens";

export default function MoreDocumentsLayout() {
  const { t } = useTranslation("moreDocuments");

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.navy.DEFAULT },
        headerTintColor: "#FFFFFF",
      }}
    >
      <Stack.Screen name="index" options={{ headerTitle: t("title") }} />
      <Stack.Screen name="templates" options={{ headerTitle: t("templates.title") }} />
      <Stack.Screen name="all" options={{ headerTitle: t("all.title") }} />
    </Stack>
  );
}

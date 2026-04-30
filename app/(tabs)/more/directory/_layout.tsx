import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "../../../../src/theme/tokens";

export default function DirectoryLayout() {
  const { t } = useTranslation("directory");
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.navy.DEFAULT },
        headerTintColor: "#FFFFFF",
      }}
    >
      <Stack.Screen name="index" options={{ headerTitle: t("title") }} />
      <Stack.Screen name="lawyers" options={{ headerTitle: t("lawyers.title") }} />
      <Stack.Screen name="judges" options={{ headerTitle: t("judges.title") }} />
      <Stack.Screen name="courts" options={{ headerTitle: t("courts.title") }} />
    </Stack>
  );
}

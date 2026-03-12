import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "../../../src/theme/tokens";

export default function CalendarLayout() {
  const { t } = useTranslation("navigation");
  const { t: tc } = useTranslation("calendar");

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.navy.DEFAULT },
        headerTintColor: "#FFFFFF",
        headerTitle: t("tabs.calendar"),
      }}
    >
      <Stack.Screen name="index" options={{ headerTitle: t("tabs.calendar") }} />
      <Stack.Screen name="event/[id]" options={{ headerTitle: "" }} />
      <Stack.Screen name="event/new" options={{ headerTitle: tc("form.createTitle") }} />
    </Stack>
  );
}

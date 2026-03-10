import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "../../../src/theme/tokens";

export default function CalendarLayout() {
  const { t } = useTranslation("navigation");

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.navy.DEFAULT },
        headerTintColor: "#FFFFFF",
        headerTitle: t("tabs.calendar"),
      }}
    />
  );
}

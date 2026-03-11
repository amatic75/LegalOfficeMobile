import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "../../../src/theme/tokens";

export default function CasesLayout() {
  const { t } = useTranslation("navigation");
  const { t: tc } = useTranslation("cases");

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.navy.DEFAULT },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerTitle: t("tabs.cases") }}
      />
      <Stack.Screen
        name="[id]"
        options={{ headerTitle: "" }}
      />
      <Stack.Screen
        name="new"
        options={{ headerTitle: tc("form.createTitle") }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{ headerTitle: tc("form.editTitle") }}
      />
    </Stack>
  );
}

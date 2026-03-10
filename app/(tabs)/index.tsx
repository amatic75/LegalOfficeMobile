import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { ScreenContainer, Card } from "../../src/components/ui";
import { useAuthStore } from "../../src/stores/auth-store";

export default function HomeScreen() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.currentUser);
  const firstName = currentUser?.firstName ?? "";

  return (
    <ScreenContainer scroll>
      <View className="mb-6 rounded-b-xl bg-navy p-6 -mx-4 -mt-0">
        <Text className="text-center text-xl font-bold text-white">
          {t("app.name")}
        </Text>
      </View>

      <Text className="mb-4 text-lg font-semibold text-navy">
        {t("greeting", { name: firstName })}
      </Text>

      <Card className="mb-4">
        <Text className="mb-2 text-base font-semibold text-navy">
          {t("home.recentCases")}
        </Text>
        <Text className="text-sm text-gray-500">
          {t("placeholder.cases")}
        </Text>
      </Card>

      <Card className="mb-4">
        <Text className="mb-2 text-base font-semibold text-navy">
          {t("home.deadlinesThisWeek")}
        </Text>
        <Text className="text-sm text-gray-500">
          {t("upcomingDeadlines")}
        </Text>
      </Card>
    </ScreenContainer>
  );
}

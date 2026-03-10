import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { ScreenContainer, Card } from "../../../src/components/ui";

export default function CalendarScreen() {
  const { t } = useTranslation();

  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center">
        <Card className="w-full">
          <Text className="mb-2 text-center text-lg font-semibold text-navy">
            {t("calendar")}
          </Text>
          <Text className="text-center text-sm text-gray-500">
            {t("placeholder.calendar")}
          </Text>
        </Card>
      </View>
    </ScreenContainer>
  );
}

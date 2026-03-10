import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { ScreenContainer, Card } from "../../../src/components/ui";
import { useServices } from "../../../src/hooks/useServices";

export default function ClientsScreen() {
  const { t } = useTranslation();
  const services = useServices();
  const [clientCount, setClientCount] = useState<number | null>(null);

  useEffect(() => {
    services.clients.getClientCount().then(setClientCount);
  }, [services]);

  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center">
        <Card className="w-full">
          <Text className="mb-2 text-center text-lg font-semibold text-navy">
            {t("clients")}
          </Text>
          <Text className="mb-4 text-center text-sm text-gray-500">
            {t("placeholder.clients")}
          </Text>
          {clientCount !== null && (
            <Text className="text-center text-sm text-golden-700">
              {t("clientCount")}: {clientCount}
            </Text>
          )}
        </Card>
      </View>
    </ScreenContainer>
  );
}

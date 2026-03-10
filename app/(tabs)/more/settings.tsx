import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { useSettingsStore } from "../../../src/stores/settings-store";
import { LOCALES, type Locale } from "../../../src/i18n";
import { ScreenContainer, Card } from "../../../src/components/ui";
import { colors } from "../../../src/theme/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

export default function SettingsScreen() {
  const { t } = useTranslation("settings");
  const { t: tc } = useTranslation();
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <ScreenContainer scroll>
      {/* Language Switcher Section */}
      <View className="mb-6 mt-4">
        <Text className="mb-2 text-lg font-semibold text-navy">
          {t("language.title")}
        </Text>
        <Text className="mb-3 text-sm text-gray-500">
          {t("language.description")}
        </Text>
        <Card>
          {LOCALES.map((item, index) => {
            const isActive = item.code === locale;
            return (
              <Pressable
                key={item.code}
                onPress={() => setLocale(item.code as Locale)}
                className={`flex-row items-center py-3 ${
                  index < LOCALES.length - 1 ? "border-b border-cream-200" : ""
                }`}
              >
                <Ionicons
                  name={
                    (isActive
                      ? "checkmark-circle"
                      : "ellipse-outline") as IoniconsName
                  }
                  size={24}
                  color={
                    isActive ? colors.golden.DEFAULT : "#888888"
                  }
                />
                <Text
                  className={`ml-3 text-base ${
                    isActive
                      ? "font-semibold text-navy"
                      : "text-gray-600"
                  }`}
                >
                  {item.labelNative}
                </Text>
              </Pressable>
            );
          })}
        </Card>
      </View>

      {/* About Section */}
      <View className="mb-6">
        <Text className="mb-2 text-lg font-semibold text-navy">
          {t("about.title")}
        </Text>
        <Card>
          <Text className="mb-1 text-base font-semibold text-navy">
            {tc("app.name")}
          </Text>
          <Text className="mb-2 text-sm text-gray-500">
            {tc("app.version", { version: appVersion })}
          </Text>
          <Text className="text-sm text-gray-500">
            {t("about.description")}
          </Text>
        </Card>
      </View>
    </ScreenContainer>
  );
}

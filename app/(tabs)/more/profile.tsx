import { View, Text, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../src/stores/auth-store";
import { ScreenContainer, Card, Badge } from "../../../src/components/ui";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.currentUser);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#C8A951" />
          <Text className="mt-4 text-gray-500">{t("loading")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!currentUser) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-gray-500">
            {t("profile.noUser")}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const initials =
    (currentUser.firstName?.[0] ?? "") + (currentUser.lastName?.[0] ?? "");

  return (
    <ScreenContainer>
      {/* User Info Card */}
      <Card className="mt-4 items-center">
        {/* Avatar */}
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-navy">
          <Text className="text-2xl font-bold text-golden">
            {initials}
          </Text>
        </View>

        {/* Name */}
        <Text className="mb-2 text-xl font-bold text-navy">
          {currentUser.firstName} {currentUser.lastName}
        </Text>

        {/* Role Badge */}
        <Badge
          label={t(`roles.${currentUser.role}`)}
          variant="golden"
        />
      </Card>

      {/* Additional Info Card */}
      <Card className="mt-4">
        <View className="mb-3">
          <Text className="text-sm text-gray-500">
            {t("profile.role")}
          </Text>
          <Text className="text-base text-navy">
            {t(`roles.${currentUser.role}`)}
          </Text>
        </View>
        <View>
          <Text className="text-sm text-gray-500">
            {t("profile.email")}
          </Text>
          <Text className="text-base text-navy">
            {currentUser.email}
          </Text>
        </View>
      </Card>
    </ScreenContainer>
  );
}

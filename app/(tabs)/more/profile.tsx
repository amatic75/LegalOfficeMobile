import { View, Text, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../../src/stores/auth-store";
import { colors } from "../../../src/theme/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.currentUser);
  const isLoading = useAuthStore((s) => s.isLoading);
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
        <Text style={{ marginTop: 12, color: "#888" }}>{t("loading")}</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 15, color: "#888" }}>{t("profile.noUser")}</Text>
      </View>
    );
  }

  const initials =
    (currentUser.firstName?.[0] ?? "") + (currentUser.lastName?.[0] ?? "");

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, paddingBottom: insets.bottom }}>
      {/* Profile Header Card */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          marginHorizontal: 16,
          marginTop: 20,
          borderRadius: 16,
          padding: 24,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#FFF3E0",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Avatar */}
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.navy.DEFAULT,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
            borderWidth: 3,
            borderColor: colors.golden.DEFAULT,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.golden.DEFAULT }}>
            {initials}
          </Text>
        </View>

        {/* Name */}
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 6 }}>
          {currentUser.firstName} {currentUser.lastName}
        </Text>

        {/* Role Badge */}
        <View
          style={{
            backgroundColor: "#FDF8EC",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: colors.golden[100],
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.golden.DEFAULT }}>
            {t(`roles.${currentUser.role}`)}
          </Text>
        </View>
      </View>

      {/* Info Cards */}
      <View style={{ marginHorizontal: 16, marginTop: 16, gap: 10 }}>
        {/* Email */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#FFF3E0",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: "#FDF8EC",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Ionicons name={"mail-outline" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
          </View>
          <View>
            <Text style={{ fontSize: 11, color: "#AAA", marginBottom: 2 }}>
              {t("profile.email")}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: "500", color: colors.navy.DEFAULT }}>
              {currentUser.email}
            </Text>
          </View>
        </View>

        {/* Role */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#FFF3E0",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: "#FDF8EC",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Ionicons name={"shield-outline" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
          </View>
          <View>
            <Text style={{ fontSize: 11, color: "#AAA", marginBottom: 2 }}>
              {t("profile.role")}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: "500", color: colors.navy.DEFAULT }}>
              {t(`roles.${currentUser.role}`)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

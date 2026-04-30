import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "../../../src/stores/settings-store";
import { LOCALES, type Locale } from "../../../src/i18n";
import { colors } from "../../../src/theme/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

export default function SettingsScreen() {
  const { t } = useTranslation("settings");
  const { t: tc } = useTranslation();
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const insets = useSafeAreaInsets();

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, paddingHorizontal: 16, paddingBottom: insets.bottom }}>
      {/* Language Switcher Section */}
      <View style={{ marginTop: 20, marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 4 }}>
          {t("language.title")}
        </Text>
        <Text style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
          {t("language.description")}
        </Text>

        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#FFF3E0",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          {LOCALES.map((item, index) => {
            const isActive = item.code === locale;
            return (
              <Pressable
                key={item.code}
                onPress={() => setLocale(item.code as Locale)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: index < LOCALES.length - 1 ? 1 : 0,
                  borderBottomColor: "#F5F0E8",
                  backgroundColor: isActive ? "#FDF8EC" : "transparent",
                }}
              >
                <Ionicons
                  name={
                    (isActive ? "checkmark-circle" : "ellipse-outline") as IoniconsName
                  }
                  size={22}
                  color={isActive ? colors.golden.DEFAULT : "#CCC"}
                />
                <Text
                  style={{
                    marginLeft: 12,
                    fontSize: 15,
                    fontWeight: isActive ? "600" : "400",
                    color: isActive ? colors.navy.DEFAULT : "#666",
                    flex: 1,
                  }}
                >
                  {item.labelNative}
                </Text>
                {isActive && (
                  <View
                    style={{
                      backgroundColor: colors.golden.DEFAULT,
                      borderRadius: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "600", color: "#FFF" }}>
                      ✓
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* About Section */}
      <View>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 12 }}>
          {t("about.title")}
        </Text>
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: "#FFF3E0",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.golden.DEFAULT,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={"scale-outline" as IoniconsName} size={18} color="#FFFFFF" />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.navy.DEFAULT }}>
                {tc("app.name")}
              </Text>
              <Text style={{ fontSize: 12, color: "#888" }}>
                {tc("app.version", { version: appVersion })}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: "#888", lineHeight: 18, marginTop: 4 }}>
            {t("about.description")}
          </Text>
        </View>
      </View>
    </View>
  );
}

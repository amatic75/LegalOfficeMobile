import { View, Text, Pressable, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenContainer } from "../../../../src/components/ui";
import { colors } from "../../../../src/theme/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface HubCard {
  icon: IoniconsName;
  title: string;
  description: string;
  route: string;
}

export default function MoreDocumentsHubScreen() {
  const { t } = useTranslation("moreDocuments");
  const router = useRouter();

  const cards: HubCard[] = [
    {
      icon: "library-outline",
      title: t("hub.templates"),
      description: t("hub.templatesDesc"),
      route: "/(tabs)/more/documents/templates",
    },
    {
      icon: "documents-outline",
      title: t("hub.all"),
      description: t("hub.allDesc"),
      route: "/(tabs)/more/documents/all",
    },
  ];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        {cards.map((card) => (
          <Pressable
            key={card.route}
            onPress={() => router.push(card.route as never)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#FFF3E0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#FDF8EC",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={card.icon} size={22} color={colors.golden.DEFAULT} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.navy.DEFAULT }}>
                {card.title}
              </Text>
              <Text style={{ fontSize: 13, color: "#8E8E93", marginTop: 2 }}>
                {card.description}
              </Text>
            </View>
            <Ionicons name={"chevron-forward" as IoniconsName} size={20} color="#CCCCCC" />
          </Pressable>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

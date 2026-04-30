import { View, Text, FlatList } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useLocalSearchParams, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useServices } from "../../../src/hooks/useServices";
import { colors } from "../../../src/theme/tokens";
import type { ClientActivity } from "../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

export default function ActivityScreen() {
  const { clientId, mode, clientName } = useLocalSearchParams<{
    clientId: string;
    mode: string;
    clientName: string;
  }>();
  const { t } = useTranslation("clients");
  const services = useServices();

  const [items, setItems] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const isRecent = mode === "recent";
  const headerTitle = isRecent
    ? `${t("recentActivity.title")} - ${clientName ?? ""}`
    : `${t("upcomingActivity.title")} - ${clientName ?? ""}`;

  useEffect(() => {
    async function load() {
      if (!clientId) return;
      const data = isRecent
        ? await services.clientAggregation.getRecentActivity(clientId, 50)
        : await services.clientAggregation.getUpcomingActivity(clientId, 50);
      setItems(data);
      setLoading(false);
    }
    load();
  }, [clientId, mode, services, isRecent]);

  const renderItem = ({ item, index }: { item: ClientActivity; index: number }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: index < items.length - 1 ? 1 : 0,
        borderBottomColor: "#F5F0E8",
      }}
    >
      <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
        <Ionicons name={item.icon as IoniconsName} size={16} color={colors.golden.DEFAULT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT }}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
          {item.caseName} ({item.caseNumber})
        </Text>
        <Text style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>
          {formatDateDisplay(item.date)}
        </Text>
        {item.description ? (
          <Text numberOfLines={2} style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerTitle }} />
      <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 13, color: "#AAA" }}>...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Ionicons
              name={(isRecent ? "time-outline" : "calendar-outline") as IoniconsName}
              size={40}
              color="#DDD"
            />
            <Text style={{ fontSize: 14, color: "#AAA", marginTop: 10 }}>
              {t(isRecent ? "recentActivity.noActivity" : "upcomingActivity.noActivity")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              margin: 16,
              borderWidth: 1,
              borderColor: "#FFF3E0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}

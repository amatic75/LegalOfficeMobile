import { View, Text, FlatList, Pressable, ActivityIndicator, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import { useState, useCallback, useMemo } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useServices } from "../../../../src/hooks/useServices";
import { colors } from "../../../../src/theme/tokens";
import type { Client } from "../../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function getDisplayName(c: Client): string {
  if (c.type === "individual") return `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
  return c.companyName ?? "";
}

// "All Documents" is a client-picker entry: tapping a client opens the existing
// client documents page (which already has the Client/Case tabs + per-case
// dropdown). This avoids duplicating the rich documents UI while still giving
// the user a single screen to browse documents across all clients.
export default function AllDocumentsScreen() {
  const { t } = useTranslation("moreDocuments");
  const services = useServices();
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    const all = await services.clients.getClients();
    setClients(all);
    setLoading(false);
  }, [services]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => getDisplayName(c).toLowerCase().includes(q));
  }, [clients, search]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      {/* Hint + search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <Text style={{ fontSize: 13, color: "#7B7363", marginBottom: 8 }}>
          {t("all.noClient")}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: "#F0EAE0",
            gap: 8,
          }}
        >
          <Ionicons name={"search-outline" as IoniconsName} size={18} color="#999" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("all.selectClient")}
            placeholderTextColor="#AAA"
            style={{ flex: 1, fontSize: 14, color: colors.navy.DEFAULT, paddingVertical: 0 }}
          />
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Ionicons name={"people-outline" as IoniconsName} size={48} color="#DDD" />
          <Text style={{ fontSize: 14, color: "#AAA", marginTop: 12, textAlign: "center" }}>
            {clients.length === 0 ? t("all.noClientsExist") : t("all.noClient")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const isIndividual = item.type === "individual";
            return (
              <Pressable
                onPress={() => router.push({
                  pathname: "/(tabs)/clients/documents/[clientId]",
                  params: { clientId: item.id, returnTo: "/(tabs)/more/documents/all" },
                })}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: "#FFF3E0",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: isIndividual ? "#FDF8EC" : colors.navy[50],
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name={(isIndividual ? "person" : "business") as IoniconsName}
                    size={20}
                    color={isIndividual ? colors.golden.DEFAULT : colors.navy.DEFAULT}
                  />
                </View>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT }} numberOfLines={1}>
                  {getDisplayName(item)}
                </Text>
                <Ionicons name={"chevron-forward" as IoniconsName} size={16} color="#CCC" />
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

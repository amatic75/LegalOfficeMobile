import { View, Text, FlatList, TextInput, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServices } from "../../../src/hooks/useServices";
import { useDebounce } from "../../../src/hooks/useDebounce";
import { useClientStore } from "../../../src/stores/client-store";
import { colors } from "../../../src/theme/tokens";
import type { Client } from "../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const FILTER_OPTIONS: Array<{ key: 'all' | 'individual' | 'corporate'; labelKey: string }> = [
  { key: 'all', labelKey: 'filter.all' },
  { key: 'individual', labelKey: 'filter.individual' },
  { key: 'corporate', labelKey: 'filter.corporate' },
];

function getClientDisplayName(client: Client): string {
  if (client.type === 'individual') {
    return `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim();
  }
  return client.companyName ?? '';
}

export default function ClientsScreen() {
  const { t } = useTranslation("clients");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const searchQuery = useClientStore((s) => s.searchQuery);
  const typeFilter = useClientStore((s) => s.typeFilter);
  const setSearchQuery = useClientStore((s) => s.setSearchQuery);
  const setTypeFilter = useClientStore((s) => s.setTypeFilter);

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const loadClients = useCallback(async () => {
    const data = await services.clients.getClients();
    setClients(data);
  }, [services]);

  useEffect(() => {
    loadClients().finally(() => setLoading(false));
  }, [loadClients]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  }, [loadClients]);

  const filtered = useMemo(() => {
    let result = clients;
    if (typeFilter !== 'all') {
      result = result.filter((c) => c.type === typeFilter);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((c) => {
        const name = getClientDisplayName(c);
        return name.toLowerCase().includes(q);
      });
    }
    return result;
  }, [clients, typeFilter, debouncedSearch]);

  const hasActiveFilters = typeFilter !== 'all' || debouncedSearch.length > 0;

  const renderItem = useCallback(({ item }: { item: Client }) => {
    const displayName = getClientDisplayName(item);
    const isIndividual = item.type === 'individual';

    return (
      <Pressable
        onPress={() => router.push('/(tabs)/clients/' + item.id)}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          padding: 14,
          marginBottom: 10,
          marginHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
          borderWidth: 1,
          borderColor: "#FFF3E0",
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: isIndividual ? "#FDF8EC" : colors.navy[50],
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons
            name={(isIndividual ? "person-outline" : "business-outline") as IoniconsName}
            size={20}
            color={isIndividual ? colors.golden.DEFAULT : colors.navy.DEFAULT}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 2 }}
          >
            {displayName}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                backgroundColor: isIndividual ? colors.golden[50] : colors.navy[50],
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: isIndividual ? colors.golden.DEFAULT : colors.navy.DEFAULT,
                }}
              >
                {t(isIndividual ? 'type.individual' : 'type.corporate')}
              </Text>
            </View>
            {item.city ? (
              <Text style={{ fontSize: 12, color: "#888" }}>{item.city}</Text>
            ) : null}
          </View>
          {item.phone ? (
            <Text style={{ fontSize: 12, color: "#AAA", marginTop: 2 }}>{item.phone}</Text>
          ) : null}
        </View>
        <Ionicons name={"chevron-forward" as IoniconsName} size={16} color="#DDD" />
      </Pressable>
    );
  }, [router, t]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.golden.DEFAULT}
            colors={[colors.golden.DEFAULT]}
          />
        }
        ListHeaderComponent={
          <View style={{ paddingTop: 12, paddingBottom: 4 }}>
            {/* Search Bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginHorizontal: 16,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: "#FFF3E0",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <Ionicons name={"search-outline" as IoniconsName} size={18} color="#AAA" />
              <TextInput
                placeholder={t("list.searchPlaceholder")}
                placeholderTextColor="#BBB"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  marginLeft: 10,
                  fontSize: 14,
                  color: colors.navy.DEFAULT,
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name={"close-circle" as IoniconsName} size={18} color="#CCC" />
                </Pressable>
              )}
            </View>

            {/* Filter Chips */}
            <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 6 }}>
              {FILTER_OPTIONS.map((option) => {
                const isActive = typeFilter === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setTypeFilter(option.key)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isActive ? colors.golden.DEFAULT : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isActive ? colors.golden.DEFAULT : "#E8E0D0",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: isActive ? "#FFFFFF" : colors.navy.DEFAULT,
                      }}
                    >
                      {t(option.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 60, paddingHorizontal: 32 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: "#FDF8EC",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons
                name={(hasActiveFilters ? "search-outline" : "people-outline") as IoniconsName}
                size={28}
                color={colors.golden.DEFAULT}
              />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 4, textAlign: "center" }}>
              {hasActiveFilters ? t("list.noResults") : t("list.emptyState")}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB - New Client */}
      <Pressable
        onPress={() => router.push('/(tabs)/clients/new')}
        style={{
          position: "absolute",
          bottom: 24 + insets.bottom,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.golden.DEFAULT,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.golden.DEFAULT,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Ionicons name={"add" as IoniconsName} size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

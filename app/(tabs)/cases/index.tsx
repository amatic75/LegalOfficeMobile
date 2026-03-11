import { View, Text, FlatList, TextInput, Pressable, RefreshControl, ActivityIndicator, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServices } from "../../../src/hooks/useServices";
import { useDebounce } from "../../../src/hooks/useDebounce";
import { useCaseStore } from "../../../src/stores/case-store";
import { colors } from "../../../src/theme/tokens";
import type { CaseSummary, CaseStatus, CaseType } from "../../../src/services/types";
import { STATUS_COLORS } from "../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const STATUS_OPTIONS: Array<{ key: CaseStatus | 'all'; labelKey: string }> = [
  { key: 'all', labelKey: 'filter.allStatuses' },
  { key: 'new', labelKey: 'status.new' },
  { key: 'active', labelKey: 'status.active' },
  { key: 'pending', labelKey: 'status.pending' },
  { key: 'closed', labelKey: 'status.closed' },
  { key: 'archived', labelKey: 'status.archived' },
];

const TYPE_OPTIONS: Array<{ key: CaseType | 'all'; labelKey: string }> = [
  { key: 'all', labelKey: 'filter.allTypes' },
  { key: 'civil', labelKey: 'type.civil' },
  { key: 'criminal', labelKey: 'type.criminal' },
  { key: 'family', labelKey: 'type.family' },
  { key: 'corporate', labelKey: 'type.corporate' },
];

const CASE_TYPE_COLORS: Record<CaseType, string> = {
  civil: '#1565C0',
  criminal: '#C62828',
  family: '#6A1B9A',
  corporate: '#00695C',
};

export default function CasesScreen() {
  const { t } = useTranslation("cases");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const searchQuery = useCaseStore((s) => s.searchQuery);
  const statusFilter = useCaseStore((s) => s.statusFilter);
  const typeFilter = useCaseStore((s) => s.typeFilter);
  const setSearchQuery = useCaseStore((s) => s.setSearchQuery);
  const setStatusFilter = useCaseStore((s) => s.setStatusFilter);
  const setTypeFilter = useCaseStore((s) => s.setTypeFilter);

  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const loadCases = useCallback(async () => {
    const data = await services.cases.getCases();
    setCases(data);
  }, [services]);

  useEffect(() => {
    loadCases().finally(() => setLoading(false));
  }, [loadCases]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCases();
    setRefreshing(false);
  }, [loadCases]);

  const filtered = useMemo(() => {
    let result = cases;
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      result = result.filter((c) => c.caseType === typeFilter);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((c) => {
        return (
          c.caseNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.clientName.toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [cases, statusFilter, typeFilter, debouncedSearch]);

  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || debouncedSearch.length > 0;

  const renderItem = useCallback(({ item }: { item: CaseSummary }) => {
    const statusColor = STATUS_COLORS[item.status] ?? STATUS_COLORS.active;
    const typeColor = CASE_TYPE_COLORS[item.caseType] ?? '#1565C0';

    return (
      <Pressable
        onPress={() => router.push('/(tabs)/cases/' + item.id)}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          padding: 14,
          marginBottom: 10,
          marginHorizontal: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
          borderWidth: 1,
          borderColor: "#FFF3E0",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 13, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}
          >
            {item.caseNumber}
          </Text>
          <View
            style={{
              backgroundColor: statusColor.bg,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 3,
              marginLeft: 8,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "600", color: statusColor.text }}>
              {t('status.' + item.status)}
            </Text>
          </View>
        </View>
        <Text
          numberOfLines={1}
          style={{ fontSize: 15, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}
        >
          {item.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Ionicons name={"person-outline" as IoniconsName} size={12} color="#AAA" style={{ marginRight: 4 }} />
            <Text numberOfLines={1} style={{ fontSize: 12, color: "#888", flex: 1 }}>
              {item.clientName}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: typeColor + '15',
              borderRadius: 4,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "600", color: typeColor }}>
              {t('type.' + item.caseType)}
            </Text>
          </View>
        </View>
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

            {/* Status Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 8 }}
            >
              {STATUS_OPTIONS.map((option) => {
                const isActive = statusFilter === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setStatusFilter(option.key)}
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
            </ScrollView>

            {/* Type Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 6 }}
            >
              {TYPE_OPTIONS.map((option) => {
                const isActive = typeFilter === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setTypeFilter(option.key)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isActive ? colors.navy.DEFAULT : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isActive ? colors.navy.DEFAULT : "#E8E0D0",
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
            </ScrollView>
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
                name={(hasActiveFilters ? "search-outline" : "briefcase-outline") as IoniconsName}
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

      {/* FAB - New Case */}
      <Pressable
        onPress={() => router.push('/(tabs)/cases/new')}
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

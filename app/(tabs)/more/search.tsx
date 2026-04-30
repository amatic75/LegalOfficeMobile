import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  SectionList,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useServices } from "../../../src/hooks/useServices";
import { useReturnBack } from "../../../src/hooks/useReturnBack";
import { useDebounce } from "../../../src/hooks/useDebounce";
import { colors } from "../../../src/theme/tokens";
import { DeleteConfirmDialog } from "../../../src/components/ui/DeleteConfirmDialog";
import type {
  Client,
  CaseSummary,
  CalendarEvent,
  SavedSearch,
  SearchHistoryEntry,
  SearchFilter,
  QuickFilterId,
} from "../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface SearchResult {
  id: string;
  type: "client" | "case" | "event";
  title: string;
  subtitle: string;
  icon: IoniconsName;
  route: string;
}

interface SearchSection {
  title: string;
  icon: IoniconsName;
  data: SearchResult[];
}

const SECTION_CARD = {
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  borderWidth: 1,
  borderColor: colors.golden[100],
  padding: 14,
};


function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getFilterSummary(filters: SearchFilter, lawyers: Array<{ id: string; name: string }>): string {
  const parts: string[] = [];
  if (filters.types?.length) parts.push(filters.types.join(", "));
  if (filters.status?.length) parts.push(filters.status.join(", "));
  if (filters.dateFrom || filters.dateTo) {
    parts.push(
      `${filters.dateFrom || "..."} - ${filters.dateTo || "..."}`
    );
  }
  if (filters.lawyerId) {
    const lawyer = lawyers.find((l) => l.id === filters.lawyerId);
    if (lawyer) parts.push(lawyer.name);
  }
  return parts.join(" | ") || "No filters";
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getWeekStartStr(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = start of week
  d.setDate(d.getDate() - diff);
  return d.toISOString().split("T")[0];
}

function getDateOffsetStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const QUICK_FILTERS: Array<{
  id: QuickFilterId;
  icon: IoniconsName;
  getConfig: () => { query: string; filters: SearchFilter };
}> = [
  {
    id: "my-cases",
    icon: "briefcase-outline",
    getConfig: () => ({
      query: "",
      filters: { types: ["case"], lawyerId: "1" },
    }),
  },
  {
    id: "urgent",
    icon: "alert-circle-outline",
    getConfig: () => ({
      query: "",
      filters: {
        types: ["event"],
        dateFrom: getTodayStr(),
        dateTo: getDateOffsetStr(7),
      },
    }),
  },
  {
    id: "new-this-week",
    icon: "time-outline",
    getConfig: () => ({
      query: "",
      filters: {
        dateFrom: getWeekStartStr(),
        dateTo: getTodayStr(),
      },
    }),
  },
];

export default function SearchScreen() {
  const { t } = useTranslation(["search", "common"]);
  const router = useRouter();
  const { goBack, returnTo } = useReturnBack();
  const services = useServices();
  const inputRef = useRef<TextInput>(null);

  // Search state
  const [query, setQuery] = useState("");
  const [sections, setSections] = useState<SearchSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SearchFilter>({});
  const [activeQuickFilter, setActiveQuickFilter] =
    useState<QuickFilterId | null>(null);

  // Saved searches and history
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [historyEntries, setHistoryEntries] = useState<SearchHistoryEntry[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Modal state
  const [filterModalType, setFilterModalType] = useState<
    "type" | "status" | "date" | "lawyer" | null
  >(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [deleteSearchConfirm, setDeleteSearchConfirm] = useState<SavedSearch | null>(null);
  const [clearHistoryConfirm, setClearHistoryConfirm] = useState(false);

  // Directory lawyers (replaces MOCK_LAWYERS)
  const [lawyers, setLawyers] = useState<Array<{ id: string; name: string }>>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      services.directory.getLawyers().then((data) => {
        if (active) {
          setLawyers(data.map((l) => ({ id: l.id, name: l.displayName })));
        }
      });
      return () => { active = false; };
    }, [services])
  );

  // Temp filter state for modal editing
  const [tempFilterTypes, setTempFilterTypes] = useState<
    ("client" | "case" | "event")[]
  >([]);
  const [tempFilterStatus, setTempFilterStatus] = useState<string[]>([]);
  const [tempDateFrom, setTempDateFrom] = useState("");
  const [tempDateTo, setTempDateTo] = useState("");
  const [tempLawyerId, setTempLawyerId] = useState("");

  // Track last history query to avoid duplicates
  const lastHistoryQuery = useRef("");

  const debouncedQuery = useDebounce(query, 400);

  const isSearchActive =
    debouncedQuery.trim().length > 0 ||
    (activeFilters.types && activeFilters.types.length > 0) ||
    (activeFilters.status && activeFilters.status.length > 0) ||
    !!activeFilters.dateFrom ||
    !!activeFilters.dateTo ||
    !!activeFilters.lawyerId;

  // Load saved searches and history on mount
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [saved, history] = await Promise.all([
          services.search.getSavedSearches(),
          services.search.getSearchHistory(),
        ]);
        setSavedSearches(saved);
        setHistoryEntries(history);
      } catch {
        // ignore
      } finally {
        setLoadingMeta(false);
      }
    };
    loadMeta();
  }, []);

  // Perform search when query or filters change
  useEffect(() => {
    if (!isSearchActive) {
      setSections([]);
      if (hasSearched) setHasSearched(false);
      return;
    }

    let cancelled = false;
    const performSearch = async () => {
      setLoading(true);
      try {
        const [clients, allCases, events] = await Promise.all([
          services.clients.getClients(),
          services.cases.getCases(),
          services.calendarEvents.getEvents(),
        ]);

        if (cancelled) return;

        const q = debouncedQuery.toLowerCase();

        // Filter clients
        let clientResults: SearchResult[] = [];
        if (
          !activeFilters.types ||
          activeFilters.types.length === 0 ||
          activeFilters.types.includes("client")
        ) {
          clientResults = clients
            .filter((c: Client) => {
              const displayName =
                c.type === "corporate"
                  ? c.companyName || ""
                  : `${c.firstName || ""} ${c.lastName || ""}`;
              if (q && !displayName.toLowerCase().includes(q) &&
                !(c.email || "").toLowerCase().includes(q)) {
                return false;
              }
              return true;
            })
            .map((c: Client) => ({
              id: c.id,
              type: "client" as const,
              title:
                c.type === "corporate"
                  ? c.companyName || ""
                  : `${c.firstName || ""} ${c.lastName || ""}`.trim(),
              subtitle: c.city || c.email || "",
              icon: "person-outline" as IoniconsName,
              route: `/(tabs)/clients/${c.id}`,
            }));
        }

        // Filter cases
        let caseResults: SearchResult[] = [];
        if (
          !activeFilters.types ||
          activeFilters.types.length === 0 ||
          activeFilters.types.includes("case")
        ) {
          caseResults = allCases
            .filter((cs: CaseSummary) => {
              if (q) {
                const matchesQuery =
                  cs.title.toLowerCase().includes(q) ||
                  cs.caseNumber.toLowerCase().includes(q) ||
                  cs.clientName.toLowerCase().includes(q);
                if (!matchesQuery) return false;
              }
              if (
                activeFilters.status &&
                activeFilters.status.length > 0 &&
                !activeFilters.status.includes(cs.status)
              ) {
                return false;
              }
              if (activeFilters.lawyerId && cs.lawyerId !== activeFilters.lawyerId) {
                return false;
              }
              if (activeFilters.dateFrom && cs.createdAt < activeFilters.dateFrom) {
                return false;
              }
              if (activeFilters.dateTo) {
                const endDate = activeFilters.dateTo + "T23:59:59";
                if (cs.createdAt > endDate) return false;
              }
              return true;
            })
            .map((cs: CaseSummary) => ({
              id: cs.id,
              type: "case" as const,
              title: cs.title,
              subtitle: `${cs.caseNumber} - ${cs.clientName}`,
              icon: "briefcase-outline" as IoniconsName,
              route: `/(tabs)/cases/${cs.id}`,
            }));
        }

        // Filter events
        let eventResults: SearchResult[] = [];
        if (
          !activeFilters.types ||
          activeFilters.types.length === 0 ||
          activeFilters.types.includes("event")
        ) {
          eventResults = events
            .filter((ev: CalendarEvent) => {
              if (q) {
                const matchesQuery =
                  ev.title.toLowerCase().includes(q) ||
                  (ev.caseName || "").toLowerCase().includes(q);
                if (!matchesQuery) return false;
              }
              if (activeFilters.dateFrom && ev.date < activeFilters.dateFrom) {
                return false;
              }
              if (activeFilters.dateTo && ev.date > activeFilters.dateTo) {
                return false;
              }
              return true;
            })
            .map((ev: CalendarEvent) => ({
              id: ev.id,
              type: "event" as const,
              title: ev.title,
              subtitle: `${ev.date}${ev.startTime ? " " + ev.startTime : ""}`,
              icon: "calendar-outline" as IoniconsName,
              route: `/(tabs)/calendar/event/${ev.id}`,
            }));
        }

        const allSections: SearchSection[] = [
          {
            title: t("search:clients"),
            icon: "people-outline" as IoniconsName,
            data: clientResults,
          },
          {
            title: t("search:cases"),
            icon: "briefcase-outline" as IoniconsName,
            data: caseResults,
          },
          {
            title: t("search:events"),
            icon: "calendar-outline" as IoniconsName,
            data: eventResults,
          },
        ].filter((section) => section.data.length > 0);

        setSections(allSections);
        setHasSearched(true);

        // Add to history if query is non-empty and different from last
        const totalResults =
          clientResults.length + caseResults.length + eventResults.length;
        if (
          debouncedQuery.trim() &&
          debouncedQuery.trim() !== lastHistoryQuery.current
        ) {
          lastHistoryQuery.current = debouncedQuery.trim();
          services.search
            .addToHistory({
              query: debouncedQuery.trim(),
              resultCount: totalResults,
              searchedAt: new Date().toISOString(),
            })
            .then((entry) => {
              setHistoryEntries((prev) => [entry, ...prev]);
            })
            .catch(() => {});
        }
      } catch {
        setSections([]);
        setHasSearched(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    performSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, activeFilters]);

  const executeSearch = useCallback(
    (newQuery: string, newFilters: SearchFilter) => {
      setQuery(newQuery);
      setActiveFilters(newFilters);
    },
    []
  );

  const handleQuickFilter = useCallback(
    (filterId: QuickFilterId) => {
      if (activeQuickFilter === filterId) {
        // Toggle off
        setActiveQuickFilter(null);
        setQuery("");
        setActiveFilters({});
        return;
      }
      setActiveQuickFilter(filterId);
      const config = QUICK_FILTERS.find((f) => f.id === filterId)!.getConfig();
      executeSearch(config.query, config.filters);
    },
    [activeQuickFilter, executeSearch]
  );

  const handleSavedSearchTap = useCallback(
    (search: SavedSearch) => {
      setActiveQuickFilter(null);
      executeSearch(search.query, search.filters);
    },
    [executeSearch]
  );

  const handleDeleteSavedSearch = useCallback((search: SavedSearch) => {
    setDeleteSearchConfirm(search);
  }, []);

  const confirmDeleteSavedSearch = useCallback(async () => {
    if (!deleteSearchConfirm) return;
    const searchId = deleteSearchConfirm.id;
    setDeleteSearchConfirm(null);
    await services.search.deleteSavedSearch(searchId);
    setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
  }, [deleteSearchConfirm, services.search]);

  const handleHistoryTap = useCallback(
    (entry: SearchHistoryEntry) => {
      setActiveQuickFilter(null);
      setActiveFilters({});
      setQuery(entry.query);
    },
    []
  );

  const handleClearHistory = useCallback(() => {
    setClearHistoryConfirm(true);
  }, []);

  const confirmClearHistory = useCallback(async () => {
    setClearHistoryConfirm(false);
    await services.search.clearHistory();
    setHistoryEntries([]);
    lastHistoryQuery.current = "";
  }, [services.search]);

  const handleSaveSearch = useCallback(async () => {
    if (!saveSearchName.trim()) return;
    const saved = await services.search.saveSearch({
      name: saveSearchName.trim(),
      query,
      filters: activeFilters,
    });
    setSavedSearches((prev) => [...prev, saved]);
    setSaveModalVisible(false);
    setSaveSearchName("");
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  }, [saveSearchName, query, activeFilters, services.search]);

  const openFilterModal = useCallback(
    (type: "type" | "status" | "date" | "lawyer") => {
      setTempFilterTypes(activeFilters.types || []);
      setTempFilterStatus(activeFilters.status || []);
      setTempDateFrom(activeFilters.dateFrom || "");
      setTempDateTo(activeFilters.dateTo || "");
      setTempLawyerId(activeFilters.lawyerId || "");
      setFilterModalType(type);
    },
    [activeFilters]
  );

  const applyFilterModal = useCallback(() => {
    setActiveQuickFilter(null);
    setActiveFilters({
      types: tempFilterTypes.length > 0 ? tempFilterTypes : undefined,
      status: tempFilterStatus.length > 0 ? tempFilterStatus : undefined,
      dateFrom: tempDateFrom || undefined,
      dateTo: tempDateTo || undefined,
      lawyerId: tempLawyerId || undefined,
    });
    setFilterModalType(null);
  }, [tempFilterTypes, tempFilterStatus, tempDateFrom, tempDateTo, tempLawyerId]);

  const resetAllFilters = useCallback(() => {
    setActiveQuickFilter(null);
    setActiveFilters({});
    setQuery("");
  }, []);

  const getFilterCount = (dimension: "type" | "status" | "date" | "lawyer"): number => {
    switch (dimension) {
      case "type":
        return activeFilters.types?.length || 0;
      case "status":
        return activeFilters.status?.length || 0;
      case "date":
        return (activeFilters.dateFrom ? 1 : 0) + (activeFilters.dateTo ? 1 : 0);
      case "lawyer":
        return activeFilters.lawyerId ? 1 : 0;
    }
  };

  const toggleTempType = (type: "client" | "case" | "event") => {
    setTempFilterTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleTempStatus = (status: string) => {
    setTempFilterStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  // ============== RENDER ==============

  const renderSectionHeader = ({
    section,
  }: {
    section: SearchSection;
  }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: "#FDF8EC",
        marginTop: 8,
        borderRadius: 8,
        marginHorizontal: 16,
      }}
    >
      <Ionicons name={section.icon} size={18} color={colors.navy.DEFAULT} />
      <Text
        style={{
          marginLeft: 8,
          fontSize: 14,
          fontWeight: "700",
          color: colors.navy.DEFAULT,
        }}
      >
        {section.title}
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: SearchResult }) => (
    <Pressable
      onPress={() => router.push({ pathname: item.route as any, params: { returnTo: "/(tabs)/more/search" } })}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 14,
        marginHorizontal: 16,
        marginTop: 6,
        borderWidth: 1,
        borderColor: "#FFF3E0",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "#FDF8EC",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={item.icon} size={18} color={colors.golden.DEFAULT} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.navy.DEFAULT,
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: "#888888",
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {item.subtitle}
        </Text>
      </View>
      <Ionicons
        name={"chevron-forward" as IoniconsName}
        size={18}
        color="#CCCCCC"
      />
    </Pressable>
  );

  const renderFilterChip = (
    label: string,
    dimension: "type" | "status" | "date" | "lawyer"
  ) => {
    const count = getFilterCount(dimension);
    return (
      <Pressable
        key={dimension}
        onPress={() => openFilterModal(dimension)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: count > 0 ? colors.golden[50] : "#FFFFFF",
          borderRadius: 20,
          paddingHorizontal: 14,
          paddingVertical: 8,
          marginRight: 8,
          borderWidth: 1,
          borderColor: count > 0 ? colors.golden.DEFAULT : colors.golden[100],
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: count > 0 ? colors.golden.DEFAULT : colors.navy.DEFAULT,
          }}
        >
          {label}
        </Text>
        {count > 0 && (
          <View
            style={{
              backgroundColor: colors.golden.DEFAULT,
              borderRadius: 10,
              width: 20,
              height: 20,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 6,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
            >
              {count}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderQuickFilters = () => (
    <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: colors.navy.DEFAULT,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {t("search:quickFilters")}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {QUICK_FILTERS.map((filter) => {
          const isActive = activeQuickFilter === filter.id;
          return (
            <Pressable
              key={filter.id}
              onPress={() => handleQuickFilter(filter.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isActive
                  ? colors.golden.DEFAULT
                  : "#FFFFFF",
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 10,
                marginRight: 10,
                borderWidth: 1,
                borderColor: isActive
                  ? colors.golden.DEFAULT
                  : colors.golden[100],
              }}
            >
              <Ionicons
                name={filter.icon}
                size={16}
                color={isActive ? "#FFFFFF" : colors.golden.DEFAULT}
              />
              <Text
                style={{
                  marginLeft: 6,
                  fontSize: 13,
                  fontWeight: "600",
                  color: isActive ? "#FFFFFF" : colors.navy.DEFAULT,
                }}
              >
                {t(
                  `search:${
                    filter.id === "my-cases"
                      ? "myCases"
                      : filter.id === "urgent"
                      ? "urgent"
                      : "newThisWeek"
                  }`
                )}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderSavedSearches = () => (
    <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: colors.navy.DEFAULT,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {t("search:savedSearches")}
      </Text>
      <View style={SECTION_CARD}>
        {savedSearches.length === 0 ? (
          <Text
            style={{
              fontSize: 13,
              color: "#AAAAAA",
              textAlign: "center",
              paddingVertical: 12,
            }}
          >
            {t("search:noSavedSearches")}
          </Text>
        ) : (
          savedSearches.map((search, index) => (
            <Pressable
              key={search.id}
              onPress={() => handleSavedSearchTap(search)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: colors.cream[200],
              }}
            >
              <Ionicons
                name={"bookmark-outline" as IoniconsName}
                size={18}
                color={colors.golden.DEFAULT}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.navy.DEFAULT,
                  }}
                  numberOfLines={1}
                >
                  {search.name}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: "#999999",
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {search.query
                    ? `"${search.query}" - ${getFilterSummary(search.filters, lawyers)}`
                    : getFilterSummary(search.filters, lawyers)}
                </Text>
              </View>
              <Pressable
                onPress={() => handleDeleteSavedSearch(search)}
                hitSlop={8}
                style={{ padding: 4 }}
              >
                <Ionicons
                  name={"trash-outline" as IoniconsName}
                  size={16}
                  color="#CC4444"
                />
              </Pressable>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );

  const renderRecentSearches = () => (
    <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: colors.navy.DEFAULT,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {t("search:recentSearches")}
        </Text>
        {historyEntries.length > 0 && (
          <Pressable onPress={handleClearHistory} hitSlop={8}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.golden.DEFAULT,
              }}
            >
              {t("search:clearHistory")}
            </Text>
          </Pressable>
        )}
      </View>
      <View style={SECTION_CARD}>
        {historyEntries.length === 0 ? (
          <Text
            style={{
              fontSize: 13,
              color: "#AAAAAA",
              textAlign: "center",
              paddingVertical: 12,
            }}
          >
            {t("search:noHistory")}
          </Text>
        ) : (
          historyEntries.slice(0, 8).map((entry, index) => (
            <Pressable
              key={entry.id}
              onPress={() => handleHistoryTap(entry)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: colors.cream[200],
              }}
            >
              <Ionicons
                name={"time-outline" as IoniconsName}
                size={16}
                color="#AAAAAA"
              />
              <Text
                style={{
                  flex: 1,
                  marginLeft: 10,
                  fontSize: 14,
                  color: colors.navy.DEFAULT,
                }}
                numberOfLines={1}
              >
                {entry.query}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "#999999",
                  marginRight: 8,
                }}
              >
                {entry.resultCount} {t("search:results")}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "#BBBBBB",
                }}
              >
                {getRelativeTime(entry.searchedAt)}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );

  const renderFilterBar = () => {
    const hasAnyFilter =
      (activeFilters.types && activeFilters.types.length > 0) ||
      (activeFilters.status && activeFilters.status.length > 0) ||
      !!activeFilters.dateFrom ||
      !!activeFilters.dateTo ||
      !!activeFilters.lawyerId;

    return (
      <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterChip(t("search:filterByType"), "type")}
          {renderFilterChip(t("search:filterByStatus"), "status")}
          {renderFilterChip(t("search:filterByDate"), "date")}
          {renderFilterChip(t("search:filterByLawyer"), "lawyer")}
          {hasAnyFilter && (
            <Pressable
              onPress={resetAllFilters}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFF0F0",
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: "#FFCCCC",
              }}
            >
              <Ionicons
                name={"close-circle-outline" as IoniconsName}
                size={14}
                color="#CC4444"
              />
              <Text
                style={{
                  marginLeft: 4,
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#CC4444",
                }}
              >
                {t("search:resetFilters")}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderFilterModal = () => {
    if (!filterModalType) return null;

    const typeOptions: ("client" | "case" | "event")[] = [
      "client",
      "case",
      "event",
    ];
    const statusOptions = ["active", "closed", "pending", "new", "archived"];

    return (
      <Modal
        visible={!!filterModalType}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalType(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "60%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: colors.navy.DEFAULT,
                }}
              >
                {filterModalType === "type"
                  ? t("search:filterByType")
                  : filterModalType === "status"
                  ? t("search:filterByStatus")
                  : filterModalType === "date"
                  ? t("search:filterByDate")
                  : t("search:filterByLawyer")}
              </Text>
              <Pressable onPress={() => setFilterModalType(null)}>
                <Ionicons
                  name={"close" as IoniconsName}
                  size={24}
                  color={colors.navy.DEFAULT}
                />
              </Pressable>
            </View>

            {filterModalType === "type" && (
              <View>
                {typeOptions.map((type) => {
                  const selected = tempFilterTypes.includes(type);
                  return (
                    <Pressable
                      key={type}
                      onPress={() => toggleTempType(type)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.cream[200],
                      }}
                    >
                      <Ionicons
                        name={
                          (selected
                            ? "checkbox"
                            : "square-outline") as IoniconsName
                        }
                        size={22}
                        color={
                          selected
                            ? colors.golden.DEFAULT
                            : "#CCCCCC"
                        }
                      />
                      <Text
                        style={{
                          marginLeft: 12,
                          fontSize: 15,
                          color: colors.navy.DEFAULT,
                          fontWeight: selected ? "600" : "400",
                        }}
                      >
                        {t(`search:${type}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {filterModalType === "status" && (
              <View>
                {statusOptions.map((status) => {
                  const selected = tempFilterStatus.includes(status);
                  return (
                    <Pressable
                      key={status}
                      onPress={() => toggleTempStatus(status)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.cream[200],
                      }}
                    >
                      <Ionicons
                        name={
                          (selected
                            ? "checkbox"
                            : "square-outline") as IoniconsName
                        }
                        size={22}
                        color={
                          selected
                            ? colors.golden.DEFAULT
                            : "#CCCCCC"
                        }
                      />
                      <Text
                        style={{
                          marginLeft: 12,
                          fontSize: 15,
                          color: colors.navy.DEFAULT,
                          fontWeight: selected ? "600" : "400",
                        }}
                      >
                        {t(`search:${status}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {filterModalType === "date" && (
              <View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.navy.DEFAULT,
                    marginBottom: 6,
                  }}
                >
                  {t("search:dateFrom")}
                </Text>
                <TextInput
                  value={tempDateFrom}
                  onChangeText={setTempDateFrom}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#AAAAAA"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.golden[100],
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                    color: colors.navy.DEFAULT,
                    marginBottom: 14,
                  }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.navy.DEFAULT,
                    marginBottom: 6,
                  }}
                >
                  {t("search:dateTo")}
                </Text>
                <TextInput
                  value={tempDateTo}
                  onChangeText={setTempDateTo}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#AAAAAA"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.golden[100],
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                    color: colors.navy.DEFAULT,
                  }}
                />
              </View>
            )}

            {filterModalType === "lawyer" && (
              <View>
                <Pressable
                  onPress={() => setTempLawyerId("")}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.cream[200],
                  }}
                >
                  <Ionicons
                    name={
                      (!tempLawyerId
                        ? "radio-button-on"
                        : "radio-button-off") as IoniconsName
                    }
                    size={22}
                    color={
                      !tempLawyerId
                        ? colors.golden.DEFAULT
                        : "#CCCCCC"
                    }
                  />
                  <Text
                    style={{
                      marginLeft: 12,
                      fontSize: 15,
                      color: colors.navy.DEFAULT,
                      fontWeight: !tempLawyerId ? "600" : "400",
                    }}
                  >
                    {t("search:anyLawyer")}
                  </Text>
                </Pressable>
                {lawyers.map((lawyer) => {
                  const selected = tempLawyerId === lawyer.id;
                  return (
                    <Pressable
                      key={lawyer.id}
                      onPress={() => setTempLawyerId(lawyer.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.cream[200],
                      }}
                    >
                      <Ionicons
                        name={
                          (selected
                            ? "radio-button-on"
                            : "radio-button-off") as IoniconsName
                        }
                        size={22}
                        color={
                          selected
                            ? colors.golden.DEFAULT
                            : "#CCCCCC"
                        }
                      />
                      <Text
                        style={{
                          marginLeft: 12,
                          fontSize: 15,
                          color: colors.navy.DEFAULT,
                          fontWeight: selected ? "600" : "400",
                        }}
                      >
                        {lawyer.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Apply / Cancel buttons */}
            <View
              style={{
                flexDirection: "row",
                marginTop: 20,
                gap: 10,
              }}
            >
              <Pressable
                onPress={() => setFilterModalType(null)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.golden[100],
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.navy.DEFAULT,
                  }}
                >
                  {t("search:cancel")}
                </Text>
              </Pressable>
              <Pressable
                onPress={applyFilterModal}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: colors.golden.DEFAULT,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  {t("search:applyFilters")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderSaveModal = () => (
    <Modal
      visible={saveModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setSaveModalVisible(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 20,
            width: "100%",
            maxWidth: 360,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: colors.navy.DEFAULT,
              marginBottom: 14,
            }}
          >
            {t("search:saveSearch")}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colors.navy.DEFAULT,
              marginBottom: 6,
            }}
          >
            {t("search:savedSearchName")}
          </Text>
          <TextInput
            value={saveSearchName}
            onChangeText={setSaveSearchName}
            placeholder={t("search:enterName")}
            placeholderTextColor="#AAAAAA"
            autoFocus
            style={{
              borderWidth: 1,
              borderColor: colors.golden[100],
              borderRadius: 10,
              padding: 12,
              fontSize: 14,
              color: colors.navy.DEFAULT,
              marginBottom: 16,
            }}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={() => {
                setSaveModalVisible(false);
                setSaveSearchName("");
              }}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.golden[100],
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.navy.DEFAULT,
                }}
              >
                {t("search:cancel")}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSaveSearch}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: colors.golden.DEFAULT,
                alignItems: "center",
                opacity: saveSearchName.trim() ? 1 : 0.5,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#FFFFFF",
                }}
              >
                {t("search:save")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      {returnTo && (
        <Stack.Screen
          options={{
            headerLeft: () => (
              <Pressable onPress={goBack} style={{ marginLeft: 4, padding: 4 }}>
                <Ionicons name={"arrow-back" as IoniconsName} size={24} color="#FFFFFF" />
              </Pressable>
            ),
          }}
        />
      )}
      {/* Search Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#FDF8EC",
          borderRadius: 12,
          margin: 16,
          marginBottom: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: "#FFF3E0",
        }}
      >
        <Ionicons
          name={"search-outline" as IoniconsName}
          size={20}
          color="#AAAAAA"
        />
        <TextInput
          ref={inputRef}
          autoFocus={true}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (!text.trim()) setActiveQuickFilter(null);
          }}
          placeholder={t("search:placeholder")}
          placeholderTextColor="#AAAAAA"
          style={{
            flex: 1,
            marginLeft: 8,
            fontSize: 15,
            color: colors.navy.DEFAULT,
          }}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable
            onPress={() => {
              setQuery("");
              setActiveQuickFilter(null);
            }}
          >
            <Ionicons
              name={"close-circle" as IoniconsName}
              size={20}
              color="#AAAAAA"
            />
          </Pressable>
        )}
      </View>

      {/* Saved feedback toast */}
      {savedFeedback && (
        <View
          style={{
            position: "absolute",
            top: 70,
            left: 40,
            right: 40,
            backgroundColor: "#2E7D32",
            borderRadius: 10,
            padding: 12,
            zIndex: 100,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
            {t("search:searchSaved")}
          </Text>
        </View>
      )}

      {/* Filter bar - always visible when searching */}
      {renderFilterBar()}

      {/* Loading State */}
      {loading && (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
        </View>
      )}

      {/* Results with save button */}
      {!loading && isSearchActive && sections.length > 0 && (
        <View style={{ flex: 1 }}>
          {/* Save Search button */}
          <Pressable
            onPress={() => setSaveModalVisible(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginHorizontal: 16,
              marginBottom: 8,
              paddingVertical: 10,
              backgroundColor: colors.golden[50],
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.golden[100],
            }}
          >
            <Ionicons
              name={"bookmark-outline" as IoniconsName}
              size={16}
              color={colors.golden.DEFAULT}
            />
            <Text
              style={{
                marginLeft: 6,
                fontSize: 13,
                fontWeight: "700",
                color: colors.golden.DEFAULT,
              }}
            >
              {t("search:saveSearch")}
            </Text>
          </Pressable>
          <SectionList
            sections={sections}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            renderSectionHeader={renderSectionHeader as any}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 }}
            stickySectionHeadersEnabled={false}
          />
        </View>
      )}

      {/* Empty State */}
      {!loading && isSearchActive && hasSearched && sections.length === 0 && (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Ionicons
            name={"search-outline" as IoniconsName}
            size={48}
            color="#CCCCCC"
          />
          <Text
            style={{
              fontSize: 16,
              color: "#AAAAAA",
              marginTop: 12,
              textAlign: "center",
            }}
          >
            {t("search:noResults")}
          </Text>
        </View>
      )}

      {/* Initial State - show quick filters, saved searches, recent */}
      {!loading && !isSearchActive && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {loadingMeta ? (
            <ActivityIndicator
              size="small"
              color={colors.golden.DEFAULT}
              style={{ marginTop: 20 }}
            />
          ) : (
            <>
              {renderQuickFilters()}
              {renderSavedSearches()}
              {renderRecentSearches()}
            </>
          )}
        </ScrollView>
      )}

      {/* Modals */}
      {renderFilterModal()}
      {renderSaveModal()}

      <DeleteConfirmDialog
        visible={deleteSearchConfirm !== null}
        onCancel={() => setDeleteSearchConfirm(null)}
        onConfirm={confirmDeleteSavedSearch}
        title={t("search:deleteSearch")}
        body={t("search:confirmDeleteSearch")}
        confirmLabel={t("search:deleteSearch")}
      />

      <DeleteConfirmDialog
        visible={clearHistoryConfirm}
        onCancel={() => setClearHistoryConfirm(false)}
        onConfirm={confirmClearHistory}
        title={t("search:clearHistory")}
        body={t("search:confirmClearHistory")}
        confirmLabel={t("search:clearHistory")}
      />
    </View>
  );
}

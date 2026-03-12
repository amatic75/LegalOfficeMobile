import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  SectionList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useServices } from "../../../src/hooks/useServices";
import { useDebounce } from "../../../src/hooks/useDebounce";
import { colors } from "../../../src/theme/tokens";
import type { Client, CaseSummary, CalendarEvent } from "../../../src/services/types";

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

export default function SearchScreen() {
  const { t } = useTranslation(["search", "common"]);
  const router = useRouter();
  const services = useServices();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");
  const [sections, setSections] = useState<SearchSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSections([]);
      if (hasSearched && !debouncedQuery) {
        setHasSearched(false);
      }
      return;
    }

    let cancelled = false;
    const performSearch = async () => {
      setLoading(true);
      try {
        const [clients, cases, events] = await Promise.all([
          services.clients.getClients(),
          services.cases.getCases(),
          services.calendarEvents.getEvents(),
        ]);

        if (cancelled) return;

        const q = debouncedQuery.toLowerCase();

        const clientResults: SearchResult[] = clients
          .filter((c: Client) => {
            const displayName =
              c.type === "corporate"
                ? c.companyName || ""
                : `${c.firstName || ""} ${c.lastName || ""}`;
            return (
              displayName.toLowerCase().includes(q) ||
              (c.email || "").toLowerCase().includes(q)
            );
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

        const caseResults: SearchResult[] = cases
          .filter((cs: CaseSummary) => {
            return (
              cs.title.toLowerCase().includes(q) ||
              cs.caseNumber.toLowerCase().includes(q) ||
              cs.clientName.toLowerCase().includes(q)
            );
          })
          .map((cs: CaseSummary) => ({
            id: cs.id,
            type: "case" as const,
            title: cs.title,
            subtitle: `${cs.caseNumber} - ${cs.clientName}`,
            icon: "briefcase-outline" as IoniconsName,
            route: `/(tabs)/cases/${cs.id}`,
          }));

        const eventResults: SearchResult[] = events
          .filter((ev: CalendarEvent) => {
            return (
              ev.title.toLowerCase().includes(q) ||
              (ev.caseName || "").toLowerCase().includes(q)
            );
          })
          .map((ev: CalendarEvent) => ({
            id: ev.id,
            type: "event" as const,
            title: ev.title,
            subtitle: `${ev.date}${ev.startTime ? " " + ev.startTime : ""}`,
            icon: "calendar-outline" as IoniconsName,
            route: `/(tabs)/calendar/event/${ev.id}`,
          }));

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
  }, [debouncedQuery]);

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
      onPress={() => router.push(item.route as any)}
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      {/* Search Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#FDF8EC",
          borderRadius: 12,
          margin: 16,
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
          onChangeText={setQuery}
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
          <Pressable onPress={() => setQuery("")}>
            <Ionicons
              name={"close-circle" as IoniconsName}
              size={20}
              color="#AAAAAA"
            />
          </Pressable>
        )}
      </View>

      {/* Loading State */}
      {loading && (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
        </View>
      )}

      {/* Results */}
      {!loading && sections.length > 0 && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderSectionHeader={renderSectionHeader as any}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Empty State */}
      {!loading && hasSearched && sections.length === 0 && (
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

      {/* Initial State */}
      {!loading && !hasSearched && (
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
            {t("search:typeToSearch")}
          </Text>
        </View>
      )}
    </View>
  );
}

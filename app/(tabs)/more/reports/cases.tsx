import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useRouter } from "expo-router";
import { BarChart, PieChart } from "react-native-chart-kit";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenContainer } from "../../../../src/components/ui";
import { useServices } from "../../../../src/hooks/useServices";
import { colors } from "../../../../src/theme/tokens";
import type {
  CaseStatusBreakdown,
  CaseTypeBreakdown,
  UpcomingDeadline,
} from "../../../../src/services/types";
import { STATUS_COLORS } from "../../../../src/services/types";

const screenWidth = Dimensions.get("window").width;

const STATUS_PIE_COLORS: Record<string, string> = {
  new: STATUS_COLORS.new.text,
  active: STATUS_COLORS.active.text,
  pending: STATUS_COLORS.pending.text,
  closed: STATUS_COLORS.closed.text,
  archived: STATUS_COLORS.archived.text,
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  active: "Active",
  pending: "Pending",
  closed: "Closed",
  archived: "Archived",
};

const SECTION_CARD = {
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
} as const;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

export default function CaseManagementDashboard() {
  const { t } = useTranslation("reports");
  const services = useServices();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statusBreakdown, setStatusBreakdown] = useState<
    CaseStatusBreakdown[]
  >([]);
  const [typeBreakdown, setTypeBreakdown] = useState<CaseTypeBreakdown[]>([]);
  const [deadlines, setDeadlines] = useState<UpcomingDeadline[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);

      Promise.all([
        services.reports.getCaseStatusBreakdown(),
        services.reports.getCaseTypeBreakdown(),
        services.reports.getUpcomingDeadlines(30),
      ]).then(([statuses, types, upcoming]) => {
        if (cancelled) return;
        setStatusBreakdown(statuses);
        setTypeBreakdown(types);
        setDeadlines(upcoming.slice(0, 10));
        setLoading(false);
      });

      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (loading) {
    return (
      <ScreenContainer>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
        </View>
      </ScreenContainer>
    );
  }

  const activeCases =
    statusBreakdown.find((s) => s.status === "active")?.count ?? 0;
  const totalCases = statusBreakdown.reduce((sum, s) => sum + s.count, 0);

  const pieData = statusBreakdown
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: STATUS_LABELS[s.status] || s.status,
      count: s.count,
      color: STATUS_PIE_COLORS[s.status] || "#999999",
      legendFontColor: colors.navy.DEFAULT,
      legendFontSize: 12,
    }));

  const TYPE_LABELS: Record<string, string> = {
    civil: "Civil",
    criminal: "Criminal",
    family: "Family",
    corporate: "Corporate",
  };

  const barData = {
    labels: typeBreakdown.map((tb) => TYPE_LABELS[tb.caseType] || tb.caseType),
    datasets: [
      {
        data:
          typeBreakdown.length > 0
            ? typeBreakdown.map((tb) => tb.count)
            : [0],
      },
    ],
  };

  const chartWidth = screenWidth - 48;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              ...SECTION_CARD,
              flex: 1,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#8E8E93",
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              {t("cases.activeCases")}
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: colors.golden.DEFAULT,
                textAlign: "center",
              }}
            >
              {activeCases}
            </Text>
          </View>
          <View
            style={{
              ...SECTION_CARD,
              flex: 1,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#8E8E93",
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              {t("cases.totalCases")}
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: colors.navy.DEFAULT,
                textAlign: "center",
              }}
            >
              {totalCases}
            </Text>
          </View>
        </View>

        {/* Case Status Breakdown Pie Chart */}
        <View style={{ ...SECTION_CARD, marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.navy.DEFAULT,
              marginBottom: 12,
            }}
          >
            {t("cases.statusBreakdown")}
          </Text>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={chartWidth}
              height={200}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
              chartConfig={{
                color: () => colors.navy.DEFAULT,
              }}
              style={{ borderRadius: 8 }}
            />
          ) : (
            <Text style={{ color: "#8E8E93", textAlign: "center" }}>
              No case data
            </Text>
          )}
        </View>

        {/* Case Type Distribution Bar Chart */}
        <View style={{ ...SECTION_CARD, marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.navy.DEFAULT,
              marginBottom: 12,
            }}
          >
            {t("cases.typeBreakdown")}
          </Text>
          <BarChart
            data={barData}
            width={chartWidth}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero
            chartConfig={{
              backgroundColor: "#FFF9F0",
              backgroundGradientFrom: "#FFF9F0",
              backgroundGradientTo: "#FFF9F0",
              decimalPlaces: 0,
              color: () => colors.golden.DEFAULT,
              labelColor: () => colors.navy.DEFAULT,
              barPercentage: 0.6,
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: "#E8E8E8",
              },
            }}
            style={{ borderRadius: 8 }}
          />
        </View>

        {/* Upcoming Deadlines */}
        <View style={SECTION_CARD}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.navy.DEFAULT,
                flex: 1,
              }}
            >
              {t("cases.upcomingDeadlines")}
            </Text>
            {deadlines.length > 0 && (
              <View
                style={{
                  backgroundColor: "#FFEBEE",
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#C62828",
                  }}
                >
                  {deadlines.length}
                </Text>
              </View>
            )}
          </View>

          {deadlines.length === 0 ? (
            <Text
              style={{
                color: "#8E8E93",
                textAlign: "center",
                paddingVertical: 16,
              }}
            >
              {t("cases.noDeadlines")}
            </Text>
          ) : (
            deadlines.map((item, index) => (
              <Pressable
                key={item.eventId}
                onPress={() => {
                  if (item.caseId) {
                    router.push(`/(tabs)/cases/${item.caseId}` as any);
                  }
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  paddingVertical: 12,
                  borderTopWidth: index > 0 ? 1 : 0,
                  borderTopColor: "#F0F0F0",
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#C62828",
                    marginTop: 5,
                    marginRight: 12,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "500",
                      color: colors.navy.DEFAULT,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#C62828",
                      fontWeight: "500",
                      marginTop: 2,
                    }}
                  >
                    {formatDate(item.date)}
                  </Text>
                  {item.caseName && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#8E8E93",
                        marginTop: 2,
                      }}
                    >
                      {item.caseName}
                    </Text>
                  )}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#CCCCCC"
                  style={{ marginTop: 3 }}
                />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

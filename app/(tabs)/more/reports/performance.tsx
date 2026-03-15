import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "expo-router";
import { BarChart } from "react-native-chart-kit";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenContainer } from "../../../../src/components/ui";
import { useServices } from "../../../../src/hooks/useServices";
import { colors } from "../../../../src/theme/tokens";
import type { PerformanceMetrics } from "../../../../src/services/types";

const screenWidth = Dimensions.get("window").width;

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

export default function PerformanceDashboard() {
  const { t } = useTranslation("reports");
  const services = useServices();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);

      services.reports.getPerformanceMetrics().then((data) => {
        if (cancelled) return;
        setMetrics(data);
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

  if (!metrics) {
    return (
      <ScreenContainer>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "#8E8E93", fontSize: 16 }}>
            No performance data
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const closurePercent = Math.round(metrics.closureRate);

  const lawyerLabels = metrics.casesByLawyer.map((l) => {
    const firstName = l.lawyerName.split(" ")[0];
    return firstName.length > 8 ? firstName.substring(0, 8) : firstName;
  });

  const barData = {
    labels: lawyerLabels.length > 0 ? lawyerLabels : ["N/A"],
    datasets: [
      {
        data:
          metrics.casesByLawyer.length > 0
            ? metrics.casesByLawyer.map((l) => l.caseCount)
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
        {/* Closure Rate Card */}
        <View style={{ ...SECTION_CARD, marginBottom: 16, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 48,
              fontWeight: "700",
              color: colors.golden.DEFAULT,
              textAlign: "center",
            }}
          >
            {closurePercent}%
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#8E8E93",
              marginTop: 4,
              textAlign: "center",
            }}
          >
            {t("performance.closureRate")}
          </Text>

          {/* Progress Bar */}
          <View
            style={{
              width: "100%",
              height: 10,
              backgroundColor: "#E8E8E8",
              borderRadius: 5,
              marginTop: 16,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${closurePercent}%`,
                height: "100%",
                backgroundColor: colors.golden.DEFAULT,
                borderRadius: 5,
              }}
            />
          </View>

          <Text
            style={{
              fontSize: 13,
              color: "#8E8E93",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {metrics.closedCases} of {metrics.totalCases}{" "}
            {t("performance.cases")}
          </Text>
        </View>

        {/* Key Metrics Row */}
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
            <Ionicons
              name="checkmark-circle-outline"
              size={28}
              color="#2E7D32"
              style={{ marginBottom: 6 }}
            />
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: "#2E7D32",
              }}
            >
              {metrics.closedCases}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#8E8E93",
                marginTop: 4,
                textAlign: "center",
              }}
            >
              {t("performance.closedCases")}
            </Text>
          </View>
          <View
            style={{
              ...SECTION_CARD,
              flex: 1,
              alignItems: "center",
            }}
          >
            <Ionicons
              name="time-outline"
              size={28}
              color={colors.navy.DEFAULT}
              style={{ marginBottom: 6 }}
            />
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: colors.navy.DEFAULT,
              }}
            >
              {metrics.averageCaseDuration}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#8E8E93",
                marginTop: 4,
                textAlign: "center",
              }}
            >
              {t("performance.avgDuration")} ({t("performance.days")})
            </Text>
          </View>
        </View>

        {/* Workload Distribution Bar Chart */}
        <View style={SECTION_CARD}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.navy.DEFAULT,
              marginBottom: 12,
            }}
          >
            {t("performance.workload")}
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
      </ScrollView>
    </ScreenContainer>
  );
}

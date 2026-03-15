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
import { BarChart, PieChart } from "react-native-chart-kit";
import { ScreenContainer } from "../../../../src/components/ui";
import { useServices } from "../../../../src/hooks/useServices";
import { colors } from "../../../../src/theme/tokens";
import type {
  FinancialSummary,
  MonthlyRevenue,
  RevenueByMode,
  TopClient,
} from "../../../../src/services/types";

const screenWidth = Dimensions.get("window").width;

function formatRSD(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted} RSD`;
}

const PIE_COLORS: Record<string, string> = {
  tariff: "#1B2B4B",
  hourly: "#C8A951",
  "flat-fee": "#2E7D32",
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

export default function FinancialOverviewScreen() {
  const { t } = useTranslation("reports");
  const services = useServices();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRevenue[]>([]);
  const [byMode, setByMode] = useState<RevenueByMode[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);

      Promise.all([
        services.reports.getFinancialSummary(),
        services.reports.getMonthlyRevenue(),
        services.reports.getRevenueByMode(),
        services.reports.getTopClients(5),
      ]).then(([s, m, mode, clients]) => {
        if (cancelled) return;
        setSummary(s);
        setMonthly(m);
        setByMode(mode);
        setTopClients(clients);
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

  if (!summary) {
    return (
      <ScreenContainer>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "#8E8E93", fontSize: 16 }}>
            {t("financial.noData")}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const barData = {
    labels: monthly.map((m) => m.label),
    datasets: [
      {
        data: monthly.map((m) => m.revenue / 1000),
      },
    ],
  };

  const pieData = byMode.map((item) => ({
    name: t(`billingMode.${item.mode}`),
    amount: item.total,
    color: PIE_COLORS[item.mode] || "#999999",
    legendFontColor: colors.navy.DEFAULT,
    legendFontSize: 12,
  }));

  const chartWidth = screenWidth - 48;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards 2x2 */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <MetricCard
            label={t("financial.totalRevenue")}
            value={formatRSD(summary.totalRevenue)}
            valueColor={colors.golden.DEFAULT}
          />
          <MetricCard
            label={t("financial.totalCollected")}
            value={formatRSD(summary.totalCollected)}
            valueColor="#2E7D32"
          />
          <MetricCard
            label={t("financial.totalOutstanding")}
            value={formatRSD(summary.totalOutstanding)}
            valueColor="#E65100"
          />
          <MetricCard
            label={t("financial.overdueInvoices")}
            value={String(summary.overdueCount)}
            valueColor="#C62828"
          />
        </View>

        {/* Monthly Revenue Bar Chart */}
        <View style={{ ...SECTION_CARD, marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.navy.DEFAULT,
              marginBottom: 12,
            }}
          >
            {t("financial.monthlyRevenue")}
          </Text>
          <BarChart
            data={barData}
            width={chartWidth}
            height={220}
            yAxisLabel=""
            yAxisSuffix="k"
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

        {/* Revenue by Billing Mode Pie Chart */}
        <View style={{ ...SECTION_CARD, marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.navy.DEFAULT,
              marginBottom: 12,
            }}
          >
            {t("financial.revenueByMode")}
          </Text>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={chartWidth}
              height={200}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute={false}
              chartConfig={{
                color: () => colors.navy.DEFAULT,
              }}
              style={{ borderRadius: 8 }}
            />
          ) : (
            <Text style={{ color: "#8E8E93", textAlign: "center" }}>
              {t("financial.noData")}
            </Text>
          )}
        </View>

        {/* Top Clients */}
        <View style={SECTION_CARD}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.navy.DEFAULT,
              marginBottom: 12,
            }}
          >
            {t("financial.topClients")}
          </Text>
          {topClients.map((client, index) => (
            <View
              key={client.clientId}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: "#F0F0F0",
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "#FDF8EC",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: colors.golden.DEFAULT,
                  }}
                >
                  {index + 1}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: colors.navy.DEFAULT,
                  }}
                >
                  {client.clientName}
                </Text>
                <Text style={{ fontSize: 12, color: "#8E8E93", marginTop: 2 }}>
                  {client.invoiceCount} {t("financial.invoices")}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.navy.DEFAULT,
                }}
              >
                {formatRSD(client.totalBilled)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function MetricCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <View
      style={{
        ...SECTION_CARD,
        width: (screenWidth - 44) / 2,
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
        {label}
      </Text>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: valueColor,
          textAlign: "center",
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

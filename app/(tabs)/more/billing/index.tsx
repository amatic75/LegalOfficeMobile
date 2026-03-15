import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useServices } from "../../../../src/hooks/useServices";
import { colors } from "../../../../src/theme/tokens";
import type { Invoice, InvoiceStatus } from "../../../../src/services/types";
import { INVOICE_STATUS_COLORS } from "../../../../src/services/types";

function formatRSD(amount: number): string {
  const parts = amount.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intPart},${parts[1]} RSD`;
}

const STATUS_FILTERS: (InvoiceStatus | "all")[] = [
  "all",
  "draft",
  "sent",
  "paid",
  "overdue",
  "partially-paid",
];

export default function InvoiceListScreen() {
  const { t } = useTranslation("billing");
  const router = useRouter();
  const services = useServices();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">(
    "all"
  );
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([
        services.billing.getInvoices(),
        services.billing.getOutstandingByClient(),
      ]).then(([data, byClient]) => {
        if (active) {
          setInvoices(data);
          const total = byClient.reduce((sum, c) => sum + c.totalOutstanding, 0);
          setTotalOutstanding(total);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const filtered =
    statusFilter === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === statusFilter);

  const getStatusLabel = (status: InvoiceStatus | "all") => {
    if (status === "all") return t("filter.allStatuses");
    return t(`status.${status}`);
  };

  const renderItem = ({ item }: { item: Invoice }) => {
    const statusColor = INVOICE_STATUS_COLORS[item.status];
    return (
      <Pressable
        onPress={() => router.push(`/(tabs)/more/billing/${item.id}` as any)}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#F0F0F0",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
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
              fontSize: 15,
              fontWeight: "700",
              color: colors.navy.DEFAULT,
            }}
          >
            {item.invoiceNumber}
          </Text>
          <View
            style={{
              backgroundColor: statusColor.bg,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text
              style={{ fontSize: 12, fontWeight: "600", color: statusColor.text }}
            >
              {t(`status.${item.status}`)}
            </Text>
          </View>
        </View>

        <Text
          style={{ fontSize: 14, color: colors.navy.DEFAULT, marginBottom: 4 }}
          numberOfLines={1}
        >
          {item.caseName}
        </Text>
        <Text style={{ fontSize: 13, color: "#8899AA", marginBottom: 8 }}>
          {item.clientName}
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.golden.DEFAULT }}>
            {formatRSD(item.total)}
          </Text>
          <Text style={{ fontSize: 12, color: "#8899AA" }}>
            {item.issuedDate}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFF9F0",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF9F0" }}>
      {/* Status filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 52, paddingVertical: 8, paddingHorizontal: 12 }}
        contentContainerStyle={{ gap: 8, alignItems: "center" }}
      >
        {STATUS_FILTERS.map((status) => {
          const isActive = statusFilter === status;
          return (
            <Pressable
              key={status}
              onPress={() => setStatusFilter(status)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isActive ? colors.golden.DEFAULT : "#FFFFFF",
                borderWidth: 1,
                borderColor: isActive ? colors.golden.DEFAULT : "#E0E0E0",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? "700" : "500",
                  color: isActive ? "#FFFFFF" : colors.navy.DEFAULT,
                }}
              >
                {getStatusLabel(status)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Outstanding balances card */}
      <Pressable
        onPress={() => router.push("/(tabs)/more/billing/balances" as any)}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 14,
          marginHorizontal: 16,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: "#FFF3E0",
          borderLeftWidth: 4,
          borderLeftColor: colors.golden.DEFAULT,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <Ionicons
          name="wallet-outline"
          size={24}
          color={colors.golden.DEFAULT}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.navy.DEFAULT,
            }}
          >
            {t("balance.title")}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: totalOutstanding > 0 ? "#C62828" : "#2E7D32",
              marginTop: 2,
            }}
          >
            {formatRSD(totalOutstanding)}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color="#8899AA"
        />
      </Pressable>

      {/* Invoice list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 60,
            }}
          >
            <Ionicons
              name="receipt-outline"
              size={48}
              color="#CCCCCC"
            />
            <Text
              style={{
                fontSize: 16,
                color: "#8899AA",
                marginTop: 12,
              }}
            >
              {invoices.length === 0
                ? t("list.emptyState")
                : t("list.noResults")}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/(tabs)/more/billing/new" as any)}
        style={{
          position: "absolute",
          right: 20,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.golden.DEFAULT,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

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
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useServices } from "../../../../src/hooks/useServices";
import { useReturnBack } from "../../../../src/hooks/useReturnBack";
import { colors } from "../../../../src/theme/tokens";
import type { Invoice, InvoiceStatus, Currency } from "../../../../src/services/types";
import { INVOICE_STATUS_COLORS } from "../../../../src/services/types";

function formatAmount(amount: number, currency: Currency = "RSD"): string {
  const parts = amount.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intPart},${parts[1]} ${currency}`;
}
const formatRSD = (amount: number) => formatAmount(amount, "RSD");

const STATUS_FILTERS: (InvoiceStatus | "all")[] = [
  "all",
  "draft",
  "sent",
  "paid",
  "overdue",
  "partially-paid",
];

// Payment-status filter — derived at runtime from invoice.paidAmount/total so
// the user can narrow the list independently of the workflow status (e.g. show
// every "sent" invoice that hasn't been paid yet).
type PaymentFilter = "all" | "paid" | "partial" | "unpaid";
const PAYMENT_FILTERS: PaymentFilter[] = ["all", "paid", "partial", "unpaid"];

function paymentStateOf(inv: Invoice): "paid" | "partial" | "unpaid" {
  if (inv.paidAmount >= inv.total) return "paid";
  if (inv.paidAmount > 0) return "partial";
  return "unpaid";
}

export default function InvoiceListScreen() {
  const { t } = useTranslation("billing");
  const router = useRouter();
  const services = useServices();
  // Optional `?caseId=...` / `?clientId=...` deep-link narrows the list. The
  // `?returnTo` wires a header back arrow that lands on the originating screen.
  const { caseId: caseIdFilter, clientId: clientIdFilter } = useLocalSearchParams<{ caseId?: string; clientId?: string }>();
  const { goBack, returnTo } = useReturnBack();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">(
    "all"
  );
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  // Per-currency outstanding totals so RSD / EUR / USD / CHF stay in their own
  // buckets — combining them would be mathematically wrong without an FX rate.
  const [outstandingByCurrency, setOutstandingByCurrency] = useState<Partial<Record<Currency, number>>>({});

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
          // Aggregate the per-currency totals across every client. We never
          // collapse currencies into one number — each bucket renders on its
          // own line in the card.
          const totals: Partial<Record<Currency, number>> = {};
          for (const c of byClient) {
            for (const [cur, amt] of Object.entries(c.outstandingByCurrency) as [Currency, number][]) {
              if (!amt) continue;
              totals[cur] = (totals[cur] ?? 0) + amt;
            }
          }
          setOutstandingByCurrency(totals);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const filtered = invoices.filter((inv) => {
    if (caseIdFilter && inv.caseId !== caseIdFilter) return false;
    if (clientIdFilter && inv.clientId !== clientIdFilter) return false;
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (paymentFilter !== "all" && paymentStateOf(inv) !== paymentFilter) return false;
    return true;
  });

  const getStatusLabel = (status: InvoiceStatus | "all") => {
    if (status === "all") return t("filter.allStatuses");
    return t(`status.${status}`);
  };

  const getPaymentLabel = (p: PaymentFilter) => {
    switch (p) {
      case "all": return t("filter.allPayments");
      case "paid": return t("filter.paymentPaid");
      case "partial": return t("filter.paymentPartial");
      case "unpaid": return t("filter.paymentUnpaid");
    }
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
      {returnTo && (
        <Stack.Screen
          options={{
            headerLeft: () => (
              <Pressable onPress={goBack} style={{ marginLeft: 4, padding: 4 }}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>
            ),
          }}
        />
      )}
      {/* Status filter chips — `flexGrow: 0` keeps the ScrollView from
          stretching vertically; the active "Svi statusi" chip used to get
          clipped because of a too-tight maxHeight + bold-weight reflow. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0, marginVertical: 8 }}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8, alignItems: "center" }}
      >
        {STATUS_FILTERS.map((status) => {
          const isActive = statusFilter === status;
          return (
            <Pressable
              key={status}
              onPress={() => setStatusFilter(status)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 16,
                backgroundColor: isActive ? colors.golden.DEFAULT : "#FFFFFF",
                borderWidth: 1,
                borderColor: isActive ? colors.golden.DEFAULT : "#E0E0E0",
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: isActive ? "#FFFFFF" : colors.navy.DEFAULT,
                }}
              >
                {getStatusLabel(status)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Payment-status filter chips — narrows the list by how much has been
          collected so far (independent of the workflow status above). */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0, marginBottom: 8 }}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8, alignItems: "center" }}
      >
        {PAYMENT_FILTERS.map((p) => {
          const isActive = paymentFilter === p;
          return (
            <Pressable
              key={p}
              onPress={() => setPaymentFilter(p)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 16,
                backgroundColor: isActive ? colors.navy.DEFAULT : "#FFFFFF",
                borderWidth: 1,
                borderColor: isActive ? colors.navy.DEFAULT : "#E0E0E0",
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: isActive ? "#FFFFFF" : colors.navy.DEFAULT,
                }}
              >
                {getPaymentLabel(p)}
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
          {(() => {
            const entries = (Object.entries(outstandingByCurrency) as [Currency, number][])
              .filter(([, amt]) => (amt ?? 0) > 0);
            if (entries.length === 0) {
              return (
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#2E7D32", marginTop: 2 }}>
                  {formatRSD(0)}
                </Text>
              );
            }
            return entries.map(([cur, amt]) => (
              <Text
                key={cur}
                style={{ fontSize: 16, fontWeight: "700", color: "#C62828", marginTop: 2 }}
              >
                {formatAmount(amt, cur)}
              </Text>
            ));
          })()}
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

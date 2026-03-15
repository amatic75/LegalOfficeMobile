import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useServices } from "../../../../src/hooks/useServices";
import { colors } from "../../../../src/theme/tokens";
import type { Invoice } from "../../../../src/services/types";
import { INVOICE_STATUS_COLORS } from "../../../../src/services/types";

function formatRSD(amount: number): string {
  const parts = amount.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intPart},${parts[1]} RSD`;
}

const SECTION_CARD = {
  backgroundColor: "#FFFFFF",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: "#FFF3E0",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
} as const;

const BILLING_MODE_COLORS: Record<string, { bg: string; text: string }> = {
  tariff: { bg: "#E8EAF6", text: "#283593" },
  hourly: { bg: "#E0F7FA", text: "#00695C" },
  "flat-fee": { bg: "#FCE4EC", text: "#AD1457" },
};

export default function InvoiceDetailScreen() {
  const { t } = useTranslation("billing");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const services = useServices();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    services.billing.getInvoiceById(id).then((inv) => {
      setInvoice(inv);
      setLoading(false);
    });
  }, [id]);

  const handleStatusChange = async (newStatus: "sent" | "overdue") => {
    if (!invoice) return;
    const updated = await services.billing.updateInvoiceStatus(
      invoice.id,
      newStatus
    );
    if (updated) setInvoice(updated);
  };

  const handleRecordPayment = () => {
    Alert.alert(
      t("payment.record"),
      "Payment recording available in next update."
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

  if (!invoice) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFF9F0",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 16, color: "#8899AA" }}>
          {t("list.emptyState")}
        </Text>
      </View>
    );
  }

  const statusColor = INVOICE_STATUS_COLORS[invoice.status];
  const modeColor =
    BILLING_MODE_COLORS[invoice.billingMode] || BILLING_MODE_COLORS.tariff;
  const remaining = invoice.total - invoice.paidAmount;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FFF9F0" }}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Header section */}
      <View style={SECTION_CARD}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: colors.navy.DEFAULT,
            }}
          >
            {invoice.invoiceNumber}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View
            style={{
              backgroundColor: statusColor.bg,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: statusColor.text,
              }}
            >
              {t(`status.${invoice.status}`)}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: modeColor.bg,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: modeColor.text,
              }}
            >
              {t(`mode.${invoice.billingMode}`)}
            </Text>
          </View>
        </View>
      </View>

      {/* Info section */}
      <View style={SECTION_CARD}>
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 12, color: "#8899AA", marginBottom: 2 }}>
            {t("detail.case")}
          </Text>
          <Pressable
            onPress={() =>
              router.push(`/(tabs)/cases/${invoice.caseId}` as any)
            }
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: colors.golden.DEFAULT,
              }}
            >
              {invoice.caseName}
            </Text>
          </Pressable>
        </View>
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 12, color: "#8899AA", marginBottom: 2 }}>
            {t("detail.client")}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: colors.navy.DEFAULT,
            }}
          >
            {invoice.clientName}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ fontSize: 12, color: "#8899AA", marginBottom: 2 }}>
              {t("detail.issuedDate")}
            </Text>
            <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>
              {invoice.issuedDate}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 12, color: "#8899AA", marginBottom: 2 }}>
              {t("detail.dueDate")}
            </Text>
            <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>
              {invoice.dueDate}
            </Text>
          </View>
        </View>
      </View>

      {/* Line items section */}
      <View style={SECTION_CARD}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: colors.navy.DEFAULT,
            marginBottom: 12,
          }}
        >
          {t("detail.lineItems")}
        </Text>
        {invoice.lineItems.map((li) => (
          <View
            key={li.id}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#F5F5F5",
            }}
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.navy.DEFAULT,
                }}
                numberOfLines={2}
              >
                {li.description}
              </Text>
              {li.quantity != null && li.unitPrice != null && (
                <Text
                  style={{
                    fontSize: 11,
                    color: "#8899AA",
                    marginTop: 2,
                  }}
                >
                  {li.quantity}h x {formatRSD(li.unitPrice)}
                </Text>
              )}
              {li.type === "expense" && (
                <Text
                  style={{
                    fontSize: 11,
                    color: "#8899AA",
                    marginTop: 2,
                  }}
                >
                  Trosak
                </Text>
              )}
            </View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.navy.DEFAULT,
              }}
            >
              {formatRSD(li.amount)}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals section */}
      <View style={SECTION_CARD}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <Text style={{ fontSize: 14, color: "#8899AA" }}>
            {t("detail.subtotal")}
          </Text>
          <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>
            {formatRSD(invoice.subtotal)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <Text style={{ fontSize: 14, color: "#8899AA" }}>
            {t("detail.tax")}
          </Text>
          <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>
            {formatRSD(invoice.tax)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: "#E0E0E0",
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.navy.DEFAULT,
            }}
          >
            {t("detail.total")}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.navy.DEFAULT,
            }}
          >
            {formatRSD(invoice.total)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <Text style={{ fontSize: 14, color: "#2E7D32" }}>
            {t("detail.paidAmount")}
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#2E7D32",
            }}
          >
            {formatRSD(invoice.paidAmount)}
          </Text>
        </View>
        {remaining > 0 && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 14, color: "#C62828" }}>
              {t("detail.remainingBalance")}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#C62828",
              }}
            >
              {formatRSD(remaining)}
            </Text>
          </View>
        )}
      </View>

      {/* Payments section */}
      <View style={SECTION_CARD}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: colors.navy.DEFAULT,
            marginBottom: 12,
          }}
        >
          {t("detail.payments")}
        </Text>
        {invoice.payments.length === 0 ? (
          <Text
            style={{
              fontSize: 13,
              color: "#8899AA",
              fontStyle: "italic",
              marginBottom: 8,
            }}
          >
            {t("detail.noPayments")}
          </Text>
        ) : (
          invoice.payments.map((pay) => (
            <View
              key={pay.id}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: "#F5F5F5",
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#2E7D32",
                  }}
                >
                  {formatRSD(pay.amount)}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: "#8899AA",
                    marginTop: 2,
                  }}
                >
                  {pay.date}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "#E8F5E9",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: "#2E7D32",
                  }}
                >
                  {t(`payment.${pay.method === "bank-transfer" ? "bankTransfer" : pay.method}`)}
                </Text>
              </View>
            </View>
          ))
        )}
        <Pressable
          onPress={handleRecordPayment}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.golden[50],
            borderRadius: 8,
            padding: 12,
            marginTop: 12,
            borderWidth: 1,
            borderColor: colors.golden.DEFAULT,
          }}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={colors.golden.DEFAULT}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.golden.DEFAULT,
              marginLeft: 6,
            }}
          >
            {t("payment.record")}
          </Text>
        </Pressable>
      </View>

      {/* Notes section */}
      {invoice.notes && (
        <View style={SECTION_CARD}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: colors.navy.DEFAULT,
              marginBottom: 8,
            }}
          >
            {t("detail.notes")}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.navy.DEFAULT,
              lineHeight: 20,
            }}
          >
            {invoice.notes}
          </Text>
        </View>
      )}

      {/* Status actions */}
      {invoice.status === "draft" && (
        <Pressable
          onPress={() => handleStatusChange("sent")}
          style={{
            backgroundColor: "#1565C0",
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text
            style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}
          >
            {t("actions.markSent")}
          </Text>
        </Pressable>
      )}
      {invoice.status === "sent" && (
        <Pressable
          onPress={() => handleStatusChange("overdue")}
          style={{
            backgroundColor: "#C62828",
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text
            style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}
          >
            {t("actions.markOverdue")}
          </Text>
        </Pressable>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

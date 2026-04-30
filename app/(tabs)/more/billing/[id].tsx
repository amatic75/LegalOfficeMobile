import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useServices } from "../../../../src/hooks/useServices";
import { useReturnBack } from "../../../../src/hooks/useReturnBack";
import { colors } from "../../../../src/theme/tokens";
import type { Invoice } from "../../../../src/services/types";
import { INVOICE_STATUS_COLORS } from "../../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

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

const PAYMENT_METHOD_OPTIONS = [
  { key: "cash" as const, icon: "cash-outline" as const, color: "#2E7D32", bg: "#E8F5E9" },
  { key: "bank-transfer" as const, icon: "card-outline" as const, color: "#1565C0", bg: "#E3F2FD" },
  { key: "card" as const, icon: "wallet-outline" as const, color: "#6A1B9A", bg: "#F3E5F5" },
];

const PAYMENT_METHOD_BADGE: Record<string, { bg: string; text: string }> = {
  cash: { bg: "#E8F5E9", text: "#2E7D32" },
  "bank-transfer": { bg: "#E3F2FD", text: "#1565C0" },
  card: { bg: "#F3E5F5", text: "#6A1B9A" },
};

export default function InvoiceDetailScreen() {
  const { t } = useTranslation("billing");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { goBack, returnTo } = useReturnBack();
  const services = useServices();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank-transfer" | "card">("cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const loadInvoice = async () => {
    if (!id) return;
    const inv = await services.billing.getInvoiceById(id);
    setInvoice(inv);
    setLoading(false);
  };

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const handleStatusChange = async (newStatus: "sent" | "overdue") => {
    if (!invoice) return;
    const updated = await services.billing.updateInvoiceStatus(
      invoice.id,
      newStatus
    );
    if (updated) setInvoice(updated);
  };

  const remaining = invoice ? invoice.total - invoice.paidAmount : 0;

  const openPaymentModal = () => {
    setPaymentAmount(remaining.toFixed(2));
    setPaymentMethod("cash");
    setPaymentNote("");
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentAmount("");
    setPaymentNote("");
  };

  const handleSavePayment = async () => {
    if (!invoice) return;
    const parsed = parseFloat(paymentAmount.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0 || parsed > remaining) return;

    setSavingPayment(true);
    const today = new Date().toISOString().split("T")[0];
    await services.billing.addPayment(invoice.id, {
      invoiceId: invoice.id,
      amount: parsed,
      date: today,
      method: paymentMethod,
      note: paymentNote || undefined,
    });

    // Refresh invoice data
    const updated = await services.billing.getInvoiceById(invoice.id);
    if (updated) setInvoice(updated);
    setSavingPayment(false);
    closePaymentModal();
  };

  const isPaymentValid = () => {
    const parsed = parseFloat(paymentAmount.replace(",", "."));
    return !isNaN(parsed) && parsed > 0 && parsed <= remaining;
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
  const canRecordPayment = invoice.status !== "paid" && invoice.status !== "draft";

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF9F0" }}>
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
      <ScrollView
        style={{ flex: 1 }}
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
                router.push({
                  pathname: "/(tabs)/cases/[id]",
                  params: { id: invoice.caseId, returnTo: `/(tabs)/more/billing/${invoice.id}` },
                })
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
            invoice.payments.map((pay) => {
              const badge = PAYMENT_METHOD_BADGE[pay.method] || PAYMENT_METHOD_BADGE.cash;
              return (
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
                  <View style={{ flex: 1 }}>
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
                    {pay.note ? (
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#8899AA",
                          marginTop: 2,
                          fontStyle: "italic",
                        }}
                        numberOfLines={1}
                      >
                        {pay.note}
                      </Text>
                    ) : null}
                  </View>
                  <View
                    style={{
                      backgroundColor: badge.bg,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: badge.text,
                      }}
                    >
                      {t(`payment.${pay.method === "bank-transfer" ? "bankTransfer" : pay.method}`)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
          {canRecordPayment && (
            <Pressable
              onPress={openPaymentModal}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.golden.DEFAULT,
                borderRadius: 8,
                padding: 14,
                marginTop: 12,
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color="#FFFFFF"
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#FFFFFF",
                  marginLeft: 6,
                }}
              >
                {t("payment.record")}
              </Text>
            </Pressable>
          )}
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

      {/* Payment Recording Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent
        onRequestClose={closePaymentModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 24,
                paddingBottom: 40,
              }}
            >
              {/* Modal title */}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: colors.navy.DEFAULT,
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                {t("payment.record")}
              </Text>

              {/* Amount input */}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.navy.DEFAULT,
                  marginBottom: 6,
                }}
              >
                {t("payment.amount")}
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#E0E0E0",
                  borderRadius: 10,
                  padding: 14,
                  fontSize: 16,
                  color: colors.navy.DEFAULT,
                  backgroundColor: "#FAFAFA",
                  marginBottom: 4,
                }}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="decimal-pad"
                placeholder={formatRSD(remaining)}
                placeholderTextColor="#BBBBBB"
              />
              <Text
                style={{
                  fontSize: 11,
                  color: "#8899AA",
                  marginBottom: 16,
                }}
              >
                {t("detail.remainingBalance")}: {formatRSD(remaining)}
              </Text>

              {/* Payment method selector */}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.navy.DEFAULT,
                  marginBottom: 8,
                }}
              >
                {t("payment.method")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {PAYMENT_METHOD_OPTIONS.map((opt) => {
                  const isSelected = paymentMethod === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => setPaymentMethod(opt.key)}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 14,
                        borderRadius: 10,
                        backgroundColor: isSelected ? colors.golden[50] : "#F5F5F5",
                        borderWidth: 2,
                        borderColor: isSelected ? colors.golden.DEFAULT : "#E0E0E0",
                      }}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={22}
                        color={isSelected ? colors.golden.DEFAULT : "#8899AA"}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: isSelected ? "700" : "500",
                          color: isSelected ? colors.golden.DEFAULT : "#8899AA",
                          marginTop: 4,
                        }}
                      >
                        {t(`payment.${opt.key === "bank-transfer" ? "bankTransfer" : opt.key}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Note input */}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.navy.DEFAULT,
                  marginBottom: 6,
                }}
              >
                {t("payment.note")}
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#E0E0E0",
                  borderRadius: 10,
                  padding: 14,
                  fontSize: 14,
                  color: colors.navy.DEFAULT,
                  backgroundColor: "#FAFAFA",
                  marginBottom: 24,
                }}
                value={paymentNote}
                onChangeText={setPaymentNote}
                placeholder={t("payment.note")}
                placeholderTextColor="#BBBBBB"
              />

              {/* Action buttons */}
              <Pressable
                onPress={handleSavePayment}
                disabled={!isPaymentValid() || savingPayment}
                style={{
                  backgroundColor: isPaymentValid() ? colors.golden.DEFAULT : "#CCCCCC",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                {savingPayment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: "#FFFFFF",
                    }}
                  >
                    {t("payment.save")}
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={closePaymentModal}
                style={{
                  padding: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: "#8899AA",
                    fontWeight: "500",
                  }}
                >
                  {t("payment.cancel")}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useServices } from "../../../../src/hooks/useServices";
import { colors } from "../../../../src/theme/tokens";
import type {
  CaseSummary,
  BillingMode,
  TimeEntry,
  Expense,
  InvoiceLineItem,
} from "../../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function formatRSD(amount: number): string {
  const parts = amount.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intPart},${parts[1]}`;
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

const MODE_CONFIG: {
  mode: BillingMode;
  icon: IoniconsName;
  labelKey: string;
}[] = [
  { mode: "tariff", icon: "receipt-outline", labelKey: "mode.tariff" },
  { mode: "hourly", icon: "time-outline", labelKey: "mode.hourly" },
  { mode: "flat-fee", icon: "cash-outline", labelKey: "mode.flat-fee" },
];

export default function NewInvoiceScreen() {
  const { t } = useTranslation("billing");
  const router = useRouter();
  const services = useServices();

  const [allCases, setAllCases] = useState<CaseSummary[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseSummary | null>(null);
  const [billingMode, setBillingMode] = useState<BillingMode | null>(null);
  const [hourlyRate, setHourlyRate] = useState("15000");
  const [tariffAmount, setTariffAmount] = useState("");
  const [flatFeeAmount, setFlatFeeAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [caseExpenses, setCaseExpenses] = useState<Expense[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    services.cases.getCases().then(setAllCases);
  }, []);

  useEffect(() => {
    if (!selectedCase) {
      setTimeEntries([]);
      setCaseExpenses([]);
      return;
    }
    setLoadingEntries(true);
    Promise.all([
      services.timeEntries.getTimeEntriesByCaseId(selectedCase.id),
      services.expenses.getExpensesByCaseId(selectedCase.id),
    ]).then(([te, exp]) => {
      setTimeEntries(te.filter((e) => e.billable));
      setCaseExpenses(exp);
      setLoadingEntries(false);
    });
  }, [selectedCase?.id]);

  const rate = parseFloat(hourlyRate) || 0;
  const tariff = parseFloat(tariffAmount) || 0;
  const flatFee = parseFloat(flatFeeAmount) || 0;

  // Build line items based on billing mode
  const lineItems: InvoiceLineItem[] = [];
  if (billingMode === "hourly") {
    timeEntries.forEach((te, i) => {
      lineItems.push({
        id: `new-li-te-${i}`,
        type: "time-entry",
        referenceId: te.id,
        description: te.description,
        quantity: te.hours,
        unitPrice: rate,
        amount: te.hours * rate,
      });
    });
  } else if (billingMode === "tariff" && tariff > 0) {
    lineItems.push({
      id: "new-li-tariff",
      type: "time-entry",
      referenceId: "tariff",
      description: t("mode.tariff"),
      amount: tariff,
    });
  } else if (billingMode === "flat-fee" && flatFee > 0) {
    lineItems.push({
      id: "new-li-flat",
      type: "time-entry",
      referenceId: "flat-fee",
      description: t("mode.flat-fee"),
      amount: flatFee,
    });
  }

  // Add expenses as line items
  caseExpenses.forEach((exp, i) => {
    lineItems.push({
      id: `new-li-exp-${i}`,
      type: "expense",
      referenceId: exp.id,
      description: exp.description,
      amount: exp.amount,
    });
  });

  const subtotal = lineItems.reduce((sum, li) => sum + li.amount, 0);
  const tax = subtotal * 0.2;
  const total = subtotal + tax;

  const canGenerate =
    selectedCase && billingMode && subtotal > 0 && !submitting;

  const handleGenerate = async () => {
    if (!selectedCase || !billingMode) return;
    setSubmitting(true);

    const now = new Date();
    const year = now.getFullYear();
    const invoiceNumber = `INV-${year}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const issuedDate = now.toISOString().split("T")[0];
    const due = new Date(now);
    due.setDate(due.getDate() + 30);
    const dueDate = due.toISOString().split("T")[0];

    await services.billing.createInvoice({
      invoiceNumber,
      caseId: selectedCase.id,
      caseName: selectedCase.title,
      clientId: selectedCase.clientId,
      clientName: selectedCase.clientName,
      billingMode,
      status: "draft",
      lineItems,
      subtotal,
      tax,
      total,
      paidAmount: 0,
      payments: [],
      hourlyRate: billingMode === "hourly" ? rate : undefined,
      flatFeeAmount: billingMode === "flat-fee" ? flatFee : undefined,
      tariffAmount: billingMode === "tariff" ? tariff : undefined,
      notes: notes || undefined,
      issuedDate,
      dueDate,
    });

    setSubmitting(false);
    router.back();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FFF9F0" }}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Step 1: Select Case */}
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: colors.navy.DEFAULT,
          marginBottom: 12,
        }}
      >
        {t("create.selectCase")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 20 }}
        contentContainerStyle={{ gap: 10 }}
      >
        {allCases.map((c) => {
          const isSelected = selectedCase?.id === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => setSelectedCase(c)}
              style={{
                width: 160,
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                padding: 12,
                borderWidth: 2,
                borderColor: isSelected
                  ? colors.golden.DEFAULT
                  : "#F0F0F0",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.navy.DEFAULT,
                  marginBottom: 4,
                }}
                numberOfLines={2}
              >
                {c.title}
              </Text>
              <Text
                style={{ fontSize: 11, color: "#8899AA" }}
                numberOfLines={1}
              >
                {c.clientName}
              </Text>
              <Text style={{ fontSize: 10, color: "#AABBCC", marginTop: 2 }}>
                {c.caseNumber}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Step 2: Billing Mode */}
      {selectedCase && (
        <>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.navy.DEFAULT,
              marginBottom: 12,
            }}
          >
            {t("create.selectMode")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginBottom: 20,
            }}
          >
            {MODE_CONFIG.map(({ mode, icon, labelKey }) => {
              const isActive = billingMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setBillingMode(mode)}
                  style={{
                    flex: 1,
                    backgroundColor: isActive
                      ? colors.golden[50]
                      : "#FFFFFF",
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: isActive
                      ? colors.golden.DEFAULT
                      : "#F0F0F0",
                  }}
                >
                  <Ionicons
                    name={icon}
                    size={28}
                    color={
                      isActive
                        ? colors.golden.DEFAULT
                        : "#8899AA"
                    }
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: isActive
                        ? colors.golden.DEFAULT
                        : colors.navy.DEFAULT,
                      marginTop: 8,
                      textAlign: "center",
                    }}
                  >
                    {t(labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {/* Step 3: Mode-specific inputs and line items preview */}
      {selectedCase && billingMode && (
        <>
          {/* Mode-specific amount input */}
          {billingMode === "hourly" && (
            <View style={SECTION_CARD}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.navy.DEFAULT,
                  marginBottom: 8,
                }}
              >
                {t("create.hourlyRate")}
              </Text>
              <TextInput
                value={hourlyRate}
                onChangeText={setHourlyRate}
                keyboardType="numeric"
                style={{
                  borderWidth: 1,
                  borderColor: "#E0E0E0",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.navy.DEFAULT,
                }}
              />
            </View>
          )}
          {billingMode === "tariff" && (
            <View style={SECTION_CARD}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.navy.DEFAULT,
                  marginBottom: 8,
                }}
              >
                {t("create.tariffAmount")}
              </Text>
              <TextInput
                value={tariffAmount}
                onChangeText={setTariffAmount}
                keyboardType="numeric"
                placeholder="0"
                style={{
                  borderWidth: 1,
                  borderColor: "#E0E0E0",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.navy.DEFAULT,
                }}
              />
            </View>
          )}
          {billingMode === "flat-fee" && (
            <View style={SECTION_CARD}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.navy.DEFAULT,
                  marginBottom: 8,
                }}
              >
                {t("create.flatFeeAmount")}
              </Text>
              <TextInput
                value={flatFeeAmount}
                onChangeText={setFlatFeeAmount}
                keyboardType="numeric"
                placeholder="0"
                style={{
                  borderWidth: 1,
                  borderColor: "#E0E0E0",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.navy.DEFAULT,
                }}
              />
            </View>
          )}

          {/* Line items preview */}
          <View style={SECTION_CARD}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: colors.navy.DEFAULT,
                marginBottom: 12,
              }}
            >
              {t("create.lineItemsPreview")}
            </Text>

            {loadingEntries ? (
              <ActivityIndicator
                size="small"
                color={colors.golden.DEFAULT}
                style={{ marginVertical: 16 }}
              />
            ) : (
              <>
                {/* Time entries / billing mode items */}
                {billingMode === "hourly" && timeEntries.length === 0 && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#8899AA",
                      fontStyle: "italic",
                      marginBottom: 8,
                    }}
                  >
                    {t("create.noTimeEntries")}
                  </Text>
                )}
                {lineItems
                  .filter((li) => li.type === "time-entry")
                  .map((li) => (
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
                            {li.quantity}h x {formatRSD(li.unitPrice)} RSD
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

                {/* Expenses */}
                {caseExpenses.length === 0 && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#8899AA",
                      fontStyle: "italic",
                      marginTop: 8,
                    }}
                  >
                    {t("create.noExpenses")}
                  </Text>
                )}
                {lineItems
                  .filter((li) => li.type === "expense")
                  .map((li) => (
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
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#8899AA",
                            marginTop: 2,
                          }}
                        >
                          Trosak
                        </Text>
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
              </>
            )}
          </View>

          {/* Calculated totals */}
          <View style={SECTION_CARD}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: colors.navy.DEFAULT,
                marginBottom: 12,
              }}
            >
              {t("create.calculatedTotal")}
            </Text>
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
              <Text
                style={{
                  fontSize: 14,
                  color: colors.navy.DEFAULT,
                }}
              >
                {formatRSD(subtotal)} RSD
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
              <Text
                style={{
                  fontSize: 14,
                  color: colors.navy.DEFAULT,
                }}
              >
                {formatRSD(tax)} RSD
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: "#E0E0E0",
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
                  color: colors.golden.DEFAULT,
                }}
              >
                {formatRSD(total)} RSD
              </Text>
            </View>
          </View>

          {/* Notes */}
          <View style={SECTION_CARD}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.navy.DEFAULT,
                marginBottom: 8,
              }}
            >
              {t("create.notes")}
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder={t("create.notes")}
              style={{
                borderWidth: 1,
                borderColor: "#E0E0E0",
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                color: colors.navy.DEFAULT,
                minHeight: 80,
                textAlignVertical: "top",
              }}
            />
          </View>

          {/* Generate button */}
          <Pressable
            onPress={handleGenerate}
            disabled={!canGenerate}
            style={{
              backgroundColor: canGenerate
                ? colors.golden.DEFAULT
                : "#CCCCCC",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginBottom: 40,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#FFFFFF",
                }}
              >
                {t("create.generate")}
              </Text>
            )}
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

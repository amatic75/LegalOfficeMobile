import { useState, useEffect, useCallback } from "react";
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
import { useRouter, useLocalSearchParams, Stack, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useServices } from "../../../../src/hooks/useServices";
import { useReturnBack } from "../../../../src/hooks/useReturnBack";
import { colors } from "../../../../src/theme/tokens";
import type {
  CaseSummary,
  BillingMode,
  TimeEntry,
  Expense,
  InvoiceLineItem,
  Currency,
} from "../../../../src/services/types";
import { DEFAULT_CURRENCY } from "../../../../src/services/types";

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
  // Optional `?caseId=...` deep-link from the case overview's "Create invoice"
  // button — pre-selects that case so the user lands on the right form.
  const { caseId: preselectedCaseId } = useLocalSearchParams<{ caseId?: string }>();
  // Honors `?returnTo=...` so the back chevron lands on the originating screen
  // (e.g. the case overview) even though the new-invoice screen lives in the
  // `more/billing` stack.
  const { goBack, returnTo } = useReturnBack();

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

  // User-driven exclusions and exchange rates ─ both keyed by stable line-item ids
  // and currency codes respectively. Excluded items still render under "Removed
  // items" so the user can restore them; they don't contribute to the subtotal.
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [exchangeRates, setExchangeRates] = useState<Record<string, string>>({});
  const setRate = (cur: string, value: string) =>
    setExchangeRates((prev) => ({ ...prev, [cur]: value }));
  const toggleExcluded = (id: string) =>
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  useEffect(() => {
    services.cases.getCases().then((list) => {
      setAllCases(list);
      // Honor `?caseId=...` once cases are loaded.
      if (preselectedCaseId) {
        const match = list.find((c) => c.id === preselectedCaseId);
        if (match) setSelectedCase(match);
      }
    });
  }, [preselectedCaseId]);

  // Fetch unbilled time entries + expenses for the picked case. Re-runs on
  // every focus (returning to this screen after creating an invoice elsewhere
  // gives us fresh data) and whenever the user switches cases.
  const selectedCaseId = selectedCase?.id;
  const refreshLineItems = useCallback(async () => {
    if (!selectedCaseId) {
      setTimeEntries([]);
      setCaseExpenses([]);
      return;
    }
    setLoadingEntries(true);
    const [te, exp, existingInvoices] = await Promise.all([
      services.timeEntries.getTimeEntriesByCaseId(selectedCaseId),
      services.expenses.getExpensesByCaseId(selectedCaseId),
      services.billing.getInvoicesByCaseId(selectedCaseId),
    ]);
    // Anything already billed (referenced from an existing invoice's line
    // items) must not show up here — same item should never appear on two
    // invoices. Skip synthetic referenceIds like "tariff" / "flat-fee" since
    // they don't map to real time-entry / expense records.
    const billed = new Set<string>();
    for (const inv of existingInvoices) {
      for (const li of inv.lineItems) {
        if (li.type !== "time-entry" && li.type !== "expense") continue;
        if (li.referenceId === "tariff" || li.referenceId === "flat-fee") continue;
        billed.add(li.referenceId);
      }
    }
    setTimeEntries(te.filter((e) => e.billable && !billed.has(e.id)));
    setCaseExpenses(exp.filter((e) => !billed.has(e.id)));
    setLoadingEntries(false);
  }, [selectedCaseId, services]);

  useFocusEffect(
    useCallback(() => {
      refreshLineItems();
    }, [refreshLineItems])
  );

  const rate = parseFloat(hourlyRate) || 0;
  const tariff = parseFloat(tariffAmount) || 0;
  const flatFee = parseFloat(flatFeeAmount) || 0;

  // Per-line-item draft carries the original currency so we can group + convert
  // at total time. Plain `InvoiceLineItem` doesn't have a currency field; we
  // serialize the converted RSD amount when saving.
  type LineItemDraft = InvoiceLineItem & { currency: Currency };

  const lineItems: LineItemDraft[] = [];
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
        // Hourly rate is entered in RSD on this screen, so the time-entry line
        // is RSD regardless of how the time entry itself was logged.
        currency: DEFAULT_CURRENCY,
      });
    });
  } else if (billingMode === "tariff" && tariff > 0) {
    lineItems.push({
      id: "new-li-tariff",
      type: "time-entry",
      referenceId: "tariff",
      description: t("mode.tariff"),
      amount: tariff,
      currency: DEFAULT_CURRENCY,
    });
  } else if (billingMode === "flat-fee" && flatFee > 0) {
    lineItems.push({
      id: "new-li-flat",
      type: "time-entry",
      referenceId: "flat-fee",
      description: t("mode.flat-fee"),
      amount: flatFee,
      currency: DEFAULT_CURRENCY,
    });
  }

  caseExpenses.forEach((exp, i) => {
    lineItems.push({
      id: `new-li-exp-${i}`,
      type: "expense",
      referenceId: exp.id,
      description: exp.description,
      amount: exp.amount,
      currency: exp.currency ?? DEFAULT_CURRENCY,
    });
  });

  const activeItems = lineItems.filter((li) => !excludedIds.has(li.id));
  const removedItems = lineItems.filter((li) => excludedIds.has(li.id));

  // Group active items by currency so we can show per-currency subtotals and
  // ask for one exchange rate per non-RSD currency.
  const subtotalsByCurrency = activeItems.reduce<Record<string, number>>((acc, li) => {
    acc[li.currency] = (acc[li.currency] ?? 0) + li.amount;
    return acc;
  }, {});
  const foreignCurrencies = Object.keys(subtotalsByCurrency).filter((c) => c !== DEFAULT_CURRENCY);

  const rsdSubtotal = subtotalsByCurrency[DEFAULT_CURRENCY] ?? 0;
  let convertedForeignTotal = 0;
  let missingRateCurrency: string | null = null;
  for (const cur of foreignCurrencies) {
    const r = parseFloat(exchangeRates[cur]);
    if (!r || r <= 0) {
      if (!missingRateCurrency) missingRateCurrency = cur;
      continue;
    }
    convertedForeignTotal += subtotalsByCurrency[cur] * r;
  }
  const subtotal = rsdSubtotal + convertedForeignTotal;
  const tax = subtotal * 0.2;
  const total = subtotal + tax;

  const canGenerate =
    !!selectedCase && !!billingMode && subtotal > 0 && !submitting && missingRateCurrency === null;

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

    // Persist line items in RSD: foreign-currency amounts are multiplied by
    // the user-entered rate. The original currency + rate is preserved in the
    // line description so the user can reconstruct the math later.
    const persistedItems: InvoiceLineItem[] = activeItems.map((li) => {
      if (li.currency === DEFAULT_CURRENCY) {
        return {
          id: li.id, type: li.type, referenceId: li.referenceId,
          description: li.description, quantity: li.quantity,
          unitPrice: li.unitPrice, amount: li.amount,
        };
      }
      const r = parseFloat(exchangeRates[li.currency]) || 0;
      return {
        id: li.id,
        type: li.type,
        referenceId: li.referenceId,
        description: `${li.description}  [${li.amount.toFixed(2)} ${li.currency} @ ${r}]`,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        amount: li.amount * r,
      };
    });

    await services.billing.createInvoice({
      invoiceNumber,
      caseId: selectedCase.id,
      caseName: selectedCase.title,
      clientId: selectedCase.clientId,
      clientName: selectedCase.clientName,
      billingMode,
      status: "draft",
      lineItems: persistedItems,
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
    // Prefer the explicit returnTo (set by the case overview); otherwise
    // fall back to the navigator's back if it has somewhere to go, else
    // land on the invoice list so the user isn't stranded.
    if (returnTo) {
      router.replace(returnTo as never);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/more/billing");
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FFF9F0" }}
      contentContainerStyle={{ padding: 16 }}
    >
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
                {activeItems
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
                        gap: 8,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, color: colors.navy.DEFAULT }} numberOfLines={2}>
                          {li.description}
                        </Text>
                        {li.quantity != null && li.unitPrice != null && (
                          <Text style={{ fontSize: 11, color: "#8899AA", marginTop: 2 }}>
                            {li.quantity}h x {formatRSD(li.unitPrice)} {li.currency}
                          </Text>
                        )}
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT }}>
                        {formatRSD(li.amount)} {li.currency}
                      </Text>
                      <Pressable onPress={() => toggleExcluded(li.id)} hitSlop={8} style={{ padding: 4 }}>
                        <Ionicons name={"close-circle-outline" as IoniconsName} size={20} color="#E57373" />
                      </Pressable>
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
                {activeItems
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
                        gap: 8,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, color: colors.navy.DEFAULT }} numberOfLines={2}>
                          {li.description}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#8899AA", marginTop: 2 }}>
                          Trosak
                        </Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT }}>
                        {formatRSD(li.amount)} {li.currency}
                      </Text>
                      <Pressable onPress={() => toggleExcluded(li.id)} hitSlop={8} style={{ padding: 4 }}>
                        <Ionicons name={"close-circle-outline" as IoniconsName} size={20} color="#E57373" />
                      </Pressable>
                    </View>
                  ))}

                {/* Removed items — restorable via the back-arrow button */}
                {removedItems.length > 0 && (
                  <View style={{ marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#EEE" }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#8899AA", marginBottom: 6 }}>
                      {t("create.removedItems")}
                    </Text>
                    {removedItems.map((li) => (
                      <View
                        key={li.id}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingVertical: 6,
                          gap: 8,
                          opacity: 0.55,
                        }}
                      >
                        <Text style={{ flex: 1, fontSize: 12, color: colors.navy.DEFAULT, textDecorationLine: "line-through" }} numberOfLines={1}>
                          {li.description}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#8899AA", textDecorationLine: "line-through" }}>
                          {formatRSD(li.amount)} {li.currency}
                        </Text>
                        <Pressable onPress={() => toggleExcluded(li.id)} hitSlop={8} style={{ padding: 4 }}>
                          <Ionicons name={"arrow-undo-outline" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>

          {/* Per-currency subtotals + exchange-rate inputs (only when foreign
              currencies are present in the active items). */}
          {foreignCurrencies.length > 0 && (
            <View style={SECTION_CARD}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 12 }}>
                {t("create.exchangeRates")}
              </Text>

              {/* RSD subtotal first when present */}
              {rsdSubtotal > 0 && (
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
                  <Text style={{ fontSize: 13, color: "#8899AA" }}>
                    {t("create.subtotalIn", { currency: DEFAULT_CURRENCY })}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT }}>
                    {formatRSD(rsdSubtotal)} {DEFAULT_CURRENCY}
                  </Text>
                </View>
              )}

              {foreignCurrencies.map((cur) => {
                const sub = subtotalsByCurrency[cur];
                const r = parseFloat(exchangeRates[cur]);
                const converted = r > 0 ? sub * r : null;
                return (
                  <View key={cur} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#F5F5F5" }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ fontSize: 13, color: "#8899AA" }}>
                        {t("create.subtotalIn", { currency: cur })}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT }}>
                        {formatRSD(sub)} {cur}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ flex: 1, fontSize: 12, color: "#8899AA" }}>
                        {t("create.exchangeRateFor", { currency: cur })}
                      </Text>
                      <TextInput
                        value={exchangeRates[cur] ?? ""}
                        onChangeText={(v) => setRate(cur, v)}
                        keyboardType="numeric"
                        placeholder="0,00"
                        style={{
                          width: 110,
                          borderWidth: 1,
                          borderColor: "#E0E0E0",
                          borderRadius: 8,
                          padding: 8,
                          fontSize: 14,
                          color: colors.navy.DEFAULT,
                          textAlign: "right",
                        }}
                      />
                    </View>
                    {converted !== null && (
                      <Text style={{ fontSize: 11, color: "#8899AA", marginTop: 6, textAlign: "right" }}>
                        = {formatRSD(converted)} {DEFAULT_CURRENCY}
                      </Text>
                    )}
                  </View>
                );
              })}

              {missingRateCurrency && (
                <Text style={{ fontSize: 12, color: "#C62828", marginTop: 10 }}>
                  {t("create.missingRate", { currency: missingRateCurrency })}
                </Text>
              )}
            </View>
          )}

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

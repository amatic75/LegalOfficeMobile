import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking, Modal, TextInput, Alert, Image, Dimensions, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import * as FileSystem from "expo-file-system/legacy";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useServices } from "../../../src/hooks/useServices";
import { useReturnBack } from "../../../src/hooks/useReturnBack";
import { DeleteConfirmDialog } from "../../../src/components/ui/DeleteConfirmDialog";
import { colors } from "../../../src/theme/tokens";
import type { Client, CaseSummary, CommunicationEntry, ClientDocument, ClientActivity, ClientExpenseItem, ClientOutstandingSummary, Currency, ExpenseCategory, TimeEntry, Expense, Invoice } from "../../../src/services/types";
import { STATUS_COLORS, ACTIVITY_TYPE_ICONS, DEFAULT_CURRENCY, EXPENSE_CATEGORIES, SUPPORTED_CURRENCIES, INVOICE_STATUS_COLORS, formatMoney } from "../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const SECTION_CARD = {
  backgroundColor: "#FFFFFF" as const,
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 12,
  marginHorizontal: 16,
  marginBottom: 12,
  shadowColor: "#000" as const,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 4,
  elevation: 1,
  borderWidth: 1,
  borderColor: "#FFF3E0" as const,
};

const COMM_TYPE_ICONS: Record<CommunicationEntry['type'], IoniconsName> = {
  call: "call-outline" as IoniconsName,
  meeting: "people-outline" as IoniconsName,
  email: "mail-outline" as IoniconsName,
  note: "document-text-outline" as IoniconsName,
};

const DOC_TYPE_ICONS_MAP: Record<ClientDocument['type'], IoniconsName> = {
  "id-card": "card-outline" as IoniconsName,
  passport: "globe-outline" as IoniconsName,
  "power-of-attorney": "document-text-outline" as IoniconsName,
  "engagement-letter": "create-outline" as IoniconsName,
  other: "document-outline" as IoniconsName,
};

function getClientDisplayName(client: Client): string {
  if (client.type === 'individual') {
    return `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim();
  }
  return client.companyName ?? '';
}

function InfoRow({ icon, label, value }: { icon: IoniconsName; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
      <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
        <Ionicons name={icon} size={16} color="#AAA" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>{value}</Text>
      </View>
    </View>
  );
}

function ContactRow({ icon, label, value, type }: { icon: IoniconsName; label: string; value?: string; type: 'phone' | 'email' }) {
  if (!value) return null;

  const handlePress = async () => {
    const url = type === 'phone' ? `tel:${value}` : `mailto:${value}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      // silently fail if linking not supported
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}
    >
      <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
        <Ionicons name={icon} size={16} color={colors.golden.DEFAULT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: colors.golden.DEFAULT, fontWeight: "500" }}>{value}</Text>
      </View>
      <Ionicons name={"chevron-forward" as IoniconsName} size={14} color="#DDD" style={{ marginTop: 8 }} />
    </Pressable>
  );
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function EmptyState({ icon, text }: { icon: IoniconsName; text: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 20 }}>
      <Ionicons name={icon} size={24} color="#DDD" />
      <Text style={{ fontSize: 13, color: "#AAA", marginTop: 6 }}>{text}</Text>
    </View>
  );
}

function ActivityItem({ item, isLast, onPress }: { item: ClientActivity; isLast: boolean; onPress?: () => void }) {
  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 10,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "#F5F0E8",
      }}
    >
      <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
        <Ionicons name={item.icon as IoniconsName} size={16} color={colors.golden.DEFAULT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT }}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
          {item.caseName} ({item.caseNumber})
        </Text>
        <Text style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>
          {formatDateDisplay(item.date)}
        </Text>
      </View>
      <Ionicons name={"chevron-forward" as IoniconsName} size={14} color="#DDD" style={{ marginTop: 8 }} />
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

function formatDateTimeShort(value: Date): string {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function mergeDateTime(previous: Date, selected: Date, stage: "date" | "time"): Date {
  const next = new Date(previous);
  if (stage === "date") {
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
  } else {
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
  }
  return next;
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("clients");
  const { t: tc } = useTranslation("cases");
  const { t: tb } = useTranslation("billing");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { goBack, returnTo } = useReturnBack();

  const [client, setClient] = useState<Client | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [communications, setCommunications] = useState<CommunicationEntry[]>([]);
  const [clientDocs, setClientDocs] = useState<ClientDocument[]>([]);
  const [recentActivity, setRecentActivity] = useState<ClientActivity[]>([]);
  const [upcomingActivity, setUpcomingActivity] = useState<ClientActivity[]>([]);
  // Aggregated unbilled work (time entries + expenses) and invoices across
  // every case the client owns. Each entry carries its case's name/number so
  // the UI can label rows with their origin case.
  type UnbilledTime = { te: TimeEntry; caseId: string; caseName: string; caseNumber: string };
  type UnbilledExpense = { ex: Expense; caseId: string; caseName: string; caseNumber: string };
  const [unbilledTime, setUnbilledTime] = useState<UnbilledTime[]>([]);
  const [unbilledExpenses, setUnbilledExpenses] = useState<UnbilledExpense[]>([]);
  const [clientInvoices, setClientInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Communication modal state
  const [showCommModal, setShowCommModal] = useState(false);
  const [commType, setCommType] = useState<CommunicationEntry['type']>("call");
  const [commSubject, setCommSubject] = useState("");
  const [commContent, setCommContent] = useState("");

  // Image preview modal state
  const [previewDoc, setPreviewDoc] = useState<ClientDocument | null>(null);

  // Add contact modal state (corporate)
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Case picker — opened from the unbilled / unpaid cards' actions. Now also
  // covers `'invoice'` (used by the "Create invoice" CTA). The picker is
  // skipped entirely when the client has exactly one case, and the action
  // buttons are disabled when there are no cases at all.
  const [casePickerMode, setCasePickerMode] = useState<'time' | 'expense' | 'invoice' | null>(null);
  const [targetCase, setTargetCase] = useState<CaseSummary | null>(null);

  // Add Time / Add Expense form state (mirrors case overview).
  // When `editingTimeId` / `editingExpenseId` is set, the form is in edit
  // mode for that entry (save calls update instead of create).
  const [addingTime, setAddingTime] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  // Per-row delete confirmation for unbilled items
  const [deleteUnbilledConfirm, setDeleteUnbilledConfirm] = useState<
    | { kind: "time"; id: string; description: string }
    | { kind: "expense"; id: string; description: string }
    | null
  >(null);
  const [timeHours, setTimeHours] = useState("");
  const [timeDescription, setTimeDescription] = useState("");
  const [timeDate, setTimeDate] = useState<Date>(() => new Date());
  const [timeBillable, setTimeBillable] = useState(true);
  const [showTimeDatePicker, setShowTimeDatePicker] = useState<"date" | "time" | null>(null);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("court-fees");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState<Date>(() => new Date());
  const [expenseCurrency, setExpenseCurrency] = useState<Currency>(DEFAULT_CURRENCY);
  const [showExpenseDatePicker, setShowExpenseDatePicker] = useState<"date" | "time" | null>(null);
  const [expenseCustomCategory, setExpenseCustomCategory] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;
    const [clientData, casesData, commsData, docsData, recentAct, upcomingAct] = await Promise.all([
      services.clients.getClientById(id),
      services.cases.getCasesByClientId(id),
      services.communications.getByClientId(id),
      services.clientDocuments.getByClientId(id),
      services.clientAggregation.getRecentActivity(id, 3),
      services.clientAggregation.getUpcomingActivity(id, 3),
    ]);

    // Fan out per case to get the raw time entries, expenses and invoices.
    // We need the originals (not the wrapped ClientExpenseItem) so we can
    // filter unbilled items by their real ids vs invoice line referenceIds.
    const perCase = await Promise.all(
      casesData.map(async (cs) => {
        const [te, exp, inv] = await Promise.all([
          services.timeEntries.getTimeEntriesByCaseId(cs.id),
          services.expenses.getExpensesByCaseId(cs.id),
          services.billing.getInvoicesByCaseId(cs.id),
        ]);
        return { cs, te, exp, inv };
      })
    );

    // Items already on some invoice — same id should never count as unbilled.
    // Skip synthetic referenceIds (`tariff` / `flat-fee`) since those don't
    // map to any actual time entry or expense record.
    const billed = new Set<string>();
    for (const { inv } of perCase) {
      for (const i of inv) {
        for (const li of i.lineItems) {
          if (li.type !== "time-entry" && li.type !== "expense") continue;
          if (li.referenceId === "tariff" || li.referenceId === "flat-fee") continue;
          billed.add(li.referenceId);
        }
      }
    }

    const teList: UnbilledTime[] = [];
    const expList: UnbilledExpense[] = [];
    const invList: Invoice[] = [];
    for (const { cs, te, exp, inv } of perCase) {
      for (const t of te) {
        if (t.billable && !billed.has(t.id)) {
          teList.push({ te: t, caseId: cs.id, caseName: cs.title, caseNumber: cs.caseNumber });
        }
      }
      for (const e of exp) {
        if (!billed.has(e.id)) {
          expList.push({ ex: e, caseId: cs.id, caseName: cs.title, caseNumber: cs.caseNumber });
        }
      }
      invList.push(...inv);
    }
    teList.sort((a, b) => b.te.date.localeCompare(a.te.date));
    expList.sort((a, b) => b.ex.date.localeCompare(a.ex.date));
    invList.sort((a, b) => b.issuedDate.localeCompare(a.issuedDate));

    setClient(clientData);
    setCases(casesData);
    setCommunications(commsData);
    setClientDocs(docsData);
    setRecentActivity(recentAct);
    setUpcomingActivity(upcomingAct);
    setUnbilledTime(teList);
    setUnbilledExpenses(expList);
    setClientInvoices(invList);
    setLoading(false);
  }, [id, services]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddCommunication = async () => {
    if (!id || !commSubject.trim()) return;
    await services.communications.create({
      clientId: id,
      type: commType,
      subject: commSubject.trim(),
      content: commContent.trim() || undefined,
      date: new Date().toISOString().split("T")[0],
    });
    const refreshed = await services.communications.getByClientId(id);
    setCommunications(refreshed);
    setShowCommModal(false);
    setCommSubject("");
    setCommContent("");
    setCommType("call");
  };

  const isImageUri = (uri: string): boolean => {
    const lower = uri.toLowerCase().split("?")[0];
    return /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/.test(lower);
  };

  const getMimeType = (uri: string): string | undefined => {
    const ext = uri.toLowerCase().split("?")[0].split(".").pop();
    switch (ext) {
      case "pdf": return "application/pdf";
      case "doc": return "application/msword";
      case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "xls": return "application/vnd.ms-excel";
      case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "ppt": return "application/vnd.ms-powerpoint";
      case "pptx": return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      case "txt": return "text/plain";
      case "csv": return "text/csv";
      case "rtf": return "application/rtf";
      default: return undefined;
    }
  };

  const handleOpenDoc = async (doc: ClientDocument) => {
    if (!doc.uri || doc.uri.startsWith("file://mock/")) {
      Alert.alert(t("documents.cannotOpenTitle"), t("documents.cannotOpenMessage"));
      return;
    }
    if (isImageUri(doc.uri)) {
      setPreviewDoc(doc);
      return;
    }
    const mimeType = getMimeType(doc.uri);
    try {
      if (Platform.OS === "android") {
        const contentUri = doc.uri.startsWith("file://")
          ? await FileSystem.getContentUriAsync(doc.uri)
          : doc.uri;
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
          type: mimeType,
        });
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(doc.uri, {
          mimeType,
          dialogTitle: doc.name,
          UTI: mimeType,
        });
        return;
      }
      const supported = await Linking.canOpenURL(doc.uri);
      if (supported) {
        await Linking.openURL(doc.uri);
      } else {
        Alert.alert(t("documents.cannotOpenTitle"), t("documents.cannotOpenMessage"));
      }
    } catch {
      Alert.alert(t("documents.cannotOpenTitle"), t("documents.cannotOpenMessage"));
    }
  };

  // Case picker → form / navigation flow. The mode passed in determines what
  // happens after a case is chosen: open the time form, the expense form,
  // or jump to the new-invoice screen for that case.
  const runActionForCase = (cs: CaseSummary, mode: 'time' | 'expense' | 'invoice') => {
    setTargetCase(cs);
    setCasePickerMode(null);
    if (mode === 'time') {
      setEditingTimeId(null); setEditingExpenseId(null);
      setTimeHours(""); setTimeDescription(""); setTimeDate(new Date()); setTimeBillable(true);
      setAddingExpense(false);
      setAddingTime(true);
    } else if (mode === 'expense') {
      setEditingTimeId(null); setEditingExpenseId(null);
      setExpenseAmount(""); setExpenseDescription(""); setExpenseDate(new Date()); setExpenseCategory("court-fees"); setExpenseCurrency(DEFAULT_CURRENCY); setExpenseCustomCategory("");
      setAddingTime(false);
      setAddingExpense(true);
    } else if (mode === 'invoice') {
      router.push({
        pathname: "/(tabs)/more/billing/new",
        params: { caseId: cs.id, returnTo: `/(tabs)/clients/${id}` },
      });
    }
  };

  // Picks the target case for the given action: skips the picker when there's
  // only one case, opens it when there are multiple, no-ops when there are none.
  const startActionForCase = (mode: 'time' | 'expense' | 'invoice') => {
    if (cases.length === 0) return;
    if (cases.length === 1) {
      runActionForCase(cases[0], mode);
      return;
    }
    setCasePickerMode(mode);
  };

  const handleCaseSelected = (cs: CaseSummary) => {
    if (casePickerMode) runActionForCase(cs, casePickerMode);
  };

  const handleAddTimeEntry = async () => {
    if (!id) return;
    const hours = parseFloat(timeHours);
    if (isNaN(hours) || hours <= 0 || !timeDescription.trim()) return;
    if (editingTimeId) {
      // Edit mode: update existing entry on its own case (caseId stays the
      // same, no targetCase needed). Hours-only — amounts are computed when
      // the entry is added to an invoice under a billing mode.
      await services.timeEntries.updateTimeEntry(editingTimeId, {
        hours,
        description: timeDescription.trim(),
        date: timeDate.toISOString(),
        billable: timeBillable,
      });
    } else {
      if (!targetCase) return;
      await services.timeEntries.createTimeEntry({
        caseId: targetCase.id,
        hours,
        description: timeDescription.trim(),
        date: timeDate.toISOString(),
        billable: timeBillable,
      });
    }
    await loadData();
    setTimeHours(""); setTimeDescription(""); setTimeDate(new Date()); setTimeBillable(true);
    setAddingTime(false);
    setTargetCase(null);
    setEditingTimeId(null);
  };

  const handleAddExpense = async () => {
    if (!id) return;
    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0 || !expenseDescription.trim()) return;
    if (editingExpenseId) {
      await services.expenses.updateExpense(editingExpenseId, {
        amount,
        currency: expenseCurrency,
        category: expenseCategory,
        description: expenseDescription.trim(),
        date: expenseDate.toISOString(),
      });
    } else {
      if (!targetCase) return;
      await services.expenses.createExpense({
        caseId: targetCase.id,
        amount,
        currency: expenseCurrency,
        category: expenseCategory,
        description: expenseDescription.trim(),
        date: expenseDate.toISOString(),
      });
    }
    await loadData();
    setExpenseAmount(""); setExpenseCategory("court-fees"); setExpenseDescription(""); setExpenseDate(new Date()); setExpenseCustomCategory(""); setExpenseCurrency(DEFAULT_CURRENCY);
    setAddingExpense(false);
    setTargetCase(null);
    setEditingExpenseId(null);
  };

  // Open the form modals pre-filled with an existing item — tapping a row in
  // the unbilled list lands here so the user can quickly correct it.
  const handleEditUnbilledTime = (te: TimeEntry, caseInfo: { caseId: string; caseName: string; caseNumber: string }) => {
    setTargetCase({
      id: caseInfo.caseId,
      caseNumber: caseInfo.caseNumber,
      title: caseInfo.caseName,
    } as CaseSummary);
    setEditingTimeId(te.id);
    setEditingExpenseId(null);
    setTimeHours(String(te.hours));
    setTimeDescription(te.description ?? "");
    setTimeDate(te.date ? new Date(te.date) : new Date());
    setTimeBillable(te.billable);
    setAddingExpense(false);
    setAddingTime(true);
  };

  const handleEditUnbilledExpense = (ex: Expense, caseInfo: { caseId: string; caseName: string; caseNumber: string }) => {
    setTargetCase({
      id: caseInfo.caseId,
      caseNumber: caseInfo.caseNumber,
      title: caseInfo.caseName,
    } as CaseSummary);
    setEditingExpenseId(ex.id);
    setEditingTimeId(null);
    setExpenseAmount(String(ex.amount));
    setExpenseCategory(ex.category);
    setExpenseDescription(ex.description ?? "");
    setExpenseDate(ex.date ? new Date(ex.date) : new Date());
    setExpenseCurrency((ex.currency ?? DEFAULT_CURRENCY) as Currency);
    setExpenseCustomCategory("");
    setAddingTime(false);
    setAddingExpense(true);
  };

  // Stops Pressable from also firing — used by the row's delete button so
  // tapping the trash doesn't open the edit modal.
  const confirmDeleteUnbilled = async () => {
    const target = deleteUnbilledConfirm;
    setDeleteUnbilledConfirm(null);
    if (!target) return;
    if (target.kind === "time") {
      await services.timeEntries.deleteTimeEntry(target.id);
    } else {
      await services.expenses.deleteExpense(target.id);
    }
    await loadData();
  };

  const handleAddContact = async () => {
    if (!id || !client || !contactName.trim() || !contactRole.trim()) return;
    const existingReps = client.representatives ?? [];
    const newRep = {
      name: contactName.trim(),
      role: contactRole.trim(),
      phone: contactPhone.trim() || undefined,
      email: contactEmail.trim() || undefined,
    };
    await services.clients.updateClient(id, { representatives: [...existingReps, newRep] });
    const refreshed = await services.clients.getClientById(id);
    if (refreshed) setClient(refreshed);
    setShowContactModal(false);
    setContactName("");
    setContactRole("");
    setContactPhone("");
    setContactEmail("");
  };

  if (loading || !client) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: "" }} />
        <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
        </View>
      </>
    );
  }

  const displayName = getClientDisplayName(client);
  const isIndividual = client.type === 'individual';

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: displayName,
          headerLeft: returnTo
            ? () => (
                <Pressable onPress={goBack} style={{ marginLeft: 4, padding: 4 }}>
                  <Ionicons name={"arrow-back" as IoniconsName} size={24} color="#FFFFFF" />
                </Pressable>
              )
            : undefined,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/(tabs)/clients/edit/' + id)}
              style={{ marginRight: 4 }}
            >
              <Ionicons name={"create-outline" as IoniconsName} size={22} color="#FFFFFF" />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 20,
            margin: 16,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: 1,
            borderColor: "#FFF3E0",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: isIndividual ? "#FDF8EC" : colors.navy[50],
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons
              name={(isIndividual ? "person" : "business") as IoniconsName}
              size={28}
              color={isIndividual ? colors.golden.DEFAULT : colors.navy.DEFAULT}
            />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.navy.DEFAULT, textAlign: "center", marginBottom: 4 }}>
            {displayName}
          </Text>
          <View
            style={{
              backgroundColor: isIndividual ? colors.golden[50] : colors.navy[50],
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isIndividual ? colors.golden.DEFAULT : colors.navy.DEFAULT,
              }}
            >
              {t(isIndividual ? 'type.individual' : 'type.corporate')}
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={SECTION_CARD}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 4 }}>
            {t("detail.profile")}
          </Text>
          {isIndividual ? (
            <>
              <InfoRow icon={"card-outline" as IoniconsName} label="JMBG" value={client.jmbg} />
              <InfoRow icon={"location-outline" as IoniconsName} label={t("form.address")} value={client.address} />
              <InfoRow icon={"navigate-outline" as IoniconsName} label={t("form.city")} value={client.city} />
            </>
          ) : (
            <>
              <InfoRow icon={"document-text-outline" as IoniconsName} label="PIB" value={client.pib} />
              <InfoRow icon={"barcode-outline" as IoniconsName} label={t("form.mb")} value={client.mb} />
              <InfoRow icon={"location-outline" as IoniconsName} label={t("form.address")} value={client.address} />
              <InfoRow icon={"navigate-outline" as IoniconsName} label={t("form.city")} value={client.city} />
            </>
          )}
        </View>

        {/* Contact Section */}
        <View style={SECTION_CARD}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 4 }}>
            {t("detail.contact")}
          </Text>
          <ContactRow icon={"call-outline" as IoniconsName} label={t("form.phone")} value={client.phone} type="phone" />
          <ContactRow icon={"mail-outline" as IoniconsName} label={t("form.email")} value={client.email} type="email" />
        </View>

        {/* Representatives / Contacts Section (Corporate only) */}
        {!isIndividual && (
          <View style={SECTION_CARD}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
                {t("contacts.contacts")}
              </Text>
              <Pressable
                onPress={() => setShowContactModal(true)}
                style={{
                  backgroundColor: colors.golden.DEFAULT,
                  borderRadius: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Ionicons name={"add" as IoniconsName} size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#FFFFFF" }}>{t("contacts.addContact")}</Text>
              </Pressable>
            </View>
            {client.representatives && client.representatives.length > 0 ? (
              client.representatives.map((rep, index) => (
                <View
                  key={index}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: index < (client.representatives?.length ?? 0) - 1 ? 1 : 0,
                    borderBottomColor: "#F5F0E8",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <Ionicons name={"person-circle-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT, flex: 1 }}>
                      {rep.name}
                    </Text>
                    {rep.isPrimary && (
                      <Ionicons name={"star" as IoniconsName} size={16} color={colors.golden.DEFAULT} style={{ marginRight: 6 }} />
                    )}
                    <View style={{ backgroundColor: colors.navy[50], borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: "600", color: colors.navy.DEFAULT }}>{rep.role}</Text>
                    </View>
                  </View>
                  {rep.isPrimary && (
                    <Text style={{ fontSize: 11, color: colors.golden.DEFAULT, fontWeight: "600", marginLeft: 26, marginBottom: 2 }}>
                      {t("contacts.primaryContact")}
                    </Text>
                  )}
                  {rep.phone && (
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${rep.phone}`)}
                      style={{ flexDirection: "row", alignItems: "center", marginLeft: 26, marginTop: 2 }}
                    >
                      <Ionicons name={"call-outline" as IoniconsName} size={12} color={colors.golden.DEFAULT} style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 13, color: colors.golden.DEFAULT }}>{rep.phone}</Text>
                    </Pressable>
                  )}
                  {rep.email && (
                    <Pressable
                      onPress={() => Linking.openURL(`mailto:${rep.email}`)}
                      style={{ flexDirection: "row", alignItems: "center", marginLeft: 26, marginTop: 2 }}
                    >
                      <Ionicons name={"mail-outline" as IoniconsName} size={12} color={colors.golden.DEFAULT} style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 13, color: colors.golden.DEFAULT }}>{rep.email}</Text>
                    </Pressable>
                  )}
                </View>
              ))
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <Ionicons name={"people-outline" as IoniconsName} size={24} color="#DDD" />
                <Text style={{ fontSize: 13, color: "#AAA", marginTop: 6 }}>No contacts yet</Text>
              </View>
            )}
          </View>
        )}

        {/* Linked Cases Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {t("detail.linkedCases")}
            </Text>
            <Pressable
              onPress={() => router.push({
                pathname: "/(tabs)/cases/new",
                params: { clientId: id!, returnTo: `/(tabs)/clients/${id}` },
              })}
              style={{
                backgroundColor: colors.golden.DEFAULT,
                borderRadius: 6,
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Ionicons name={"add" as IoniconsName} size={14} color="#FFFFFF" />
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#FFFFFF" }}>{t("detail.newCaseForClient")}</Text>
            </Pressable>
          </View>
          {cases.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Ionicons name={"folder-open-outline" as IoniconsName} size={24} color="#DDD" />
              <Text style={{ fontSize: 13, color: "#AAA", marginTop: 6 }}>{t("detail.noCases")}</Text>
            </View>
          ) : (
            cases.map((caseItem, index) => {
              const statusColor = STATUS_COLORS[caseItem.status] ?? STATUS_COLORS.active;
              return (
                <Pressable
                  key={caseItem.id}
                  onPress={() => router.push({ pathname: '/(tabs)/cases/[id]', params: { id: caseItem.id, returnTo: `/(tabs)/clients/${id}` } })}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    borderBottomWidth: index < cases.length - 1 ? 1 : 0,
                    borderBottomColor: "#F5F0E8",
                  }}
                >
                  <View style={{ width: 32, alignItems: "center" }}>
                    <Ionicons name={"folder-outline" as IoniconsName} size={16} color={colors.golden.DEFAULT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 2 }}>
                      {caseItem.caseNumber}
                    </Text>
                    <Text numberOfLines={1} style={{ fontSize: 12, color: "#888" }}>
                      {caseItem.title}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: statusColor.bg,
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      marginLeft: 8,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "600", color: statusColor.text }}>
                      {caseItem.status.toUpperCase()}
                    </Text>
                  </View>
                  <Ionicons name={"chevron-forward" as IoniconsName} size={14} color="#DDD" style={{ marginLeft: 4 }} />
                </Pressable>
              );
            })
          )}
        </View>

        {/* Upcoming Activity Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {t("upcomingActivity.title")}
            </Text>
            {upcomingActivity.length > 0 && (
              <Pressable onPress={() => router.push({ pathname: "/(tabs)/clients/activity", params: { clientId: id, mode: "upcoming", clientName: displayName } })}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("upcomingActivity.seeAll")}</Text>
              </Pressable>
            )}
          </View>
          {upcomingActivity.length > 0 ? (
            upcomingActivity.map((item, idx) => (
              <ActivityItem
                key={item.id}
                item={item}
                isLast={idx === upcomingActivity.length - 1}
                onPress={item.eventId ? () => router.push({ pathname: "/(tabs)/calendar/event/[id]", params: { id: item.eventId!, returnTo: `/(tabs)/clients/${id}` } }) : undefined}
              />
            ))
          ) : (
            <EmptyState icon={"calendar-outline" as IoniconsName} text={t("upcomingActivity.noActivity")} />
          )}
        </View>

        {/* Recent Activity Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {t("recentActivity.title")}
            </Text>
            {recentActivity.length > 0 && (
              <Pressable onPress={() => router.push({ pathname: "/(tabs)/clients/activity", params: { clientId: id, mode: "recent", clientName: displayName } })}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("recentActivity.seeAll")}</Text>
              </Pressable>
            )}
          </View>
          {recentActivity.length > 0 ? (
            recentActivity.map((item, idx) => <ActivityItem key={item.id} item={item} isLast={idx === recentActivity.length - 1} />)
          ) : (
            <EmptyState icon={"time-outline" as IoniconsName} text={t("recentActivity.noActivity")} />
          )}
        </View>

        {/* Communication History Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {t("communication.communicationHistory")}
            </Text>
            <Pressable
              onPress={() => setShowCommModal(true)}
              style={{
                backgroundColor: colors.golden.DEFAULT,
                borderRadius: 6,
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Ionicons name={"add" as IoniconsName} size={14} color="#FFFFFF" />
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#FFFFFF" }}>{t("communication.addCommunication")}</Text>
            </Pressable>
          </View>
          {communications.length > 0 ? (
            communications.map((comm, index) => (
              <View
                key={comm.id}
                style={{
                  flexDirection: "row",
                  paddingVertical: 10,
                  borderBottomWidth: index < communications.length - 1 ? 1 : 0,
                  borderBottomColor: "#F5F0E8",
                }}
              >
                <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
                  <Ionicons name={COMM_TYPE_ICONS[comm.type]} size={16} color={colors.golden.DEFAULT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT }}>
                    {comm.subject}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>
                    {formatDateDisplay(comm.date)}
                  </Text>
                  {comm.content && (
                    <Text numberOfLines={2} style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                      {comm.content}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Ionicons name={"chatbubbles-outline" as IoniconsName} size={24} color="#DDD" />
              <Text style={{ fontSize: 13, color: "#AAA", marginTop: 6 }}>{t("communication.noCommunications")}</Text>
            </View>
          )}
        </View>

        {/* Client Documents Section — case-overview compact pattern.
            Add / remove now lives on the dedicated documents page. */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"document-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
              {t("clientDocuments.documentCount", { count: clientDocs.length })}
            </Text>
          </View>
          {clientDocs.length > 0 ? (
            <>
              {clientDocs.slice(0, 3).map((doc) => (
                <Pressable
                  key={doc.id}
                  onPress={() => handleOpenDoc(doc)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F5F0E8",
                  }}
                >
                  <Ionicons
                    name={DOC_TYPE_ICONS_MAP[doc.type] || ("document-outline" as IoniconsName)}
                    size={20}
                    color={colors.golden.DEFAULT}
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT }} numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, gap: 6 }}>
                      <Text style={{ fontSize: 11, color: "#999" }}>
                        {t("clientDocuments." + (doc.type === "id-card" ? "idCard" : doc.type === "power-of-attorney" ? "powerOfAttorney" : doc.type === "engagement-letter" ? "engagementLetter" : doc.type))}
                      </Text>
                      {doc.expiresAt && (
                        <Text style={{ fontSize: 11, color: "#AAA" }}>
                          · {t("clientDocuments.expiresAt")}: {formatDateDisplay(doc.expiresAt)}
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
              <Pressable
                onPress={() => router.push({ pathname: "/(tabs)/clients/documents/[clientId]", params: { clientId: id! } })}
                style={{
                  marginTop: 10,
                  paddingVertical: 8,
                  alignItems: "center",
                  backgroundColor: colors.golden[50],
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>
                  {t("clientDocuments.viewAll")}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <View
                style={{
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: "#DDD",
                  borderRadius: 10,
                  paddingVertical: 20,
                  alignItems: "center",
                }}
              >
                <Ionicons name={"cloud-upload-outline" as IoniconsName} size={28} color="#DDD" />
                <Text style={{ fontSize: 13, color: "#AAA", marginTop: 8, textAlign: "center", paddingHorizontal: 16 }}>
                  {t("clientDocuments.noDocsYet")}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push({ pathname: "/(tabs)/clients/documents/[clientId]", params: { clientId: id! } })}
                style={{
                  marginTop: 10,
                  paddingVertical: 8,
                  alignItems: "center",
                  backgroundColor: colors.golden[50],
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>
                  {t("clientDocuments.addDocument")}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* ───── Nefakturisane stavke (mirrors case overview, aggregated) ─────
            Lists every unbilled time entry + expense across all of the
            client's cases. Action buttons follow the smart-pick rule:
              0 cases → disabled
              1 case  → no popup, action runs against that case directly
              ≥2 cases → case picker modal opens. */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"cash-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
              {tc("billing.title")}
            </Text>
          </View>

          {/* Action buttons — disabled when the client has zero cases */}
          {(() => {
            const noCases = cases.length === 0;
            const baseBtn = {
              flex: 1,
              flexDirection: "row" as const,
              alignItems: "center" as const,
              justifyContent: "center" as const,
              paddingVertical: 10,
              borderRadius: 10,
              gap: 6,
            };
            return (
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                <Pressable
                  onPress={() => startActionForCase('time')}
                  disabled={noCases}
                  style={{ ...baseBtn, backgroundColor: noCases ? "#E0D9CC" : colors.golden.DEFAULT, opacity: noCases ? 0.6 : 1 }}
                >
                  <Ionicons name={"add" as IoniconsName} size={16} color="#FFFFFF" />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>{tc("billing.addTime")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => startActionForCase('expense')}
                  disabled={noCases}
                  style={{ ...baseBtn, backgroundColor: noCases ? "#E0D9CC" : colors.golden.DEFAULT, opacity: noCases ? 0.6 : 1 }}
                >
                  <Ionicons name={"add" as IoniconsName} size={16} color="#FFFFFF" />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>{tc("billing.addExpense")}</Text>
                </Pressable>
              </View>
            );
          })()}

          {(() => {
            // Combined chronological list of unbilled items (time + expense)
            const items: Array<{ kind: 'time'; data: UnbilledTime } | { kind: 'expense'; data: UnbilledExpense }> = [
              ...unbilledTime.map((u) => ({ kind: 'time' as const, data: u })),
              ...unbilledExpenses.map((u) => ({ kind: 'expense' as const, data: u })),
            ].sort((a, b) => {
              const dateA = a.kind === 'time' ? a.data.te.date : a.data.ex.date;
              const dateB = b.kind === 'time' ? b.data.te.date : b.data.ex.date;
              return dateB.localeCompare(dateA);
            });

            if (items.length === 0) {
              return (
                <View
                  style={{
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: "#E0D9CC",
                    borderRadius: 12,
                    paddingVertical: 24,
                    alignItems: "center",
                    backgroundColor: "#FBFAF5",
                  }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.golden[50], alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <Ionicons name={"cash-outline" as IoniconsName} size={22} color={colors.golden.DEFAULT} />
                  </View>
                  <Text style={{ fontSize: 13, color: "#8B8373", marginTop: 4, textAlign: "center", paddingHorizontal: 20, lineHeight: 18 }}>
                    {tc("billing.emptyState")}
                  </Text>
                </View>
              );
            }

            return (
              <>
                {items.map((item) => {
                  const isTime = item.kind === 'time';
                  const date = isTime ? item.data.te.date : item.data.ex.date;
                  const description = isTime ? item.data.te.description : item.data.ex.description;
                  const railColor = isTime ? colors.golden.DEFAULT : "#43A047";
                  const tintBg = isTime ? colors.golden[50] : "#E8F5E9";
                  const tintFg = isTime ? colors.golden.DEFAULT : "#2E7D32";
                  const kindLabel = isTime ? tc("billing.hours") : tc("billing.amount");
                  const big = isTime
                    ? `${item.data.te.hours.toFixed(1)}h`
                    : formatMoney(item.data.ex.amount, item.data.ex.currency ?? DEFAULT_CURRENCY);
                  return (
                    <Pressable
                      key={isTime ? `t-${item.data.te.id}` : `e-${item.data.ex.id}`}
                      onPress={() => isTime
                        ? handleEditUnbilledTime(item.data.te, { caseId: item.data.caseId, caseName: item.data.caseName, caseNumber: item.data.caseNumber })
                        : handleEditUnbilledExpense(item.data.ex, { caseId: item.data.caseId, caseName: item.data.caseName, caseNumber: item.data.caseNumber })
                      }
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        backgroundColor: pressed ? "#FBF7EE" : "#FFFFFF",
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "#F0EAE0",
                        marginBottom: 10,
                        overflow: "hidden",
                        shadowColor: "#7B6B3F",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 3,
                        elevation: 1,
                      })}
                    >
                      {/* Left rail — golden for time, green for expense */}
                      <View style={{ width: 4, backgroundColor: railColor }} />

                      <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12 }}>
                        {/* Top row: big bold quantity (hours or amount) on the
                            left with a tiny uppercase label beneath it; date
                            right-aligned. Anchors the row visually so users
                            can scan numbers/dates column-to-column. */}
                        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 18,
                                fontWeight: "800",
                                color: colors.navy.DEFAULT,
                                fontVariant: ["tabular-nums"],
                                letterSpacing: 0.2,
                                lineHeight: 22,
                              }}
                            >
                              {big}
                            </Text>
                            <Text
                              style={{
                                fontSize: 9,
                                fontWeight: "800",
                                color: tintFg,
                                letterSpacing: 0.7,
                                textTransform: "uppercase",
                                marginTop: 1,
                              }}
                            >
                              {kindLabel}
                            </Text>
                          </View>
                          <View style={{ alignItems: "flex-end", marginTop: 3 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Ionicons name={"calendar-outline" as IoniconsName} size={11} color="#A89F8F" />
                              <Text style={{ fontSize: 11, color: "#A89F8F", fontVariant: ["tabular-nums"] }}>
                                {formatDateDisplay(date)}
                              </Text>
                            </View>
                            {!isTime && item.data.ex.category && (
                              <View
                                style={{
                                  marginTop: 4,
                                  alignSelf: "flex-end",
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                                  backgroundColor: tintBg,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 9,
                                    fontWeight: "800",
                                    color: tintFg,
                                    letterSpacing: 0.6,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {tc(`billing.categories.${item.data.ex.category}`, { defaultValue: item.data.ex.category })}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Hairline separator + description body. The trash
                            sits at the right end of the description line — same
                            visual baseline as the body text it deletes. */}
                        <View style={{ height: 1, backgroundColor: "#F2ECDF", marginTop: 10, marginBottom: 10 }} />
                        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                          <Text
                            style={{ flex: 1, fontSize: 13, color: colors.navy.DEFAULT, lineHeight: 18 }}
                            numberOfLines={2}
                          >
                            {description}
                          </Text>
                          {/* Delete affordance — anchored to the right of the
                              description line. `stopPropagation` keeps the
                              parent row's tap-to-edit from firing. */}
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              setDeleteUnbilledConfirm({
                                kind: isTime ? "time" : "expense",
                                id: isTime ? item.data.te.id : item.data.ex.id,
                                description: (isTime ? item.data.te.description : item.data.ex.description) || "",
                              });
                            }}
                            hitSlop={8}
                            style={({ pressed }) => ({
                              padding: 4,
                              borderRadius: 6,
                              backgroundColor: pressed ? "#FFE9E9" : "transparent",
                            })}
                          >
                            <Ionicons name={"trash-outline" as IoniconsName} size={16} color="#C9A3A3" />
                          </Pressable>
                        </View>

                        {/* Case chip — small folder icon + case number/title in
                            golden, anchoring the row to its case origin. */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 10,
                            alignSelf: "flex-start",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                            backgroundColor: colors.golden[50],
                          }}
                        >
                          <Ionicons name={"folder-outline" as IoniconsName} size={11} color={colors.golden.DEFAULT} />
                          <Text style={{ fontSize: 11, color: colors.golden.DEFAULT, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                            {item.data.caseNumber}
                          </Text>
                          <Text style={{ fontSize: 11, color: "#7B6B3F", fontWeight: "500", flexShrink: 1 }} numberOfLines={1}>
                            · {item.data.caseName}
                          </Text>
                        </View>
                      </View>

                    </Pressable>
                  );
                })}
                {/* Create-invoice CTA — runs through the smart case picker */}
                <Pressable
                  onPress={() => startActionForCase('invoice')}
                  disabled={cases.length === 0}
                  style={{
                    marginTop: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    backgroundColor: cases.length === 0 ? "#E0D9CC" : colors.golden.DEFAULT,
                    borderRadius: 12,
                    paddingVertical: 14,
                    opacity: cases.length === 0 ? 0.6 : 1,
                  }}
                >
                  <Ionicons name={"document-text-outline" as IoniconsName} size={18} color="#FFFFFF" />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
                    {tc("billing.createInvoice")}
                  </Text>
                </Pressable>
              </>
            );
          })()}
        </View>

        {/* ───── Neplacene fakture (mirrors case overview, aggregated) ─────
            Lists every non-fully-paid invoice across all of the client's
            cases, with the centered red total banner and the same row card
            design used on the case overview. */}
        {(() => {
          const unpaid = clientInvoices
            .filter((inv) => inv.paidAmount < inv.total)
            .sort((a, b) => b.issuedDate.localeCompare(a.issuedDate));
          const unpaidTotal = unpaid.reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);
          return (
            <View style={SECTION_CARD}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Ionicons name={"receipt-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
                  {tc("billing.unpaidInvoicesTitle")}
                </Text>
              </View>

              {unpaid.length > 0 && (
                <View
                  style={{
                    backgroundColor: "#FFF5F5",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#E53935",
                    padding: 10,
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 11, color: "#B1362F", fontWeight: "600" }}>
                    {tc("billing.remaining")}
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#E53935", marginTop: 2 }}>
                    {formatMoney(unpaidTotal, "RSD")}
                  </Text>
                </View>
              )}

              {unpaid.length === 0 ? (
                <View
                  style={{
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: "#E0D9CC",
                    borderRadius: 12,
                    paddingVertical: 20,
                    alignItems: "center",
                    backgroundColor: "#FBFAF5",
                  }}
                >
                  <Ionicons name={"checkmark-circle-outline" as IoniconsName} size={28} color="#2E7D32" />
                  <Text style={{ fontSize: 13, color: "#8B8373", marginTop: 8, textAlign: "center", paddingHorizontal: 16 }}>
                    {tc("billing.noUnpaidInvoices")}
                  </Text>
                </View>
              ) : (
                <>
                  {unpaid.slice(0, 3).map((inv) => {
                    const statusColor = INVOICE_STATUS_COLORS[inv.status];
                    const remaining = inv.total - inv.paidAmount;
                    const paidPct = inv.total > 0 ? Math.max(0, Math.min(100, (inv.paidAmount / inv.total) * 100)) : 0;
                    const isOverdue = inv.status === "overdue";
                    const accentMoney = isOverdue ? "#C62828" : colors.navy.DEFAULT;
                    return (
                      <Pressable
                        key={inv.id}
                        onPress={() => router.push({
                          pathname: "/(tabs)/more/billing/[id]",
                          params: { id: inv.id, returnTo: `/(tabs)/clients/${id}` },
                        })}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          backgroundColor: pressed ? "#FBF7EE" : "#FFFFFF",
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: "#F0EAE0",
                          marginBottom: 10,
                          overflow: "hidden",
                          shadowColor: "#7B6B3F",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 3,
                          elevation: 1,
                        })}
                      >
                        <View style={{ width: 4, backgroundColor: statusColor.text }} />
                        <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12 }}>
                          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, fontVariant: ["tabular-nums"], letterSpacing: 0.3 }}>
                                {inv.invoiceNumber}
                              </Text>
                              {/* Status pill on its own line, self-sized so it
                                  doesn't stretch full-width. */}
                              <View
                                style={{
                                  alignSelf: "flex-start",
                                  paddingHorizontal: 7,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                                  backgroundColor: statusColor.bg,
                                  marginTop: 4,
                                }}
                              >
                                <Text style={{ fontSize: 9, fontWeight: "800", color: statusColor.text, letterSpacing: 0.7, textTransform: "uppercase" }}>
                                  {tb(`status.${inv.status}`, { defaultValue: inv.status })}
                                </Text>
                              </View>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                                <Ionicons name={"calendar-outline" as IoniconsName} size={11} color="#A89F8F" />
                                <Text style={{ fontSize: 11, color: "#A89F8F", fontVariant: ["tabular-nums"] }}>
                                  {formatDateDisplay(inv.issuedDate)}
                                </Text>
                                <Text style={{ fontSize: 11, color: colors.golden.DEFAULT, fontWeight: "600" }} numberOfLines={1}>
                                  · {inv.caseName}
                                </Text>
                              </View>
                            </View>
                            <View style={{ alignItems: "flex-end" }}>
                              <Text style={{ fontSize: 9, fontWeight: "700", color: "#A89F8F", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 1 }}>
                                {tc("billing.remaining")}
                              </Text>
                              <Text style={{ fontSize: 17, fontWeight: "800", color: accentMoney, fontVariant: ["tabular-nums"], lineHeight: 20 }}>
                                {formatMoney(remaining, "RSD")}
                              </Text>
                            </View>
                          </View>
                          {inv.total > 0 && (
                            <View style={{ marginTop: 12 }}>
                              <View style={{ height: 4, backgroundColor: "#F2ECDF", borderRadius: 2, overflow: "hidden" }}>
                                <View style={{ width: `${paidPct}%`, height: "100%", backgroundColor: paidPct >= 100 ? "#43A047" : colors.golden.DEFAULT }} />
                              </View>
                              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 5 }}>
                                <Text style={{ fontSize: 10, color: "#A89F8F", letterSpacing: 0.4, fontVariant: ["tabular-nums"] }}>
                                  {tc("billing.percentPaid", { percent: Math.round(paidPct) })}
                                </Text>
                                <Text style={{ fontSize: 10, color: "#A89F8F", fontVariant: ["tabular-nums"] }}>
                                  {formatMoney(inv.paidAmount, "RSD")} / {formatMoney(inv.total, "RSD")}
                                </Text>
                              </View>
                            </View>
                          )}
                          {inv.notes && (
                            <View style={{ flexDirection: "row", marginTop: 12, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: colors.golden.DEFAULT }}>
                              <Text style={{ flex: 1, fontSize: 12, lineHeight: 17, color: "#6B6558", fontStyle: "italic" }} numberOfLines={2}>
                                {inv.notes}
                              </Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    onPress={() => router.push({
                      pathname: "/(tabs)/more/billing",
                      params: { clientId: id!, returnTo: `/(tabs)/clients/${id}` },
                    })}
                    style={{
                      marginTop: 4,
                      paddingVertical: 8,
                      alignItems: "center",
                      backgroundColor: colors.golden[50],
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>
                      {tc("billing.viewAllInvoices")}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          );
        })()}
      </ScrollView>

      {/* Case picker modal — opens before Add Time / Add Expense forms.
          On selection, the corresponding inline form modal opens so the user
          stays on the client overview through the whole flow. */}
      <Modal visible={casePickerMode !== null} animationType="slide" transparent onRequestClose={() => setCasePickerMode(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 + insets.bottom, maxHeight: "80%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy.DEFAULT }}>
                {t("expenses.selectCase")}
              </Text>
              <Pressable onPress={() => setCasePickerMode(null)}>
                <Ionicons name={"close" as IoniconsName} size={24} color="#AAA" />
              </Pressable>
            </View>
            <Text style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
              {t("expenses.selectCaseHint")}
            </Text>
            {cases.length === 0 ? (
              <EmptyState icon={"folder-open-outline" as IoniconsName} text={t("expenses.noCases")} />
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {cases.map((cs) => (
                  <Pressable
                    key={cs.id}
                    onPress={() => handleCaseSelected(cs)}
                    style={{
                      backgroundColor: "#FAFAFA",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: "#F0EAE0",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Ionicons name={"folder-outline" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy.DEFAULT }} numberOfLines={1}>
                        {cs.title}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#888", marginTop: 2 }} numberOfLines={1}>
                        {cs.caseNumber}
                      </Text>
                    </View>
                    <Ionicons name={"chevron-forward" as IoniconsName} size={16} color="#CCC" />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Communication Modal */}
      <Modal visible={showCommModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 + insets.bottom }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy.DEFAULT }}>
                {t("communication.addCommunication")}
              </Text>
              <Pressable onPress={() => setShowCommModal(false)}>
                <Ionicons name={"close" as IoniconsName} size={24} color="#AAA" />
              </Pressable>
            </View>

            {/* Type chips */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {(["call", "meeting", "email", "note"] as CommunicationEntry['type'][]).map((ct) => {
                const isActive = commType === ct;
                return (
                  <Pressable
                    key={ct}
                    onPress={() => setCommType(ct)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: isActive ? colors.golden[50] : "#F5F5F5",
                      borderWidth: 1,
                      borderColor: isActive ? colors.golden.DEFAULT : "#E5E5E5",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name={COMM_TYPE_ICONS[ct]} size={18} color={isActive ? colors.golden.DEFAULT : "#888"} />
                    <Text style={{ fontSize: 11, fontWeight: "600", color: isActive ? colors.golden.DEFAULT : "#888", marginTop: 4 }}>
                      {t("communication." + ct)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("communication.subject")}
            </Text>
            <TextInput
              value={commSubject}
              onChangeText={setCommSubject}
              placeholder={t("communication.subject")}
              placeholderTextColor="#CCC"
              style={{
                backgroundColor: "#F9F9F9",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: colors.navy.DEFAULT,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("communication.content")}
            </Text>
            <TextInput
              value={commContent}
              onChangeText={setCommContent}
              placeholder={t("communication.content")}
              placeholderTextColor="#CCC"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{
                backgroundColor: "#F9F9F9",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: colors.navy.DEFAULT,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                marginBottom: 16,
                minHeight: 80,
              }}
            />

            <Pressable
              onPress={handleAddCommunication}
              style={{
                backgroundColor: colors.golden.DEFAULT,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>{t("form.save")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add Contact Modal (Corporate) */}
      <Modal visible={showContactModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 + insets.bottom }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy.DEFAULT }}>
                {t("contacts.addContact")}
              </Text>
              <Pressable onPress={() => setShowContactModal(false)}>
                <Ionicons name={"close" as IoniconsName} size={24} color="#AAA" />
              </Pressable>
            </View>

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("form.representativeName")} *
            </Text>
            <TextInput
              value={contactName}
              onChangeText={setContactName}
              placeholder={t("form.representativeName")}
              placeholderTextColor="#CCC"
              style={{
                backgroundColor: "#F9F9F9",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: colors.navy.DEFAULT,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("form.representativeRole")} *
            </Text>
            <TextInput
              value={contactRole}
              onChangeText={setContactRole}
              placeholder={t("form.representativeRole")}
              placeholderTextColor="#CCC"
              style={{
                backgroundColor: "#F9F9F9",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: colors.navy.DEFAULT,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("form.phone")}
            </Text>
            <TextInput
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder={t("form.phone")}
              placeholderTextColor="#CCC"
              keyboardType="phone-pad"
              style={{
                backgroundColor: "#F9F9F9",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: colors.navy.DEFAULT,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("form.email")}
            </Text>
            <TextInput
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder={t("form.email")}
              placeholderTextColor="#CCC"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: "#F9F9F9",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: colors.navy.DEFAULT,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                marginBottom: 16,
              }}
            />

            <Pressable
              onPress={handleAddContact}
              style={{
                backgroundColor: colors.golden.DEFAULT,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>{t("form.save")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal visible={previewDoc !== null} animationType="fade" transparent onRequestClose={() => setPreviewDoc(null)}>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <Pressable
            onPress={() => setPreviewDoc(null)}
            hitSlop={12}
            style={{ position: "absolute", top: 40 + insets.top, right: 16, zIndex: 10, padding: 6, backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 20 }}
          >
            <Ionicons name={"close" as IoniconsName} size={26} color="#FFFFFF" />
          </Pressable>
          {previewDoc && (
            <Image
              source={{ uri: previewDoc.uri }}
              style={{ width: Dimensions.get("window").width, height: "100%" }}
              resizeMode="contain"
            />
          )}
          {previewDoc && (
            <View style={{ position: "absolute", bottom: 20 + insets.bottom, left: 16, right: 16 }}>
              <Text numberOfLines={2} style={{ fontSize: 14, color: "#FFFFFF", textAlign: "center" }}>
                {previewDoc.name}
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Add Time Entry Modal — fires after a case is chosen via the picker.
          Mirrors the case overview's modal one-to-one (uses cases.json keys). */}
      <Modal visible={addingTime} animationType="slide" transparent onRequestClose={() => { setAddingTime(false); setTargetCase(null); setEditingTimeId(null); }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 + insets.bottom }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy.DEFAULT }}>
                {tc("billing.addTime")}
              </Text>
              <Pressable onPress={() => { setAddingTime(false); setTargetCase(null); setEditingTimeId(null); }}>
                <Ionicons name={"close" as IoniconsName} size={24} color="#AAA" />
              </Pressable>
            </View>

            {targetCase && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FBFAF5", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: "#F0EAE0" }}>
                <Ionicons name={"folder-outline" as IoniconsName} size={16} color={colors.golden.DEFAULT} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: "#888" }}>{tc("billing.selectCase")}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy.DEFAULT }} numberOfLines={1}>
                    {targetCase.title} ({targetCase.caseNumber})
                  </Text>
                </View>
                <Pressable onPress={() => { setAddingTime(false); setCasePickerMode('time'); }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.golden.DEFAULT }}>{tc("billing.changeCase")}</Text>
                </Pressable>
              </View>
            )}

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {tc("billing.hours")}
            </Text>
            <TextInput
              value={timeHours}
              onChangeText={setTimeHours}
              placeholder="0.0"
              placeholderTextColor="#CCC"
              keyboardType="decimal-pad"
              style={{ backgroundColor: "#F9F9F9", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.navy.DEFAULT, borderWidth: 1, borderColor: "#E5E5E5", marginBottom: 12 }}
            />

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "#E5E5E5" }}>
              <Pressable
                onPress={() => setTimeBillable(true)}
                style={{ flex: 1, backgroundColor: timeBillable ? "#E8F5E9" : "#F9F9F9", paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: timeBillable ? "#2E7D32" : "#AAA" }}>{tc("billing.billable")}</Text>
              </Pressable>
              <Pressable
                onPress={() => setTimeBillable(false)}
                style={{ flex: 1, backgroundColor: !timeBillable ? "#ECEFF1" : "#F9F9F9", paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: !timeBillable ? "#546E7A" : "#AAA" }}>{tc("billing.nonBillable")}</Text>
              </Pressable>
            </View>

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {tc("billing.description")}
            </Text>
            <TextInput
              value={timeDescription}
              onChangeText={setTimeDescription}
              placeholder={tc("billing.description")}
              placeholderTextColor="#CCC"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              style={{ backgroundColor: "#F9F9F9", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.navy.DEFAULT, borderWidth: 1, borderColor: "#E5E5E5", marginBottom: 12, minHeight: 60 }}
            />

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {tc("billing.datetime")}
            </Text>
            <Pressable
              onPress={() => setShowTimeDatePicker("date")}
              style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F9F9F9", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "#E5E5E5", marginBottom: 16 }}
            >
              <Ionicons name={"calendar-outline" as IoniconsName} size={16} color={colors.golden.DEFAULT} />
              <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>
                {formatDateTimeShort(timeDate)}
              </Text>
            </Pressable>
            {showTimeDatePicker && (
              <DateTimePicker
                value={timeDate}
                mode={showTimeDatePicker}
                is24Hour
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_event: DateTimePickerEvent, selected?: Date) => {
                  const nextStage = showTimeDatePicker;
                  setShowTimeDatePicker(Platform.OS === "ios" ? nextStage : null);
                  if (selected) {
                    const merged = mergeDateTime(timeDate, selected, nextStage);
                    setTimeDate(merged);
                    if (Platform.OS !== "ios" && nextStage === "date") {
                      setShowTimeDatePicker("time");
                    }
                  }
                }}
              />
            )}

            <Pressable
              onPress={handleAddTimeEntry}
              style={{ backgroundColor: colors.golden.DEFAULT, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>{tc("form.save")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add Expense Modal */}
      <Modal visible={addingExpense} animationType="slide" transparent onRequestClose={() => { setAddingExpense(false); setTargetCase(null); setEditingExpenseId(null); }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 + insets.bottom }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy.DEFAULT }}>
                {tc("billing.addExpense")}
              </Text>
              <Pressable onPress={() => { setAddingExpense(false); setTargetCase(null); setEditingExpenseId(null); }}>
                <Ionicons name={"close" as IoniconsName} size={24} color="#AAA" />
              </Pressable>
            </View>

            {targetCase && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FBFAF5", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: "#F0EAE0" }}>
                <Ionicons name={"folder-outline" as IoniconsName} size={16} color={colors.golden.DEFAULT} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: "#888" }}>{tc("billing.selectCase")}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy.DEFAULT }} numberOfLines={1}>
                    {targetCase.title} ({targetCase.caseNumber})
                  </Text>
                </View>
                <Pressable onPress={() => { setAddingExpense(false); setCasePickerMode('expense'); }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.golden.DEFAULT }}>{tc("billing.changeCase")}</Text>
                </Pressable>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {SUPPORTED_CURRENCIES.map((cur) => {
                const isActive = expenseCurrency === cur;
                return (
                  <Pressable
                    key={cur}
                    onPress={() => setExpenseCurrency(cur)}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: isActive ? colors.golden[50] : "#F5F5F5", borderWidth: 1, borderColor: isActive ? colors.golden.DEFAULT : "#E5E5E5", alignItems: "center" }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: isActive ? colors.golden.DEFAULT : "#888" }}>{cur}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {tc("billing.amount")}
            </Text>
            <TextInput
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              placeholder="0"
              placeholderTextColor="#CCC"
              keyboardType="decimal-pad"
              style={{ backgroundColor: "#F9F9F9", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.navy.DEFAULT, borderWidth: 1, borderColor: "#E5E5E5", marginBottom: 12 }}
            />

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {tc("billing.description")}
            </Text>
            <TextInput
              value={expenseDescription}
              onChangeText={setExpenseDescription}
              placeholder={tc("billing.description")}
              placeholderTextColor="#CCC"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              style={{ backgroundColor: "#F9F9F9", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.navy.DEFAULT, borderWidth: 1, borderColor: "#E5E5E5", marginBottom: 12, minHeight: 60 }}
            />

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {tc("billing.category")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {EXPENSE_CATEGORIES.map((cat) => {
                const isActive = expenseCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setExpenseCategory(cat)}
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: isActive ? colors.golden.DEFAULT : "#E5E5E5", backgroundColor: isActive ? colors.golden[50] : "#F9F9F9" }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: isActive ? colors.golden.DEFAULT : "#888" }}>
                      {tc(`billing.categories.${cat}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {expenseCategory === "custom" && (
              <TextInput
                value={expenseCustomCategory}
                onChangeText={setExpenseCustomCategory}
                placeholder={tc("billing.category")}
                placeholderTextColor="#CCC"
                style={{ backgroundColor: "#F9F9F9", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.navy.DEFAULT, borderWidth: 1, borderColor: "#E5E5E5", marginBottom: 12 }}
              />
            )}

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {tc("billing.datetime")}
            </Text>
            <Pressable
              onPress={() => setShowExpenseDatePicker("date")}
              style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F9F9F9", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "#E5E5E5", marginBottom: 16 }}
            >
              <Ionicons name={"calendar-outline" as IoniconsName} size={16} color={colors.golden.DEFAULT} />
              <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>
                {formatDateTimeShort(expenseDate)}
              </Text>
            </Pressable>
            {showExpenseDatePicker && (
              <DateTimePicker
                value={expenseDate}
                mode={showExpenseDatePicker}
                is24Hour
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_event: DateTimePickerEvent, selected?: Date) => {
                  const nextStage = showExpenseDatePicker;
                  setShowExpenseDatePicker(Platform.OS === "ios" ? nextStage : null);
                  if (selected) {
                    const merged = mergeDateTime(expenseDate, selected, nextStage);
                    setExpenseDate(merged);
                    if (Platform.OS !== "ios" && nextStage === "date") {
                      setShowExpenseDatePicker("time");
                    }
                  }
                }}
              />
            )}

            <Pressable
              onPress={handleAddExpense}
              style={{ backgroundColor: colors.golden.DEFAULT, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>{tc("form.save")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <DeleteConfirmDialog
        visible={deleteUnbilledConfirm !== null}
        onCancel={() => setDeleteUnbilledConfirm(null)}
        onConfirm={confirmDeleteUnbilled}
        title={tc("billing.delete")}
        body={
          deleteUnbilledConfirm?.description
            ? `${tc("billing.deleteConfirm")}\n\n"${deleteUnbilledConfirm.description}"`
            : tc("billing.deleteConfirm")
        }
        confirmLabel={tc("billing.delete")}
      />

    </>
  );
}

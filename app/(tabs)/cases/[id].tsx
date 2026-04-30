import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, Linking, Platform, Modal, KeyboardAvoidingView, Image, Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { useState, useCallback, useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from "expo-router";
import { useReturnBack } from "../../../src/hooks/useReturnBack";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import * as FileSystem from "expo-file-system/legacy";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useServices } from "../../../src/hooks/useServices";
import { colors } from "../../../src/theme/tokens";
import { DirectoryPicker, type DirectoryEntry, type DirectoryPickerKind } from "../../../src/components/ui/DirectoryPicker";
import { DeleteConfirmDialog } from "../../../src/components/ui/DeleteConfirmDialog";
import type { CaseSummary, CaseStatus, Document, CalendarEvent, CaseNote, TimeEntry, Expense, ExpenseCategory, CaseLink, CaseLinkType, Client, Currency, Invoice } from "../../../src/services/types";
import { STATUS_COLORS, STATUS_TRANSITIONS, formatFileSize, DOC_TYPE_ICONS, EVENT_TYPE_COLORS, PREDEFINED_TAGS, CASE_TYPE_SUBTYPES_TREE, EXPENSE_CATEGORIES, CASE_LINK_TYPES, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, INVOICE_STATUS_COLORS, formatMoney } from "../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const STATUS_ICONS: Record<CaseStatus, IoniconsName> = {
  new: "sparkles-outline" as IoniconsName,
  active: "play-circle-outline" as IoniconsName,
  pending: "pause-circle-outline" as IoniconsName,
  closed: "checkmark-circle-outline" as IoniconsName,
  archived: "archive-outline" as IoniconsName,
};

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

// Static waveform bar heights (consistent pattern for voice note visualization)
const WAVEFORM_BARS = [0.3, 0.5, 0.8, 0.6, 0.9, 0.4, 0.7, 1.0, 0.5, 0.3, 0.6, 0.8, 0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8, 0.5, 0.7, 0.4, 0.6, 0.9, 0.3];

function InfoRow({ icon, label, value, onPress, linkColor }: {
  icon: IoniconsName;
  label: string;
  value?: string;
  onPress?: () => void;
  linkColor?: string;
}) {
  if (!value) return null;
  const content = (
    <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
      <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
        <Ionicons name={icon} size={16} color={linkColor ?? "#AAA"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: linkColor ?? colors.navy.DEFAULT, fontWeight: linkColor ? "600" : "400", textDecorationLine: linkColor ? "underline" : "none" }}>
          {value}
        </Text>
      </View>
      {onPress && (
        <Ionicons name={"chevron-forward" as IoniconsName} size={14} color="#DDD" style={{ marginTop: 8 }} />
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

function EditableInfoRow({ icon, label, value, placeholder, onSave, linkColor, onLinkPress }: {
  icon: IoniconsName;
  label: string;
  value?: string;
  placeholder: string;
  onSave: (newValue: string) => void;
  linkColor?: string;
  onLinkPress?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? "");

  const handleSave = () => {
    onSave(editValue.trim());
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value ?? "");
    setEditing(false);
  };

  if (editing) {
    return (
      <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.golden.DEFAULT, backgroundColor: colors.golden[50] + "40", paddingHorizontal: 4, borderRadius: 4, marginHorizontal: -4 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
            <Ionicons name={icon} size={16} color={colors.golden.DEFAULT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: colors.golden.DEFAULT, marginBottom: 2 }}>{label}</Text>
            <TextInput
              style={{ fontSize: 14, color: colors.navy.DEFAULT, padding: 0, minHeight: 20 }}
              value={editValue}
              onChangeText={setEditValue}
              autoFocus={true}
              placeholder={placeholder}
              placeholderTextColor="#CCC"
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8, paddingRight: 4 }}>
          <Pressable onPress={handleCancel} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name={"close-outline" as IoniconsName} size={18} color="#AAA" />
          </Pressable>
          <Pressable onPress={handleSave} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name={"checkmark-outline" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
          </Pressable>
        </View>
      </View>
    );
  }

  const hasLink = Boolean(value && linkColor && onLinkPress);

  if (hasLink) {
    return (
      <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
        <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
          <Ionicons name={icon} size={16} color={linkColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{label}</Text>
          <Pressable onPress={onLinkPress}>
            <Text style={{ fontSize: 14, color: linkColor, fontWeight: "600", textDecorationLine: "underline" }}>
              {value}
            </Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => { setEditValue(value ?? ""); setEditing(true); }}
          hitSlop={8}
          style={{ padding: 4, marginTop: 4 }}
        >
          <Ionicons name={"pencil-outline" as IoniconsName} size={14} color="#AAA" />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable onPress={() => { setEditValue(value ?? ""); setEditing(true); }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
        <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
          <Ionicons name={icon} size={16} color={value ? "#AAA" : "#CCC"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{label}</Text>
          {value ? (
            <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>{value}</Text>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 14, color: "#CCC", fontStyle: "italic" }}>{placeholder}</Text>
              <Ionicons name={"pencil-outline" as IoniconsName} size={12} color="#CCC" />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function formatDateTimeShort(value: Date): string {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function formatDateOnly(value: Date): string {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  return `${day}.${month}.${year}`;
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

function parseIsoOrDate(input: string | undefined): Date {
  if (!input) return new Date();
  const d = new Date(input);
  if (!isNaN(d.getTime())) return d;
  return new Date();
}

type CaseActivity = {
  id: string;
  title: string;
  date: string;
  icon: IoniconsName;
  eventId?: string;
};

function CaseActivityRow({ item, isLast, onPress }: { item: CaseActivity; isLast: boolean; onPress?: () => void }) {
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
        <Ionicons name={item.icon} size={16} color={colors.golden.DEFAULT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT }} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 11, color: "#A89F8F", marginTop: 2, fontVariant: ["tabular-nums"] }}>
          {formatDateTimeShort(parseIsoOrDate(item.date))}
        </Text>
      </View>
      {onPress && (
        <Ionicons name={"chevron-forward" as IoniconsName} size={14} color="#DDD" style={{ marginTop: 8 }} />
      )}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

function DirectoryLinkRow({ icon, label, value, placeholder, onEdit, onLinkPress }: {
  icon: IoniconsName;
  label: string;
  value?: string;
  placeholder: string;
  onEdit: () => void;
  onLinkPress?: () => void;
}) {
  if (!value) {
    return (
      <Pressable onPress={onEdit}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
          <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
            <Ionicons name={icon} size={16} color="#CCC" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{label}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 14, color: "#CCC", fontStyle: "italic" }}>{placeholder}</Text>
              <Ionicons name={"pencil-outline" as IoniconsName} size={12} color="#CCC" />
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
      <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
        <Ionicons name={icon} size={16} color={onLinkPress ? colors.golden.DEFAULT : "#AAA"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{label}</Text>
        {onLinkPress ? (
          <Pressable onPress={onLinkPress}>
            <Text style={{ fontSize: 14, color: colors.golden.DEFAULT, fontWeight: "600", textDecorationLine: "underline" }}>
              {value}
            </Text>
          </Pressable>
        ) : (
          <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>{value}</Text>
        )}
      </View>
      <Pressable onPress={onEdit} hitSlop={8} style={{ padding: 4, marginTop: 4 }}>
        <Ionicons name={"pencil-outline" as IoniconsName} size={14} color="#AAA" />
      </Pressable>
    </View>
  );
}

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("cases");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { goBack, returnTo } = useReturnBack();

  const { t: td } = useTranslation("documents");
  const { t: tc } = useTranslation("calendar");
  const { t: tb } = useTranslation("billing");

  const [caseData, setCaseData] = useState<CaseSummary | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [caseEvents, setCaseEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  // Invoices for this case — fed by the same fetch that drives the unbilled
  // filter; surfaced on the "Neplacene fakture" card just below the unbilled
  // items card.
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [clientData, setClientData] = useState<Client | null>(null);

  // Notes state
  const [addingNote, setAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");

  // Tags state
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [customTagText, setCustomTagText] = useState("");

  // Tree picker state
  const [showTreePicker, setShowTreePicker] = useState(false);

  // Billing state
  const [addingTime, setAddingTime] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [timeHours, setTimeHours] = useState("");
  const [timeDescription, setTimeDescription] = useState("");
  const [timeDate, setTimeDate] = useState<Date>(() => new Date());
  const [timeBillable, setTimeBillable] = useState(true);
  const [showTimeDatePicker, setShowTimeDatePicker] = useState<"date" | "time" | null>(null);
  // Edit-mode ids — when set, the existing Add Time / Add Expense modals
  // operate in update mode against the captured id instead of creating a
  // new record.
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("court-fees");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState<Date>(() => new Date());
  const [expenseCurrency, setExpenseCurrency] = useState<Currency>(DEFAULT_CURRENCY);
  const [showExpenseDatePicker, setShowExpenseDatePicker] = useState<"date" | "time" | null>(null);
  const [expenseCustomCategory, setExpenseCustomCategory] = useState("");

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Voice playback state
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Dictation state
  const [isDictating, setIsDictating] = useState(false);
  const dictationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Related cases state
  const [caseLinksData, setCaseLinksData] = useState<Array<CaseLink & { linkedCase: CaseSummary }>>([]);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const [allCases, setAllCases] = useState<CaseSummary[]>([]);
  const [selectedLinkCase, setSelectedLinkCase] = useState<CaseSummary | null>(null);
  const [selectedLinkType, setSelectedLinkType] = useState<CaseLinkType>("related");

  // Directory picker state
  const [pickerKind, setPickerKind] = useState<DirectoryPickerKind | null>(null);
  const [pickerField, setPickerField] = useState<"court" | "judge" | "opposingPartyRepresentative" | null>(null);

  // Paid-confirm dialog state

  // Delete-confirm dialog state (shared across billing entries, notes, case links)
  const [deleteConfirm, setDeleteConfirm] = useState<
    | { kind: "expense" | "time" | "note" | "link"; id: string }
    | null
  >(null);

  // Items that have already been added to an invoice for this case — they're
  // filtered out of the "Nefakturisani troskovi" card so only unbilled work
  // remains visible.
  const filterUnbilled = (
    te: TimeEntry[],
    ex: Expense[],
    invs: Invoice[],
  ): { te: TimeEntry[]; ex: Expense[] } => {
    const billed = new Set<string>();
    for (const inv of invs) {
      for (const li of inv.lineItems) {
        if (li.type === "time-entry" || li.type === "expense") billed.add(li.referenceId);
      }
    }
    return {
      te: te.filter((t) => !billed.has(t.id)),
      ex: ex.filter((e) => !billed.has(e.id)),
    };
  };

  const loadCase = useCallback(async () => {
    if (!id) return;
    const [data, docs, events, caseNotes, caseTimeEntries, caseExpenses, caseLinksList, caseInvoices] = await Promise.all([
      services.cases.getCaseById(id),
      services.documents.getDocumentsByCaseId(id),
      services.calendarEvents.getEventsByCaseId(id),
      services.caseNotes.getNotesByCaseId(id),
      services.timeEntries.getTimeEntriesByCaseId(id),
      services.expenses.getExpensesByCaseId(id),
      services.caseLinks.getLinksByCaseId(id),
      services.billing.getInvoicesByCaseId(id),
    ]);
    const filtered = filterUnbilled(caseTimeEntries, caseExpenses, caseInvoices);
    setCaseData(data);
    setDocuments(docs);
    setCaseEvents(events);
    setNotes(caseNotes);
    setTimeEntries(filtered.te);
    setExpenses(filtered.ex);
    setInvoices(caseInvoices);
    setCaseLinksData(caseLinksList);
    // Load client data for quick actions
    if (data?.clientId) {
      const client = await services.clients.getClientById(data.clientId);
      setClientData(client);
    }
    setLoading(false);
  }, [id, services]);

  useFocusEffect(
    useCallback(() => {
      loadCase();
    }, [loadCase])
  );

  // Document open: image → in-page preview modal; everything else → system app picker
  // (matches the case-documents page and client overview behavior).
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const mimeFromName = (name: string, fallback: string): string => {
    if (fallback) return fallback;
    const ext = name.toLowerCase().split(".").pop() ?? "";
    switch (ext) {
      case "pdf": return "application/pdf";
      case "doc": return "application/msword";
      case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "txt": return "text/plain";
      case "rtf": return "application/rtf";
      case "csv": return "text/csv";
      case "jpg":
      case "jpeg": return "image/jpeg";
      case "png": return "image/png";
      case "gif": return "image/gif";
      case "webp": return "image/webp";
      default: return "application/octet-stream";
    }
  };

  const handleOpenDoc = async (doc: Document) => {
    if (!doc.uri || doc.uri.startsWith("file://mock/")) {
      Alert.alert(td("cannotOpenTitle"), td("cannotOpenMessage"));
      return;
    }
    if (doc.type === "image") {
      setPreviewDoc(doc);
      return;
    }
    const mimeType = doc.mimeType || mimeFromName(doc.name, "");
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
        await Sharing.shareAsync(doc.uri, { mimeType, dialogTitle: doc.name, UTI: mimeType });
        return;
      }
      const supported = await Linking.canOpenURL(doc.uri);
      if (supported) {
        await Linking.openURL(doc.uri);
      } else {
        Alert.alert(td("cannotOpenTitle"), td("cannotOpenMessage"));
      }
    } catch {
      Alert.alert(td("cannotOpenTitle"), td("cannotOpenMessage"));
    }
  };

  const handleStatusChange = async (newStatus: CaseStatus) => {
    if (!id || statusUpdating) return;
    setStatusUpdating(true);
    try {
      const updated = await services.cases.updateCaseStatus(id, newStatus);
      if (updated) {
        setCaseData(updated);
        Alert.alert(t('detail.statusChanged'));
      }
    } catch {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleInlineFieldSave = async (field: string, newValue: string) => {
    if (!id) return;
    const updated = await services.cases.updateCase(id, { [field]: newValue || undefined });
    if (updated) setCaseData(updated);
  };

  const openPicker = (field: "court" | "judge" | "opposingPartyRepresentative") => {
    setPickerField(field);
    setPickerKind(field === "court" ? "court" : field === "judge" ? "judge" : "lawyer");
  };

  const closePicker = () => {
    setPickerField(null);
    setPickerKind(null);
  };

  const handleDirectorySelect = async (entry: DirectoryEntry) => {
    if (!id || !pickerField) return;
    let patch: Partial<CaseSummary> = {};
    if (pickerField === "court") {
      patch = { court: entry.displayName, courtId: entry.id };
    } else if (pickerField === "judge") {
      patch = { judge: entry.displayName, judgeId: entry.id };
    } else {
      patch = { opposingPartyRepresentative: entry.displayName, opposingPartyRepresentativeId: entry.id };
    }
    const updated = await services.cases.updateCase(id, patch);
    if (updated) setCaseData(updated);
  };

  const handleDirectoryClear = async () => {
    if (!id || !pickerField) return;
    let patch: Partial<CaseSummary> = {};
    if (pickerField === "court") {
      patch = { court: undefined, courtId: undefined };
    } else if (pickerField === "judge") {
      patch = { judge: undefined, judgeId: undefined };
    } else {
      patch = { opposingPartyRepresentative: undefined, opposingPartyRepresentativeId: undefined };
    }
    const updated = await services.cases.updateCase(id, patch);
    if (updated) setCaseData(updated);
  };

  // Notes handlers
  const handleAddNote = async () => {
    if (!id || !newNoteContent.trim()) return;
    await services.caseNotes.createNote({ caseId: id, type: 'text', content: newNoteContent.trim() });
    const refreshed = await services.caseNotes.getNotesByCaseId(id);
    setNotes(refreshed);
    setNewNoteContent("");
    setAddingNote(false);
  };

  const handleEditNote = async (noteId: string) => {
    if (!editNoteContent.trim()) return;
    await services.caseNotes.updateNote(noteId, editNoteContent.trim());
    if (id) {
      const refreshed = await services.caseNotes.getNotesByCaseId(id);
      setNotes(refreshed);
    }
    setEditingNoteId(null);
    setEditNoteContent("");
  };

  const handleDeleteNote = (noteId: string) => {
    setDeleteConfirm({ kind: "note", id: noteId });
  };

  // Tags handlers
  const handleToggleTag = async (tag: string) => {
    if (!id || !caseData) return;
    const currentTags = caseData.tags ?? [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    const updated = await services.cases.updateCase(id, { tags: newTags });
    if (updated) setCaseData(updated);
  };

  const handleRemoveTag = async (tag: string) => {
    if (!id || !caseData) return;
    const newTags = (caseData.tags ?? []).filter((t) => t !== tag);
    const updated = await services.cases.updateCase(id, { tags: newTags });
    if (updated) setCaseData(updated);
  };

  const handleAddCustomTag = async () => {
    if (!id || !caseData || !customTagText.trim()) return;
    const tag = customTagText.trim().toLowerCase();
    const currentTags = caseData.tags ?? [];
    if (currentTags.includes(tag)) { setCustomTagText(""); return; }
    const newTags = [...currentTags, tag];
    const updated = await services.cases.updateCase(id, { tags: newTags });
    if (updated) setCaseData(updated);
    setCustomTagText("");
  };

  // Re-fetch time entries + expenses + invoices and re-apply the unbilled
  // filter. Used after any add/delete so the "Nefakturisani troskovi" card
  // stays consistent with what's actually unbilled.
  const reloadUnbilledEntries = async () => {
    if (!id) return;
    const [te, ex, invs] = await Promise.all([
      services.timeEntries.getTimeEntriesByCaseId(id),
      services.expenses.getExpensesByCaseId(id),
      services.billing.getInvoicesByCaseId(id),
    ]);
    const filtered = filterUnbilled(te, ex, invs);
    setTimeEntries(filtered.te);
    setExpenses(filtered.ex);
    setInvoices(invs);
  };

  // Billing handlers — time entries log hours only; the amount is computed
  // later (when the entry is invoiced under a billing mode that prices it).
  // In edit mode (`editingTimeId` / `editingExpenseId` set) the same form
  // submits an update against that record instead of creating a new one.
  const handleAddTimeEntry = async () => {
    if (!id) return;
    const hours = parseFloat(timeHours);
    if (isNaN(hours) || hours <= 0 || !timeDescription.trim()) return;
    if (editingTimeId) {
      await services.timeEntries.updateTimeEntry(editingTimeId, {
        hours,
        description: timeDescription.trim(),
        date: timeDate.toISOString(),
        billable: timeBillable,
      });
    } else {
      await services.timeEntries.createTimeEntry({
        caseId: id,
        hours,
        description: timeDescription.trim(),
        date: timeDate.toISOString(),
        billable: timeBillable,
      });
    }
    await reloadUnbilledEntries();
    setTimeHours(""); setTimeDescription(""); setTimeDate(new Date()); setTimeBillable(true);
    setEditingTimeId(null);
    setAddingTime(false);
  };

  const handleDeleteTimeEntry = (entryId: string) => {
    setDeleteConfirm({ kind: "time", id: entryId });
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
      await services.expenses.createExpense({
        caseId: id,
        amount,
        currency: expenseCurrency,
        category: expenseCategory,
        description: expenseDescription.trim(),
        date: expenseDate.toISOString(),
      });
    }
    await reloadUnbilledEntries();
    setExpenseAmount(""); setExpenseCategory("court-fees"); setExpenseDescription(""); setExpenseDate(new Date()); setExpenseCustomCategory(""); setExpenseCurrency(DEFAULT_CURRENCY);
    setEditingExpenseId(null);
    setAddingExpense(false);
  };

  // Open the Add modals pre-filled with an existing item's values.
  const handleEditTimeEntry = (te: TimeEntry) => {
    setEditingTimeId(te.id);
    setEditingExpenseId(null);
    setTimeHours(String(te.hours));
    setTimeDescription(te.description ?? "");
    setTimeDate(te.date ? new Date(te.date) : new Date());
    setTimeBillable(te.billable);
    setAddingExpense(false);
    setAddingTime(true);
  };

  const handleEditExpense = (ex: Expense) => {
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

  const handleDeleteExpense = (expenseId: string) => {
    setDeleteConfirm({ kind: "expense", id: expenseId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm || !id) {
      setDeleteConfirm(null);
      return;
    }
    const { kind, id: itemId } = deleteConfirm;
    setDeleteConfirm(null);
    if (kind === "expense") {
      await services.expenses.deleteExpense(itemId);
      await reloadUnbilledEntries();
    } else if (kind === "time") {
      await services.timeEntries.deleteTimeEntry(itemId);
      await reloadUnbilledEntries();
    } else if (kind === "note") {
      await services.caseNotes.deleteNote(itemId);
      const refreshed = await services.caseNotes.getNotesByCaseId(id);
      setNotes(refreshed);
    } else if (kind === "link") {
      await services.caseLinks.deleteLink(itemId);
      const refreshed = await services.caseLinks.getLinksByCaseId(id);
      setCaseLinksData(refreshed);
    }
  };

  const deleteConfirmCopy = (() => {
    switch (deleteConfirm?.kind) {
      case "note":
        return { title: t("notes.deleteNote"), body: t("notes.deleteConfirm"), confirm: t("notes.deleteNote") };
      case "link":
        return { title: t("related.removeLink"), body: t("related.removeLinkConfirm"), confirm: t("related.removeLink") };
      case "expense":
      case "time":
        return { title: t("billing.delete"), body: t("billing.deleteConfirm"), confirm: t("billing.delete") };
      default:
        return { title: t("billing.delete"), body: t("billing.deleteConfirm"), confirm: t("billing.delete") };
    }
  })();

  // Related cases handlers
  const handleOpenLinkPicker = async () => {
    if (!showLinkPicker) {
      const fetchedCases = await services.cases.getCases();
      setAllCases(fetchedCases);
    }
    setShowLinkPicker(!showLinkPicker);
    setLinkSearchQuery("");
    setSelectedLinkCase(null);
    setSelectedLinkType("related");
  };

  const handleConfirmLink = async () => {
    if (!id || !selectedLinkCase) return;
    await services.caseLinks.createLink(id, selectedLinkCase.id, selectedLinkType);
    const refreshed = await services.caseLinks.getLinksByCaseId(id);
    setCaseLinksData(refreshed);
    setShowLinkPicker(false);
    setSelectedLinkCase(null);
    setLinkSearchQuery("");
    setSelectedLinkType("related");
  };

  // Voice recording handlers
  const handleStartRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('notes.recordVoice'), 'Microphone permission is required to record voice notes.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const handleStopRecording = async () => {
    if (!recording || !id) return;
    try {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const durationSeconds = Math.round((status.durationMillis ?? 0) / 1000);
      if (uri) {
        await services.caseNotes.createNote({
          caseId: id,
          type: 'voice',
          audioUri: uri,
          audioDuration: durationSeconds || recordingDuration,
        });
        const refreshed = await services.caseNotes.getNotesByCaseId(id);
        setNotes(refreshed);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save voice note.');
    } finally {
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  // Voice playback handlers
  const handlePlayVoiceNote = async (note: CaseNote) => {
    try {
      // Stop any currently playing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (playingNoteId === note.id) {
        setPlayingNoteId(null);
        setPlaybackProgress(0);
        return;
      }
      if (!note.audioUri) return;
      const { sound } = await Audio.Sound.createAsync({ uri: note.audioUri });
      soundRef.current = sound;
      setPlayingNoteId(note.id);
      setPlaybackProgress(0);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.isPlaying && status.durationMillis) {
            setPlaybackProgress(status.positionMillis / status.durationMillis);
          }
          if (status.didJustFinish) {
            setPlayingNoteId(null);
            setPlaybackProgress(0);
            sound.unloadAsync();
            soundRef.current = null;
          }
        }
      });

      await sound.playAsync();
    } catch (err) {
      Alert.alert('Error', 'Failed to play voice note.');
      setPlayingNoteId(null);
      setPlaybackProgress(0);
    }
  };

  const handlePausePlayback = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setPlayingNoteId(null);
    }
  };

  // Dictation handler (simulated)
  const handleDictation = () => {
    if (isDictating) {
      if (dictationTimerRef.current) {
        clearTimeout(dictationTimerRef.current);
        dictationTimerRef.current = null;
      }
      setIsDictating(false);
      setNewNoteContent((prev) =>
        prev + (prev ? ' ' : '') + '[Dictation: audio recorded - transcription requires backend service]'
      );
      return;
    }
    setIsDictating(true);
    dictationTimerRef.current = setTimeout(() => {
      setIsDictating(false);
      setNewNoteContent((prev) =>
        prev + (prev ? ' ' : '') + '[Dictation: audio recorded - transcription requires backend service]'
      );
      dictationTimerRef.current = null;
    }, 3000);
  };

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (dictationTimerRef.current) {
        clearTimeout(dictationTimerRef.current);
      }
    };
  }, []);

  const handleRemoveLink = (linkId: string) => {
    setDeleteConfirm({ kind: "link", id: linkId });
  };

  if (loading || !caseData) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: "" }} />
        <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
        </View>
      </>
    );
  }

  const statusColor = STATUS_COLORS[caseData.status] ?? STATUS_COLORS.active;
  const statusIcon = STATUS_ICONS[caseData.status] ?? ("help-circle-outline" as IoniconsName);
  const allowedTransitions = STATUS_TRANSITIONS[caseData.status] ?? [];
  const caseTags = caseData.tags ?? [];

  // Tree picker data
  const treeData = caseData.caseType ? CASE_TYPE_SUBTYPES_TREE[caseData.caseType] : null;

  // Billing computed data
  const totalHours = timeEntries.reduce((sum, te) => sum + te.hours, 0);
  const expenseTotalsByCurrency = expenses.reduce<Record<string, number>>((acc, ex) => {
    const c = ex.currency ?? DEFAULT_CURRENCY;
    acc[c] = (acc[c] ?? 0) + ex.amount;
    return acc;
  }, {});
  // Billable time entries with an amount also contribute to the grand total (paid or not)
  for (const te of timeEntries) {
    if (!te.billable || te.amount == null || te.amount <= 0) continue;
    const c = te.currency ?? DEFAULT_CURRENCY;
    expenseTotalsByCurrency[c] = (expenseTotalsByCurrency[c] ?? 0) + te.amount;
  }
  const billingItems: Array<{ type: 'time'; data: TimeEntry } | { type: 'expense'; data: Expense }> = [
    ...timeEntries.map((te) => ({ type: 'time' as const, data: te })),
    ...expenses.map((ex) => ({ type: 'expense' as const, data: ex })),
  ].sort((a, b) => b.data.date.localeCompare(a.data.date));

  // Activity feed — aggregated from notes, past events, documents, time entries, expenses
  const nowIso = new Date().toISOString();
  const recentPool: CaseActivity[] = [
    ...notes.map((n) => ({
      id: `act-note-${n.id}`,
      title: n.type === "voice" ? t("notes.voiceNote") : (n.content ?? ""),
      date: n.createdAt,
      icon: "document-text-outline" as IoniconsName,
    })),
    ...caseEvents
      .filter((e) => e.date < nowIso)
      .map((e) => ({
        id: `act-evt-${e.id}`,
        title: e.title,
        date: e.date,
        icon: "calendar-outline" as IoniconsName,
      })),
    ...documents.map((d) => ({
      id: `act-doc-${d.id}`,
      title: d.name,
      date: d.createdAt,
      icon: "attach-outline" as IoniconsName,
    })),
    ...timeEntries.map((te) => ({
      id: `act-te-${te.id}`,
      title: te.description || `${te.hours.toFixed(1)}h`,
      date: te.date,
      icon: "time-outline" as IoniconsName,
    })),
    ...expenses.map((ex) => ({
      id: `act-exp-${ex.id}`,
      title: ex.description,
      date: ex.date,
      icon: "wallet-outline" as IoniconsName,
    })),
  ];
  const recentActivityItems: CaseActivity[] = recentPool
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const upcomingActivityItems: CaseActivity[] = caseEvents
    .filter((e) => e.date >= nowIso.split("T")[0])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)
    .map((e) => ({
      id: `act-up-${e.id}`,
      title: e.title,
      date: e.date,
      icon: "calendar-outline" as IoniconsName,
      eventId: e.id,
    }));

  // Related cases computed data
  const linkedCaseIds = new Set(caseLinksData.map((l) => l.linkedCase.id));
  const linkSearchResults = linkSearchQuery.trim().length > 0
    ? allCases.filter((c) =>
        c.id !== id &&
        !linkedCaseIds.has(c.id) &&
        (c.caseNumber.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
          c.title.toLowerCase().includes(linkSearchQuery.toLowerCase()))
      )
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      <Stack.Screen
        options={{
          headerTitle: caseData.caseNumber,
          headerLeft: returnTo
            ? () => (
                <Pressable onPress={goBack} style={{ marginLeft: 4, padding: 4 }}>
                  <Ionicons name={"arrow-back" as IoniconsName} size={24} color="#FFFFFF" />
                </Pressable>
              )
            : undefined,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/(tabs)/cases/edit/' + id)}
              style={{ marginRight: 4 }}
            >
              <Ionicons name={"create-outline" as IoniconsName} size={22} color="#FFFFFF" />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View
          style={{
            backgroundColor: statusColor.bg,
            paddingVertical: 14,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Ionicons name={statusIcon} size={20} color={statusColor.text} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: statusColor.text }}>
            {t('status.' + caseData.status)}
          </Text>
        </View>

        {/* Case Info Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 4,
            margin: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: 1,
            borderColor: "#FFF3E0",
          }}
        >
          <InfoRow
            icon={"document-text-outline" as IoniconsName}
            label={t("detail.caseNumber")}
            value={caseData.caseNumber}
          />
          <InfoRow
            icon={"text-outline" as IoniconsName}
            label={t("form.title")}
            value={caseData.title}
          />
          <InfoRow
            icon={"briefcase-outline" as IoniconsName}
            label={t("detail.type")}
            value={t('type.' + caseData.caseType)}
          />
          {caseData.caseSubtype && (
            <Pressable onPress={() => setShowTreePicker(!showTreePicker)}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
                <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
                  <Ionicons name={"layers-outline" as IoniconsName} size={16} color={colors.golden.DEFAULT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{t("detail.subtype")}</Text>
                  <Text style={{ fontSize: 14, color: colors.golden.DEFAULT, fontWeight: "600" }}>
                    {t('subtype.' + caseData.caseSubtype)}
                  </Text>
                </View>
                <Ionicons name={(showTreePicker ? "chevron-up" : "chevron-down") as IoniconsName} size={14} color={colors.golden.DEFAULT} style={{ marginTop: 8 }} />
              </View>
            </Pressable>
          )}

          {/* Tree Picker (inline expandable) */}
          {showTreePicker && treeData && (
            <View style={{ paddingVertical: 8, paddingLeft: 32, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
              <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 6 }}>{t("detail.selectSubtypeDetails")}</Text>
              {Object.entries(treeData.subtypes).map(([subtypeKey, subtypeData]) => {
                const isSelected = caseData.caseSubtype === subtypeKey;
                return (
                  <View key={subtypeKey} style={{ marginBottom: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons
                        name={(isSelected ? "radio-button-on" : "radio-button-off") as IoniconsName}
                        size={14}
                        color={isSelected ? colors.golden.DEFAULT : "#CCC"}
                      />
                      <Text style={{ fontSize: 13, fontWeight: isSelected ? "600" : "400", color: isSelected ? colors.navy.DEFAULT : "#888" }}>
                        {t('subtype.' + subtypeKey)}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={{ paddingLeft: 22, marginTop: 4 }}>
                        {subtypeData.items.map((item) => (
                          <View key={item} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 2 }}>
                            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.golden[500] }} />
                            <Text style={{ fontSize: 12, color: "#888" }}>{t('subtypeItem.' + item)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <InfoRow
            icon={"person-outline" as IoniconsName}
            label={t("detail.client")}
            value={caseData.clientName}
            onPress={() => router.push({ pathname: '/(tabs)/clients/[id]', params: { id: caseData.clientId!, returnTo: `/(tabs)/cases/${id}` } })}
            linkColor={colors.golden.DEFAULT}
          />
          {caseData.opposingParty && (
            <InfoRow
              icon={"people-outline" as IoniconsName}
              label={t("detail.opposingParty")}
              value={caseData.opposingParty}
            />
          )}

          {/* Directory-backed: Opposing Party Representative */}
          <DirectoryLinkRow
            icon={"person-add-outline" as IoniconsName}
            label={t("detail.opposingPartyRep")}
            value={caseData.opposingPartyRepresentative}
            placeholder={t("detail.tapToEdit")}
            onEdit={() => openPicker("opposingPartyRepresentative")}
            onLinkPress={caseData.opposingPartyRepresentativeId ? () => router.push({ pathname: "/(tabs)/more/directory/lawyers", params: { id: caseData.opposingPartyRepresentativeId!, returnTo: `/(tabs)/cases/${id}` } }) : undefined}
          />

          {/* Directory-backed: Court */}
          <DirectoryLinkRow
            icon={"business-outline" as IoniconsName}
            label={t("detail.court")}
            value={caseData.court}
            placeholder={t("detail.tapToEdit")}
            onEdit={() => openPicker("court")}
            onLinkPress={caseData.courtId ? () => router.push({ pathname: "/(tabs)/more/directory/courts", params: { id: caseData.courtId!, returnTo: `/(tabs)/cases/${id}` } }) : undefined}
          />

          {/* Inline Editable: Court Case Number */}
          <EditableInfoRow
            icon={"barcode-outline" as IoniconsName}
            label={t("detail.courtCaseNumber")}
            value={caseData.courtCaseNumber}
            placeholder={t("detail.tapToEdit")}
            onSave={(v) => handleInlineFieldSave("courtCaseNumber", v)}
          />

          {/* Directory-backed: Judge */}
          <DirectoryLinkRow
            icon={"podium-outline" as IoniconsName}
            label={t("detail.judge")}
            value={caseData.judge}
            placeholder={t("detail.tapToEdit")}
            onEdit={() => openPicker("judge")}
            onLinkPress={caseData.judgeId ? () => router.push({ pathname: "/(tabs)/more/directory/judges", params: { id: caseData.judgeId!, returnTo: `/(tabs)/cases/${id}` } }) : undefined}
          />

          {caseData.description && (
            <InfoRow
              icon={"reader-outline" as IoniconsName}
              label={t("detail.description")}
              value={caseData.description}
            />
          )}
        </View>

        {/* Status Workflow Section */}
        <View style={SECTION_CARD}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 12 }}>
            {t("detail.changeStatus")}
          </Text>
          {allowedTransitions.length > 0 ? (
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              {allowedTransitions.map((targetStatus) => {
                const targetColor = STATUS_COLORS[targetStatus] ?? STATUS_COLORS.active;
                const targetIcon = STATUS_ICONS[targetStatus] ?? ("help-circle-outline" as IoniconsName);
                return (
                  <Pressable
                    key={targetStatus}
                    onPress={() => handleStatusChange(targetStatus)}
                    disabled={statusUpdating}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: targetColor.bg,
                      borderRadius: 10,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      gap: 6,
                      opacity: statusUpdating ? 0.6 : 1,
                    }}
                  >
                    <Ionicons name={targetIcon} size={16} color={targetColor.text} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: targetColor.text }}>
                      {t('status.' + targetStatus)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 }}>
              <Ionicons name={"lock-closed-outline" as IoniconsName} size={16} color="#AAA" />
              <Text style={{ fontSize: 13, color: "#AAA", fontStyle: "italic" }}>
                {t('status.archived')}
              </Text>
            </View>
          )}
        </View>

        {/* Tags Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"pricetag-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
              {t("tags.title")}
            </Text>
            <Pressable onPress={() => setShowTagPicker(!showTagPicker)}>
              <Ionicons name={(showTagPicker ? "close-outline" : "add-outline") as IoniconsName} size={22} color={colors.golden.DEFAULT} />
            </Pressable>
          </View>

          {caseTags.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: showTagPicker ? 12 : 0 }}>
              {caseTags.map((tag) => {
                const predefinedKey = PREDEFINED_TAGS.includes(tag as any) ? tag : null;
                const displayLabel = predefinedKey ? t(`tags.predefined.${predefinedKey}`) : tag;
                return (
                  <View
                    key={tag}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.golden[50],
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      gap: 6,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: colors.golden[700], fontWeight: "500" }}>{displayLabel}</Text>
                    <Pressable onPress={() => handleRemoveTag(tag)}>
                      <Ionicons name={"close-circle" as IoniconsName} size={16} color={colors.golden[500]} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : (
            !showTagPicker && (
              <View
                style={{
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: "#DDD",
                  borderRadius: 10,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 13, color: "#AAA" }}>{t("tags.addTag")}</Text>
              </View>
            )
          )}

          {/* Tag Picker (inline) */}
          {showTagPicker && (
            <View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {PREDEFINED_TAGS.map((tag) => {
                  const isActive = caseTags.includes(tag);
                  return (
                    <Pressable key={tag} onPress={() => handleToggleTag(tag)}>
                      <View
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: isActive ? colors.golden.DEFAULT : "#DDD",
                          backgroundColor: isActive ? colors.golden[50] : "#FFF",
                        }}
                      >
                        <Text style={{ fontSize: 12, color: isActive ? colors.golden[700] : "#888" }}>
                          {t(`tags.predefined.${tag}`)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 13,
                    borderWidth: 1,
                    borderColor: "#DDD",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    color: colors.navy.DEFAULT,
                  }}
                  placeholder={t("tags.customTag")}
                  placeholderTextColor="#CCC"
                  value={customTagText}
                  onChangeText={setCustomTagText}
                  onSubmitEditing={handleAddCustomTag}
                />
                <Pressable
                  onPress={handleAddCustomTag}
                  style={{
                    backgroundColor: colors.golden[50],
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("tags.addTag")}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Notes Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"journal-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
              {t("notes.title")} ({notes.length})
            </Text>
            <Pressable onPress={() => setAddingNote(!addingNote)} style={{ marginRight: 8 }}>
              <Ionicons name={(addingNote ? "close-outline" : "add-outline") as IoniconsName} size={22} color={colors.golden.DEFAULT} />
            </Pressable>
            {isRecording ? (
              <Pressable onPress={handleStopRecording}>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: '#FFEBEE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' }} />
                  <Text style={{ fontSize: 11, fontWeight: "600", color: '#E53935' }}>
                    {t("notes.recording")} {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                  </Text>
                  <Ionicons name={"stop-outline" as IoniconsName} size={14} color="#E53935" />
                </View>
              </Pressable>
            ) : (
              <Pressable onPress={handleStartRecording}>
                <Ionicons name={"mic-outline" as IoniconsName} size={20} color={colors.navy.DEFAULT} />
              </Pressable>
            )}
          </View>

          {/* Add Note Form */}
          {addingNote && (
            <View style={{ marginBottom: 12, backgroundColor: colors.golden[50] + "40", borderRadius: 8, padding: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: colors.navy.DEFAULT,
                    borderWidth: 1,
                    borderColor: colors.golden[100],
                    borderRadius: 8,
                    padding: 10,
                    minHeight: 60,
                    textAlignVertical: "top",
                    backgroundColor: "#FFF",
                  }}
                  multiline
                  placeholder={t("notes.placeholder")}
                  placeholderTextColor="#CCC"
                  value={newNoteContent}
                  onChangeText={setNewNoteContent}
                  autoFocus
                />
                <Pressable
                  onPress={handleDictation}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: isDictating ? '#FFEBEE' : '#F5F0E8',
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 10,
                  }}
                >
                  <Ionicons
                    name={(isDictating ? "radio-outline" : "mic-outline") as IoniconsName}
                    size={20}
                    color={isDictating ? '#E53935' : colors.navy.DEFAULT}
                  />
                </Pressable>
              </View>
              {isDictating && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, paddingLeft: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E53935' }} />
                  <Text style={{ fontSize: 12, color: '#E53935' }}>{t("notes.dictationHint")}</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                <Pressable onPress={() => { setAddingNote(false); setNewNoteContent(""); setIsDictating(false); if (dictationTimerRef.current) { clearTimeout(dictationTimerRef.current); dictationTimerRef.current = null; } }}>
                  <Text style={{ fontSize: 13, color: "#AAA" }}>{t("notes.cancel")}</Text>
                </Pressable>
                <Pressable onPress={handleAddNote}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("notes.save")}</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Notes List */}
          {notes.length > 0 ? (
            notes.map((note) => {
              const isVoice = note.type === 'voice';
              const isEditing = editingNoteId === note.id;
              const noteDate = new Date(note.createdAt);
              const dateStr = noteDate.toLocaleDateString('sr-Latn-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const timeStr = noteDate.toLocaleTimeString('sr-Latn-RS', { hour: '2-digit', minute: '2-digit' });

              return (
                <View
                  key={note.id}
                  style={{
                    backgroundColor: "#FFF",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: isVoice ? '#42A5F5' : colors.golden.DEFAULT,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  {isEditing ? (
                    <>
                      <TextInput
                        style={{
                          fontSize: 13,
                          color: colors.navy.DEFAULT,
                          borderWidth: 1,
                          borderColor: colors.golden[100],
                          borderRadius: 6,
                          padding: 8,
                          minHeight: 50,
                          textAlignVertical: "top",
                          backgroundColor: colors.golden[50] + "40",
                        }}
                        multiline
                        value={editNoteContent}
                        onChangeText={setEditNoteContent}
                        autoFocus
                      />
                      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 6 }}>
                        <Pressable onPress={() => { setEditingNoteId(null); setEditNoteContent(""); }}>
                          <Ionicons name={"close-outline" as IoniconsName} size={18} color="#AAA" />
                        </Pressable>
                        <Pressable onPress={() => handleEditNote(note.id)}>
                          <Ionicons name={"checkmark-outline" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
                        </Pressable>
                      </View>
                    </>
                  ) : isVoice ? (
                    <View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Ionicons name={"mic-outline" as IoniconsName} size={20} color="#42A5F5" />
                        <Text style={{ fontSize: 13, color: "#888", flex: 1 }}>
                          {t("notes.voiceNote")} ({note.audioDuration ? `${Math.floor(note.audioDuration / 60)}:${String(note.audioDuration % 60).padStart(2, '0')}` : '--:--'})
                        </Text>
                        <Pressable onPress={() => playingNoteId === note.id ? handlePausePlayback() : handlePlayVoiceNote(note)}>
                          <Ionicons
                            name={(playingNoteId === note.id ? "pause-circle-outline" : "play-circle-outline") as IoniconsName}
                            size={28}
                            color="#42A5F5"
                          />
                        </Pressable>
                        <Pressable onPress={() => handleDeleteNote(note.id)}>
                          <Ionicons name={"trash-outline" as IoniconsName} size={16} color="#E57373" />
                        </Pressable>
                      </View>
                      {/* Waveform visualization */}
                      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 1, marginTop: 8, height: 24 }}>
                        {WAVEFORM_BARS.map((height, idx) => {
                          const barProgress = idx / WAVEFORM_BARS.length;
                          const isPlayed = playingNoteId === note.id && barProgress <= playbackProgress;
                          return (
                            <View
                              key={idx}
                              style={{
                                flex: 1,
                                height: height * 24,
                                backgroundColor: isPlayed ? '#42A5F5' : '#E0E0E0',
                                borderRadius: 1,
                              }}
                            />
                          );
                        })}
                      </View>
                      <Text style={{ fontSize: 11, color: "#BBB", marginTop: 4 }}>
                        {new Date(note.createdAt).toLocaleDateString('sr-Latn-RS', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text style={{ fontSize: 13, color: colors.navy.DEFAULT, lineHeight: 18 }} numberOfLines={editingNoteId ? undefined : 2}>
                        {note.content}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                        <Text style={{ fontSize: 11, color: "#BBB" }}>
                          {dateStr} {timeStr}
                          {note.updatedAt ? ' *' : ''}
                        </Text>
                        <View style={{ flexDirection: "row", gap: 12 }}>
                          <Pressable onPress={() => { setEditingNoteId(note.id); setEditNoteContent(note.content ?? ""); }}>
                            <Ionicons name={"pencil-outline" as IoniconsName} size={16} color="#AAA" />
                          </Pressable>
                          <Pressable onPress={() => handleDeleteNote(note.id)}>
                            <Ionicons name={"trash-outline" as IoniconsName} size={16} color="#E57373" />
                          </Pressable>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              );
            })
          ) : (
            !addingNote && (
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
                <Ionicons name={"document-text-outline" as IoniconsName} size={28} color="#DDD" />
                <Text style={{ fontSize: 13, color: "#AAA", marginTop: 8, textAlign: "center", paddingHorizontal: 16 }}>
                  {t("notes.emptyState")}
                </Text>
              </View>
            )
          )}
        </View>

        {/* Documents Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"document-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
              {td("documentCount", { count: documents.length })}
            </Text>
          </View>
          {documents.length > 0 ? (
            <>
              {documents.slice(0, 3).map((doc) => {
                const iconInfo = DOC_TYPE_ICONS[doc.type];
                return (
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
                      name={iconInfo.icon as IoniconsName}
                      size={20}
                      color={iconInfo.color}
                      style={{ marginRight: 10 }}
                    />
                    <Text
                      style={{ flex: 1, fontSize: 13, color: colors.navy.DEFAULT }}
                      numberOfLines={1}
                    >
                      {doc.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#BBB", marginLeft: 8 }}>
                      {formatFileSize(doc.size)}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => caseData?.clientId
                  ? router.push({ pathname: "/(tabs)/clients/documents/[clientId]", params: { clientId: caseData.clientId, initialTab: "case", initialCaseId: id! } })
                  : router.push('/(tabs)/cases/documents/' + id as any)}
                style={{
                  marginTop: 10,
                  paddingVertical: 8,
                  alignItems: "center",
                  backgroundColor: colors.golden[50],
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>
                  {td("viewAll")}
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
                  {td("noDocsYet")}
                </Text>
              </View>
              <Pressable
                onPress={() => caseData?.clientId
                  ? router.push({ pathname: "/(tabs)/clients/documents/[clientId]", params: { clientId: caseData.clientId, initialTab: "case", initialCaseId: id! } })
                  : router.push('/(tabs)/cases/documents/' + id as any)}
                style={{
                  marginTop: 10,
                  paddingVertical: 8,
                  alignItems: "center",
                  backgroundColor: colors.golden[50],
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>
                  {td("addDocument")}
                </Text>
              </Pressable>
            </>
          )}
        </View>

{/* Upcoming Activity Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Ionicons name={"calendar-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
              {t("upcomingActivity.title")}
            </Text>
          </View>
          {upcomingActivityItems.length > 0 ? (
            upcomingActivityItems.map((item, idx) => (
              <CaseActivityRow
                key={item.id}
                item={item}
                isLast={idx === upcomingActivityItems.length - 1}
                onPress={item.eventId ? () => router.push({ pathname: "/(tabs)/calendar/event/[id]", params: { id: item.eventId!, returnTo: `/(tabs)/cases/${id}` } }) : undefined}
              />
            ))
          ) : (
            <View
              style={{
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: "#E0D9CC",
                borderRadius: 10,
                paddingVertical: 20,
                alignItems: "center",
                backgroundColor: "#FBFAF5",
              }}
            >
              <Ionicons name={"calendar-outline" as IoniconsName} size={24} color="#CFC4B0" />
              <Text style={{ fontSize: 13, color: "#8B8373", marginTop: 6, textAlign: "center", paddingHorizontal: 16 }}>
                {t("upcomingActivity.noActivity")}
              </Text>
            </View>
          )}
        </View>

        {/* Recent Activity Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Ionicons name={"time-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
              {t("recentActivity.title")}
            </Text>
          </View>
          {recentActivityItems.length > 0 ? (
            recentActivityItems.map((item, idx) => (
              <CaseActivityRow key={item.id} item={item} isLast={idx === recentActivityItems.length - 1} />
            ))
          ) : (
            <View
              style={{
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: "#E0D9CC",
                borderRadius: 10,
                paddingVertical: 20,
                alignItems: "center",
                backgroundColor: "#FBFAF5",
              }}
            >
              <Ionicons name={"time-outline" as IoniconsName} size={24} color="#CFC4B0" />
              <Text style={{ fontSize: 13, color: "#8B8373", marginTop: 6, textAlign: "center", paddingHorizontal: 16 }}>
                {t("recentActivity.noActivity")}
              </Text>
            </View>
          )}
        </View>
        {/* Related Cases Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"link-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
              {t("related.title")} ({caseLinksData.length})
            </Text>
            <Pressable onPress={handleOpenLinkPicker}>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.golden[50], paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 }}>
                <Ionicons name={(showLinkPicker ? "close-outline" : "add-outline") as IoniconsName} size={14} color={colors.golden.DEFAULT} />
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("related.addLink")}</Text>
              </View>
            </Pressable>
          </View>

          {/* Link Case Picker */}
          {showLinkPicker && (
            <View style={{ marginBottom: 12, backgroundColor: colors.golden[50] + "40", borderRadius: 8, padding: 12 }}>
              {!selectedLinkCase ? (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, borderWidth: 1, borderColor: colors.golden[100], paddingHorizontal: 10, marginBottom: 8 }}>
                    <Ionicons name={"search-outline" as IoniconsName} size={16} color="#AAA" />
                    <TextInput
                      style={{ flex: 1, fontSize: 14, color: colors.navy.DEFAULT, padding: 10 }}
                      placeholder={t("related.searchCases")}
                      placeholderTextColor="#CCC"
                      value={linkSearchQuery}
                      onChangeText={setLinkSearchQuery}
                      autoFocus
                    />
                  </View>
                  {linkSearchResults.length > 0 && (
                    <View style={{ maxHeight: 180 }}>
                      {linkSearchResults.slice(0, 5).map((c) => (
                        <Pressable
                          key={c.id}
                          onPress={() => setSelectedLinkCase(c)}
                          style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT }}>{c.caseNumber}</Text>
                            <Text style={{ fontSize: 12, color: "#888" }} numberOfLines={1}>{c.title}</Text>
                          </View>
                          <Ionicons name={"chevron-forward" as IoniconsName} size={14} color="#DDD" />
                        </Pressable>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, backgroundColor: "#FFF", borderRadius: 8, padding: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT }}>{selectedLinkCase.caseNumber}</Text>
                      <Text style={{ fontSize: 12, color: "#888" }} numberOfLines={1}>{selectedLinkCase.title}</Text>
                    </View>
                    <Pressable onPress={() => setSelectedLinkCase(null)}>
                      <Ionicons name={"close-circle" as IoniconsName} size={20} color="#AAA" />
                    </Pressable>
                  </View>
                  <Text style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{t("related.linkType")}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {CASE_LINK_TYPES.map((lt) => (
                      <Pressable key={lt} onPress={() => setSelectedLinkType(lt)}>
                        <View style={{
                          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                          borderWidth: 1,
                          borderColor: selectedLinkType === lt ? '#1565C0' : '#DDD',
                          backgroundColor: selectedLinkType === lt ? '#E3F2FD' : '#FFF',
                        }}>
                          <Text style={{ fontSize: 12, color: selectedLinkType === lt ? '#1565C0' : '#888' }}>
                            {t(`related.types.${lt}`)}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
                    <Pressable onPress={() => { setShowLinkPicker(false); setSelectedLinkCase(null); }}>
                      <Text style={{ fontSize: 13, color: "#AAA" }}>{t("notes.cancel")}</Text>
                    </Pressable>
                    <Pressable onPress={handleConfirmLink}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("billing.save")}</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Linked Cases List */}
          {caseLinksData.length > 0 ? (
            caseLinksData.map((link) => (
              <Pressable
                key={link.id}
                onPress={() => router.push({ pathname: '/(tabs)/cases/[id]', params: { id: link.linkedCase.id, returnTo: `/(tabs)/cases/${id}` } })}
              >
                <View
                  style={{
                    backgroundColor: "#FFF",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.golden.DEFAULT,
                    flexDirection: "row",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT }}>{link.linkedCase.caseNumber}</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: '#E3F2FD' }}>
                        <Text style={{ fontSize: 10, fontWeight: "600", color: '#1565C0' }}>
                          {t(`related.types.${link.linkType}`)}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: "#888" }} numberOfLines={1}>{link.linkedCase.title}</Text>
                  </View>
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); handleRemoveLink(link.id); }}
                    style={{ padding: 4, marginRight: 4 }}
                  >
                    <Ionicons name={"close-outline" as IoniconsName} size={18} color="#E57373" />
                  </Pressable>
                  <Ionicons name={"chevron-forward" as IoniconsName} size={14} color="#DDD" />
                </View>
              </Pressable>
            ))
          ) : (
            !showLinkPicker && (
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
                <Ionicons name={"link-outline" as IoniconsName} size={28} color="#DDD" />
                <Text style={{ fontSize: 13, color: "#AAA", marginTop: 8, textAlign: "center", paddingHorizontal: 16 }}>
                  {t("related.emptyState")}
                </Text>
              </View>
            )
          )}
        </View>

        {/* Billing Section (Time & Expenses) */}
        <View style={SECTION_CARD}>
          {/* Title row */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"cash-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
              {t("billing.title")}
            </Text>
          </View>

          {/* Action buttons row */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <Pressable
              onPress={() => {
                setEditingTimeId(null); setEditingExpenseId(null);
                setTimeHours(""); setTimeDescription(""); setTimeDate(new Date()); setTimeBillable(true);
                setAddingExpense(false);
                setAddingTime(true);
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.golden.DEFAULT,
                paddingVertical: 10,
                borderRadius: 10,
                gap: 6,
              }}
            >
              <Ionicons name={"add" as IoniconsName} size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>{t("billing.addTime")}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setEditingTimeId(null); setEditingExpenseId(null);
                setExpenseAmount(""); setExpenseDescription(""); setExpenseDate(new Date()); setExpenseCategory("court-fees"); setExpenseCurrency(DEFAULT_CURRENCY); setExpenseCustomCategory("");
                setAddingTime(false);
                setAddingExpense(true);
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.golden.DEFAULT,
                paddingVertical: 10,
                borderRadius: 10,
                gap: 6,
              }}
            >
              <Ionicons name={"add" as IoniconsName} size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>{t("billing.addExpense")}</Text>
            </Pressable>
          </View>

          {/* Summary Stats */}
          {(timeEntries.length > 0 || expenses.length > 0) && (
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1, backgroundColor: "#F5F0E8", borderRadius: 8, padding: 10, alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: "#888" }}>{t("billing.totalHours")}</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.navy.DEFAULT }}>{totalHours.toFixed(1)}h</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: "#F5F0E8", borderRadius: 8, padding: 10, alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: "#888" }}>{t("billing.totalExpenses")}</Text>
                {Object.entries(expenseTotalsByCurrency).length === 0 ? (
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.navy.DEFAULT }}>—</Text>
                ) : (
                  Object.entries(expenseTotalsByCurrency).map(([cur, amt]) => (
                    <Text key={cur} style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
                      {formatMoney(amt, cur as Currency)}
                    </Text>
                  ))
                )}
              </View>
            </View>
          )}

          {/* Combined Billing List */}
          {billingItems.length > 0 ? (
            <>
            {billingItems.map((item) => {
              if (item.type === 'time') {
                const te = item.data as TimeEntry;
                const hasAmount = te.billable && te.amount != null && te.amount > 0;
                const timePaid = hasAmount && te.paid === true;
                const accent = !te.billable
                  ? colors.golden.DEFAULT
                  : timePaid
                    ? "#BFD8C2"
                    : colors.golden.DEFAULT;
                return (
                  <Pressable
                    key={te.id}
                    onPress={() => handleEditTimeEntry(te)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? "#FBF7EE" : (timePaid ? "#FBFBF8" : "#FFFFFF"),
                      borderRadius: 12,
                      paddingTop: 12,
                      paddingBottom: 12,
                      paddingLeft: 12,
                      paddingRight: 40,
                      marginBottom: 10,
                      borderLeftWidth: 3,
                      borderLeftColor: accent,
                      borderWidth: 1,
                      borderColor: timePaid ? "#ECE9DE" : "#F0EAE0",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: timePaid ? 0.02 : 0.04,
                      shadowRadius: 3,
                      elevation: 1,
                      position: "relative",
                    })}
                  >
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                      <View style={{ width: 32, alignItems: "center", paddingTop: 2 }}>
                        <View
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 15,
                            backgroundColor: timePaid ? "#E8F5E9" : colors.golden[50],
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons
                            name={(timePaid ? "checkmark" : "time-outline") as IoniconsName}
                            size={timePaid ? 18 : 16}
                            color={timePaid ? "#2E7D32" : colors.golden.DEFAULT}
                          />
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: timePaid ? "#9A9180" : colors.navy.DEFAULT,
                            lineHeight: 20,
                            textDecorationLine: timePaid ? "line-through" : "none",
                          }}
                        >
                          {te.description}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6, flexWrap: "wrap" }}>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: timePaid ? "#9A9180" : colors.navy.DEFAULT }}>
                            {te.hours.toFixed(1)}h
                          </Text>
                          <View
                            style={{
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderRadius: 8,
                              backgroundColor: te.billable ? (timePaid ? "#F2EEE2" : "#E8F5E9") : "#ECEFF1",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: "700",
                                color: te.billable ? (timePaid ? "#9A9180" : "#2E7D32") : "#546E7A",
                                letterSpacing: 0.3,
                                textTransform: "uppercase",
                              }}
                            >
                              {te.billable ? t("billing.billable") : t("billing.nonBillable")}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 11, color: "#A89F8F" }}>·</Text>
                          <Text style={{ fontSize: 11, color: "#A89F8F", fontVariant: ["tabular-nums"] }}>
                            {formatDateTimeShort(parseIsoOrDate(te.date))}
                          </Text>
                          {hasAmount && (
                            <>
                              <View style={{ flex: 1, minWidth: 8 }} />
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: "700",
                                  color: timePaid ? "#9A9180" : colors.navy.DEFAULT,
                                  fontVariant: ["tabular-nums"],
                                  textDecorationLine: timePaid ? "line-through" : "none",
                                }}
                              >
                                {formatMoney(te.amount!, te.currency ?? DEFAULT_CURRENCY)}
                              </Text>
                            </>
                          )}
                        </View>
                        {timePaid && te.paidAt && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <Ionicons name={"checkmark-circle" as IoniconsName} size={12} color="#2E7D32" />
                            <Text style={{ fontSize: 11, color: "#2E7D32", fontWeight: "600" }}>
                              {t("billing.paidOn")}: <Text style={{ fontVariant: ["tabular-nums"], fontWeight: "700" }}>{formatDateOnly(parseIsoOrDate(te.paidAt))}</Text>
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Pressable
                      onPress={(e) => { e.stopPropagation(); handleDeleteTimeEntry(te.id); }}
                      hitSlop={10}
                      style={{ position: "absolute", top: 10, right: 10, padding: 4 }}
                    >
                      <Ionicons name={"trash-outline" as IoniconsName} size={15} color="#C9A3A3" />
                    </Pressable>
                  </Pressable>
                );
              } else {
                const ex = item.data as Expense;
                const isPaid = ex.paid === true;
                const accent = isPaid ? "#BFD8C2" : "#43A047";
                return (
                  <Pressable
                    key={ex.id}
                    onPress={() => handleEditExpense(ex)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? "#FBF7EE" : (isPaid ? "#FBFBF8" : "#FFFFFF"),
                      borderRadius: 12,
                      paddingTop: 12,
                      paddingBottom: 12,
                      paddingLeft: 12,
                      paddingRight: 40,
                      marginBottom: 10,
                      borderLeftWidth: 3,
                      borderLeftColor: accent,
                      borderWidth: 1,
                      borderColor: isPaid ? "#ECE9DE" : "#F0EAE0",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isPaid ? 0.02 : 0.04,
                      shadowRadius: 3,
                      elevation: 1,
                      position: "relative",
                    })}
                  >
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                      <View style={{ width: 32, alignItems: "center", paddingTop: 2 }}>
                        <View
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 15,
                            backgroundColor: isPaid ? "#E8F5E9" : colors.golden[50],
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons
                            name={(isPaid ? "checkmark" : "receipt-outline") as IoniconsName}
                            size={isPaid ? 18 : 16}
                            color={isPaid ? "#2E7D32" : colors.golden.DEFAULT}
                          />
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: isPaid ? "#9A9180" : colors.navy.DEFAULT,
                            lineHeight: 20,
                            textDecorationLine: isPaid ? "line-through" : "none",
                          }}
                        >
                          {ex.description}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6, flexWrap: "wrap" }}>
                          <View
                            style={{
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderRadius: 8,
                              backgroundColor: isPaid ? "#F2EEE2" : colors.golden[50],
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: "700",
                                color: isPaid ? "#9A9180" : colors.golden.DEFAULT,
                                letterSpacing: 0.3,
                                textTransform: "uppercase",
                              }}
                            >
                              {t(`billing.categories.${ex.category}`)}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 11, color: "#A89F8F" }}>·</Text>
                          <Text style={{ fontSize: 11, color: "#A89F8F", fontVariant: ["tabular-nums"] }}>
                            {formatDateTimeShort(parseIsoOrDate(ex.date))}
                          </Text>
                          <View style={{ flex: 1, minWidth: 8 }} />
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              color: isPaid ? "#9A9180" : colors.navy.DEFAULT,
                              fontVariant: ["tabular-nums"],
                              textDecorationLine: isPaid ? "line-through" : "none",
                            }}
                          >
                            {formatMoney(ex.amount, ex.currency ?? DEFAULT_CURRENCY)}
                          </Text>
                        </View>
                        {isPaid && ex.paidAt && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <Ionicons name={"checkmark-circle" as IoniconsName} size={12} color="#2E7D32" />
                            <Text style={{ fontSize: 11, color: "#2E7D32", fontWeight: "600" }}>
                              {t("billing.paidOn")}: <Text style={{ fontVariant: ["tabular-nums"], fontWeight: "700" }}>{formatDateOnly(parseIsoOrDate(ex.paidAt))}</Text>
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Pressable
                      onPress={(e) => { e.stopPropagation(); handleDeleteExpense(ex.id); }}
                      hitSlop={10}
                      style={{ position: "absolute", top: 10, right: 10, padding: 4 }}
                    >
                      <Ionicons name={"trash-outline" as IoniconsName} size={15} color="#C9A3A3" />
                    </Pressable>
                  </Pressable>
                );
              }
            })}
            {/* Create-invoice CTA — opens the new-invoice screen pre-scoped to this case. */}
            <Pressable
              onPress={() => router.push({
                pathname: "/(tabs)/more/billing/new",
                params: { caseId: id!, returnTo: `/(tabs)/cases/${id}` },
              })}
              style={{
                marginTop: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: colors.golden.DEFAULT,
                borderRadius: 12,
                paddingVertical: 14,
              }}
            >
              <Ionicons name={"document-text-outline" as IoniconsName} size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
                {t("billing.createInvoice")}
              </Text>
            </Pressable>
            </>
          ) : (
            !addingTime && !addingExpense && (
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
                  {t("billing.emptyState")}
                </Text>
              </View>
            )
          )}
        </View>

        {/* Unpaid invoices for this case — shows up to 3 with a "view all"
            link. Tapping a row opens the invoice detail with a returnTo back
            to this case overview. */}
        {(() => {
          const unpaid = invoices
            .filter((inv) => inv.paidAmount < inv.total)
            .sort((a, b) => b.issuedDate.localeCompare(a.issuedDate));
          const unpaidTotal = unpaid.reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);
          return (
            <View style={SECTION_CARD}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Ionicons name={"receipt-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
                  {t("billing.unpaidInvoicesTitle")}
                </Text>
              </View>

              {/* Centered red total — sum of remaining balances on unpaid invoices.
                  Invoices are stored in RSD on this app so the sum is currency-safe. */}
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
                    {t("billing.remaining")}
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
                    {t("billing.noUnpaidInvoices")}
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
                          params: { id: inv.id, returnTo: `/(tabs)/cases/${id}` },
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
                        {/* Status-colored left rail — instantly readable status cue.
                            For overdue invoices it picks up the red text color from
                            INVOICE_STATUS_COLORS, drawing the eye to attention items. */}
                        <View style={{ width: 4, backgroundColor: statusColor.text }} />

                        <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12 }}>
                          {/* Header row: invoice number + uppercase status pill on the
                              left, money label + amount stacked on the right. The two
                              columns use baseline-ish alignment so the numbers visually
                              anchor the row regardless of optional content below. */}
                          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: "700",
                                  color: colors.navy.DEFAULT,
                                  fontVariant: ["tabular-nums"],
                                  letterSpacing: 0.3,
                                }}
                              >
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
                                <Text
                                  style={{
                                    fontSize: 9,
                                    fontWeight: "800",
                                    color: statusColor.text,
                                    letterSpacing: 0.7,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {tb(`status.${inv.status}`, { defaultValue: inv.status })}
                                </Text>
                              </View>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                                <Ionicons name={"calendar-outline" as IoniconsName} size={11} color="#A89F8F" />
                                <Text style={{ fontSize: 11, color: "#A89F8F", fontVariant: ["tabular-nums"] }}>
                                  {formatDateOnly(parseIsoOrDate(inv.issuedDate))}
                                </Text>
                              </View>
                            </View>

                            {/* Right-aligned money block — small uppercase label sits
                                above the figure so the eye reads "Preostalo → amount"
                                like a statement line. tabular-nums keeps the digits
                                aligned across rows. */}
                            <View style={{ alignItems: "flex-end" }}>
                              <Text
                                style={{
                                  fontSize: 9,
                                  fontWeight: "700",
                                  color: "#A89F8F",
                                  letterSpacing: 0.7,
                                  textTransform: "uppercase",
                                  marginBottom: 1,
                                }}
                              >
                                {t("billing.remaining")}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 17,
                                  fontWeight: "800",
                                  color: accentMoney,
                                  fontVariant: ["tabular-nums"],
                                  lineHeight: 20,
                                }}
                              >
                                {formatMoney(remaining, "RSD")}
                              </Text>
                            </View>
                          </View>

                          {/* Quiet progress bar — communicates "what fraction of this
                              invoice has been collected" without shouting. Stays at 0%
                              for sent / draft (empty bar still reads as "nothing yet"). */}
                          {inv.total > 0 && (
                            <View style={{ marginTop: 12 }}>
                              <View
                                style={{
                                  height: 4,
                                  backgroundColor: "#F2ECDF",
                                  borderRadius: 2,
                                  overflow: "hidden",
                                }}
                              >
                                <View
                                  style={{
                                    width: `${paidPct}%`,
                                    height: "100%",
                                    backgroundColor: paidPct >= 100 ? "#43A047" : colors.golden.DEFAULT,
                                  }}
                                />
                              </View>
                              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 5 }}>
                                <Text
                                  style={{
                                    fontSize: 10,
                                    color: "#A89F8F",
                                    letterSpacing: 0.4,
                                    fontVariant: ["tabular-nums"],
                                  }}
                                >
                                  {t("billing.percentPaid", { percent: Math.round(paidPct) })}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 10,
                                    color: "#A89F8F",
                                    fontVariant: ["tabular-nums"],
                                  }}
                                >
                                  {formatMoney(inv.paidAmount, "RSD")} / {formatMoney(inv.total, "RSD")}
                                </Text>
                              </View>
                            </View>
                          )}

                          {/* Note rendered like a quoted excerpt — leading golden bar +
                              italic body. Only appears when the invoice has a note. */}
                          {inv.notes && (
                            <View
                              style={{
                                flexDirection: "row",
                                marginTop: 12,
                                paddingLeft: 8,
                                borderLeftWidth: 2,
                                borderLeftColor: colors.golden.DEFAULT,
                              }}
                            >
                              <Text
                                style={{
                                  flex: 1,
                                  fontSize: 12,
                                  lineHeight: 17,
                                  color: "#6B6558",
                                  fontStyle: "italic",
                                }}
                                numberOfLines={2}
                              >
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
                      params: { caseId: id!, returnTo: `/(tabs)/cases/${id}` },
                    })}
                    style={{
                      marginTop: 10,
                      paddingVertical: 8,
                      alignItems: "center",
                      backgroundColor: colors.golden[50],
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>
                      {t("billing.viewAllInvoices")}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          );
        })()}

      </ScrollView>

      {/* Quick Action Bar (sticks to bottom, just above the tab bar) */}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F5F0E8",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <Pressable
          onPress={() => {
            if (clientData?.phone) {
              Linking.openURL(`tel:${clientData.phone}`);
            }
          }}
          disabled={!clientData?.phone}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: clientData?.phone ? colors.navy.DEFAULT : "#E0E0E0",
          }}
        >
          <Ionicons name={"call-outline" as IoniconsName} size={18} color={clientData?.phone ? "#FFFFFF" : "#AAA"} />
          <Text style={{ fontSize: 14, fontWeight: "700", color: clientData?.phone ? "#FFFFFF" : "#AAA" }}>
            {t("quickActions.callClient")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (caseData?.court) {
              Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(caseData.court)}`);
            }
          }}
          disabled={!caseData?.court}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: caseData?.court ? colors.golden.DEFAULT : "#E0E0E0",
          }}
        >
          <Ionicons name={"navigate-outline" as IoniconsName} size={18} color={caseData?.court ? "#FFFFFF" : "#AAA"} />
          <Text style={{ fontSize: 14, fontWeight: "700", color: caseData?.court ? "#FFFFFF" : "#AAA" }}>
            {t("quickActions.navigateCourt")}
          </Text>
        </Pressable>
      </View>

      {pickerKind && (
        <DirectoryPicker
          visible={pickerKind !== null}
          onClose={closePicker}
          kind={pickerKind}
          lawyerFilter={pickerField === "opposingPartyRepresentative" ? "external" : "all"}
          currentId={
            pickerField === "court"
              ? caseData?.courtId ?? null
              : pickerField === "judge"
                ? caseData?.judgeId ?? null
                : caseData?.opposingPartyRepresentativeId ?? null
          }
          onSelect={handleDirectorySelect}
          onClear={handleDirectoryClear}
        />
      )}

      <DeleteConfirmDialog
        visible={deleteConfirm !== null}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title={deleteConfirmCopy.title}
        body={deleteConfirmCopy.body}
        confirmLabel={deleteConfirmCopy.confirm}
      />

      {/* Add Time Entry Modal */}
      <Modal visible={addingTime} animationType="slide" transparent onRequestClose={() => { setAddingTime(false); setEditingTimeId(null); }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 + insets.bottom }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy.DEFAULT }}>
                {t("billing.addTime")}
              </Text>
              <Pressable onPress={() => { setAddingTime(false); setEditingTimeId(null); }}>
                <Ionicons name={"close" as IoniconsName} size={24} color="#AAA" />
              </Pressable>
            </View>

            {/* Hours — first field */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("billing.hours")}
            </Text>
            <TextInput
              value={timeHours}
              onChangeText={setTimeHours}
              placeholder="0.0"
              placeholderTextColor="#CCC"
              keyboardType="decimal-pad"
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

            {/* Billable toggle */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "#E5E5E5" }}>
              <Pressable
                onPress={() => setTimeBillable(true)}
                style={{ flex: 1, backgroundColor: timeBillable ? "#E8F5E9" : "#F9F9F9", paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: timeBillable ? "#2E7D32" : "#AAA" }}>{t("billing.billable")}</Text>
              </Pressable>
              <Pressable
                onPress={() => setTimeBillable(false)}
                style={{ flex: 1, backgroundColor: !timeBillable ? "#ECEFF1" : "#F9F9F9", paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: !timeBillable ? "#546E7A" : "#AAA" }}>{t("billing.nonBillable")}</Text>
              </Pressable>
            </View>

            {/* Description — always */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("billing.description")}
            </Text>
            <TextInput
              value={timeDescription}
              onChangeText={setTimeDescription}
              placeholder={t("billing.description")}
              placeholderTextColor="#CCC"
              multiline
              numberOfLines={2}
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
                marginBottom: 12,
                minHeight: 60,
              }}
            />

            {/* Datetime — always */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("billing.datetime")}
            </Text>
            <Pressable
              onPress={() => setShowTimeDatePicker("date")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#F9F9F9",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                marginBottom: 16,
              }}
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

      {/* Add Expense Modal */}
      <Modal visible={addingExpense} animationType="slide" transparent onRequestClose={() => { setAddingExpense(false); setEditingExpenseId(null); }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 + insets.bottom }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy.DEFAULT }}>
                {t("billing.addExpense")}
              </Text>
              <Pressable onPress={() => { setAddingExpense(false); setEditingExpenseId(null); }}>
                <Ionicons name={"close" as IoniconsName} size={24} color="#AAA" />
              </Pressable>
            </View>

            {/* Currency chips */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {SUPPORTED_CURRENCIES.map((cur) => {
                const isActive = expenseCurrency === cur;
                return (
                  <Pressable
                    key={cur}
                    onPress={() => setExpenseCurrency(cur)}
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
                    <Text style={{ fontSize: 12, fontWeight: "700", color: isActive ? colors.golden.DEFAULT : "#888" }}>{cur}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("billing.amount")}
            </Text>
            <TextInput
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              placeholder="0"
              placeholderTextColor="#CCC"
              keyboardType="decimal-pad"
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
              {t("billing.description")}
            </Text>
            <TextInput
              value={expenseDescription}
              onChangeText={setExpenseDescription}
              placeholder={t("billing.description")}
              placeholderTextColor="#CCC"
              multiline
              numberOfLines={2}
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
                marginBottom: 12,
                minHeight: 60,
              }}
            />

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("billing.category")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {EXPENSE_CATEGORIES.map((cat) => {
                const isActive = expenseCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setExpenseCategory(cat)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: isActive ? colors.golden.DEFAULT : "#E5E5E5",
                      backgroundColor: isActive ? colors.golden[50] : "#F9F9F9",
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: isActive ? colors.golden.DEFAULT : "#888" }}>
                      {t(`billing.categories.${cat}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {expenseCategory === "custom" && (
              <TextInput
                value={expenseCustomCategory}
                onChangeText={setExpenseCustomCategory}
                placeholder={t("billing.category")}
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
            )}

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("billing.datetime")}
            </Text>
            <Pressable
              onPress={() => setShowExpenseDatePicker("date")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#F9F9F9",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                marginBottom: 16,
              }}
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

      {/* Image preview modal — opened when an image-type document is tapped on the overview. */}
      <Modal
        visible={previewDoc !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewDoc(null)}
      >
        <Pressable
          onPress={() => setPreviewDoc(null)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" }}
        >
          {previewDoc && (
            <Image
              source={{ uri: previewDoc.uri }}
              style={{ width: Dimensions.get("window").width, height: Dimensions.get("window").height * 0.8 }}
              resizeMode="contain"
            />
          )}
          <Pressable
            onPress={() => setPreviewDoc(null)}
            style={{ position: "absolute", top: 48, right: 20, padding: 8, backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 20 }}
          >
            <Ionicons name={"close" as IoniconsName} size={26} color="#FFFFFF" />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

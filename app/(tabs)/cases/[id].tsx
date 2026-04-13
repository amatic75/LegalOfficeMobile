import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { useState, useCallback, useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { useServices } from "../../../src/hooks/useServices";
import { colors } from "../../../src/theme/tokens";
import type { CaseSummary, CaseStatus, Document, CalendarEvent, CaseNote, TimeEntry, Expense, ExpenseCategory, CaseLink, CaseLinkType, Client } from "../../../src/services/types";
import { STATUS_COLORS, STATUS_TRANSITIONS, formatFileSize, DOC_TYPE_ICONS, EVENT_TYPE_COLORS, PREDEFINED_TAGS, CASE_TYPE_SUBTYPES_TREE, EXPENSE_CATEGORIES, CASE_LINK_TYPES } from "../../../src/services/types";

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

function EditableInfoRow({ icon, label, value, placeholder, onSave }: {
  icon: IoniconsName;
  label: string;
  value?: string;
  placeholder: string;
  onSave: (newValue: string) => void;
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

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("cases");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { t: td } = useTranslation("documents");
  const { t: tc } = useTranslation("calendar");

  const [caseData, setCaseData] = useState<CaseSummary | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [caseEvents, setCaseEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
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
  const [timeDate, setTimeDate] = useState("");
  const [timeBillable, setTimeBillable] = useState(true);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("court-fees");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
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

  const loadCase = useCallback(async () => {
    if (!id) return;
    const [data, docs, events, caseNotes, caseTimeEntries, caseExpenses, caseLinksList] = await Promise.all([
      services.cases.getCaseById(id),
      services.documents.getDocumentsByCaseId(id),
      services.calendarEvents.getEventsByCaseId(id),
      services.caseNotes.getNotesByCaseId(id),
      services.timeEntries.getTimeEntriesByCaseId(id),
      services.expenses.getExpensesByCaseId(id),
      services.caseLinks.getLinksByCaseId(id),
    ]);
    setCaseData(data);
    setDocuments(docs);
    setCaseEvents(events);
    setNotes(caseNotes);
    setTimeEntries(caseTimeEntries);
    setExpenses(caseExpenses);
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
    Alert.alert(
      t('notes.deleteNote'),
      t('notes.deleteConfirm'),
      [
        { text: t('notes.cancel'), style: 'cancel' },
        {
          text: t('notes.deleteNote'),
          style: 'destructive',
          onPress: async () => {
            await services.caseNotes.deleteNote(noteId);
            if (id) {
              const refreshed = await services.caseNotes.getNotesByCaseId(id);
              setNotes(refreshed);
            }
          },
        },
      ]
    );
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

  // Billing handlers
  const handleAddTimeEntry = async () => {
    if (!id) return;
    const hours = parseFloat(timeHours);
    if (isNaN(hours) || hours <= 0 || !timeDescription.trim()) return;
    await services.timeEntries.createTimeEntry({
      caseId: id,
      hours,
      description: timeDescription.trim(),
      date: timeDate || new Date().toISOString().split('T')[0],
      billable: timeBillable,
    });
    const refreshed = await services.timeEntries.getTimeEntriesByCaseId(id);
    setTimeEntries(refreshed);
    setTimeHours(""); setTimeDescription(""); setTimeDate(""); setTimeBillable(true);
    setAddingTime(false);
  };

  const handleDeleteTimeEntry = (entryId: string) => {
    Alert.alert(
      t('billing.delete'),
      t('billing.deleteConfirm'),
      [
        { text: t('notes.cancel'), style: 'cancel' },
        {
          text: t('billing.delete'),
          style: 'destructive',
          onPress: async () => {
            await services.timeEntries.deleteTimeEntry(entryId);
            if (id) {
              const refreshed = await services.timeEntries.getTimeEntriesByCaseId(id);
              setTimeEntries(refreshed);
            }
          },
        },
      ]
    );
  };

  const handleAddExpense = async () => {
    if (!id) return;
    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0 || !expenseDescription.trim()) return;
    await services.expenses.createExpense({
      caseId: id,
      amount,
      category: expenseCategory,
      description: expenseDescription.trim(),
      date: expenseDate || new Date().toISOString().split('T')[0],
    });
    const refreshed = await services.expenses.getExpensesByCaseId(id);
    setExpenses(refreshed);
    setExpenseAmount(""); setExpenseCategory("court-fees"); setExpenseDescription(""); setExpenseDate(""); setExpenseCustomCategory("");
    setAddingExpense(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    Alert.alert(
      t('billing.delete'),
      t('billing.deleteConfirm'),
      [
        { text: t('notes.cancel'), style: 'cancel' },
        {
          text: t('billing.delete'),
          style: 'destructive',
          onPress: async () => {
            await services.expenses.deleteExpense(expenseId);
            if (id) {
              const refreshed = await services.expenses.getExpensesByCaseId(id);
              setExpenses(refreshed);
            }
          },
        },
      ]
    );
  };

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
    Alert.alert(
      t('related.removeLink'),
      t('related.removeLinkConfirm'),
      [
        { text: t('notes.cancel'), style: 'cancel' },
        {
          text: t('related.removeLink'),
          style: 'destructive',
          onPress: async () => {
            await services.caseLinks.deleteLink(linkId);
            if (id) {
              const refreshed = await services.caseLinks.getLinksByCaseId(id);
              setCaseLinksData(refreshed);
            }
          },
        },
      ]
    );
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
  const totalExpenseAmount = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  const billingItems: Array<{ type: 'time'; data: TimeEntry } | { type: 'expense'; data: Expense }> = [
    ...timeEntries.map((te) => ({ type: 'time' as const, data: te })),
    ...expenses.map((ex) => ({ type: 'expense' as const, data: ex })),
  ].sort((a, b) => b.data.date.localeCompare(a.data.date));

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
    <>
      <Stack.Screen
        options={{
          headerTitle: caseData.caseNumber,
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
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
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
                        {subtypeData.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={{ paddingLeft: 22, marginTop: 4 }}>
                        {subtypeData.items.map((item) => (
                          <View key={item} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 2 }}>
                            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.golden[500] }} />
                            <Text style={{ fontSize: 12, color: "#888" }}>{item}</Text>
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
            onPress={() => router.push('/(tabs)/clients/' + caseData.clientId)}
            linkColor={colors.golden.DEFAULT}
          />
          {caseData.opposingParty && (
            <InfoRow
              icon={"people-outline" as IoniconsName}
              label={t("detail.opposingParty")}
              value={caseData.opposingParty}
            />
          )}

          {/* Inline Editable: Opposing Party Representative */}
          <EditableInfoRow
            icon={"person-add-outline" as IoniconsName}
            label={t("detail.opposingPartyRep")}
            value={caseData.opposingPartyRepresentative}
            placeholder={t("detail.tapToEdit")}
            onSave={(v) => handleInlineFieldSave("opposingPartyRepresentative", v)}
          />

          {caseData.court && (
            <InfoRow
              icon={"business-outline" as IoniconsName}
              label={t("detail.court")}
              value={caseData.court}
            />
          )}

          {/* Inline Editable: Court Case Number */}
          <EditableInfoRow
            icon={"barcode-outline" as IoniconsName}
            label={t("detail.courtCaseNumber")}
            value={caseData.courtCaseNumber}
            placeholder={t("detail.tapToEdit")}
            onSave={(v) => handleInlineFieldSave("courtCaseNumber", v)}
          />

          {/* Inline Editable: Judge */}
          <EditableInfoRow
            icon={"podium-outline" as IoniconsName}
            label={t("detail.judge")}
            value={caseData.judge}
            placeholder={t("detail.tapToEdit")}
            onSave={(v) => handleInlineFieldSave("judge", v)}
          />

          {caseData.lawyerName && (
            <InfoRow
              icon={"shield-outline" as IoniconsName}
              label={t("detail.lawyer")}
              value={caseData.lawyerName}
            />
          )}
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
            <Ionicons name={"notebook-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
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

        {/* Billing Section (Time & Expenses) */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"cash-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
              {t("billing.title")}
            </Text>
            <Pressable onPress={() => { setAddingTime(!addingTime); setAddingExpense(false); }} style={{ marginRight: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.golden[50], paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 }}>
                <Ionicons name={"time-outline" as IoniconsName} size={14} color={colors.golden.DEFAULT} />
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("billing.addTime")}</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => { setAddingExpense(!addingExpense); setAddingTime(false); }}>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.golden[50], paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 }}>
                <Ionicons name={"wallet-outline" as IoniconsName} size={14} color={colors.golden.DEFAULT} />
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("billing.addExpense")}</Text>
              </View>
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
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.navy.DEFAULT }}>{totalExpenseAmount.toLocaleString('sr-Latn-RS')} RSD</Text>
              </View>
            </View>
          )}

          {/* Log Time Form */}
          {addingTime && (
            <View style={{ marginBottom: 12, backgroundColor: colors.golden[50] + "40", borderRadius: 8, padding: 12 }}>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <TextInput
                  style={{ flex: 1, fontSize: 14, color: colors.navy.DEFAULT, borderWidth: 1, borderColor: colors.golden[100], borderRadius: 8, padding: 10, backgroundColor: "#FFF" }}
                  keyboardType="decimal-pad"
                  placeholder="0.0"
                  placeholderTextColor="#CCC"
                  value={timeHours}
                  onChangeText={setTimeHours}
                  autoFocus
                />
                <TextInput
                  style={{ flex: 2, fontSize: 14, color: colors.navy.DEFAULT, borderWidth: 1, borderColor: colors.golden[100], borderRadius: 8, padding: 10, backgroundColor: "#FFF" }}
                  placeholder={t("billing.description")}
                  placeholderTextColor="#CCC"
                  value={timeDescription}
                  onChangeText={setTimeDescription}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <TextInput
                  style={{ flex: 1, fontSize: 14, color: colors.navy.DEFAULT, borderWidth: 1, borderColor: colors.golden[100], borderRadius: 8, padding: 10, backgroundColor: "#FFF" }}
                  placeholder="DD.MM.YYYY"
                  placeholderTextColor="#CCC"
                  value={timeDate}
                  onChangeText={setTimeDate}
                />
                <View style={{ flex: 1, flexDirection: "row", borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: colors.golden[100] }}>
                  <Pressable
                    onPress={() => setTimeBillable(true)}
                    style={{ flex: 1, backgroundColor: timeBillable ? '#E8F5E9' : '#FFF', paddingVertical: 10, alignItems: "center" }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: timeBillable ? '#2E7D32' : '#AAA' }}>{t("billing.billable")}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setTimeBillable(false)}
                    style={{ flex: 1, backgroundColor: !timeBillable ? '#ECEFF1' : '#FFF', paddingVertical: 10, alignItems: "center" }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: !timeBillable ? '#546E7A' : '#AAA' }}>{t("billing.nonBillable")}</Text>
                  </Pressable>
                </View>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
                <Pressable onPress={() => { setAddingTime(false); setTimeHours(""); setTimeDescription(""); setTimeDate(""); }}>
                  <Text style={{ fontSize: 13, color: "#AAA" }}>{t("notes.cancel")}</Text>
                </Pressable>
                <Pressable onPress={handleAddTimeEntry}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("billing.save")}</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Add Expense Form */}
          {addingExpense && (
            <View style={{ marginBottom: 12, backgroundColor: colors.golden[50] + "40", borderRadius: 8, padding: 12 }}>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <TextInput
                  style={{ flex: 1, fontSize: 14, color: colors.navy.DEFAULT, borderWidth: 1, borderColor: colors.golden[100], borderRadius: 8, padding: 10, backgroundColor: "#FFF" }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#CCC"
                  value={expenseAmount}
                  onChangeText={setExpenseAmount}
                  autoFocus
                />
                <TextInput
                  style={{ flex: 2, fontSize: 14, color: colors.navy.DEFAULT, borderWidth: 1, borderColor: colors.golden[100], borderRadius: 8, padding: 10, backgroundColor: "#FFF" }}
                  placeholder={t("billing.description")}
                  placeholderTextColor="#CCC"
                  value={expenseDescription}
                  onChangeText={setExpenseDescription}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <Pressable key={cat} onPress={() => setExpenseCategory(cat)}>
                      <View style={{
                        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
                        borderWidth: 1,
                        borderColor: expenseCategory === cat ? colors.golden.DEFAULT : '#DDD',
                        backgroundColor: expenseCategory === cat ? colors.golden[50] : '#FFF',
                      }}>
                        <Text style={{ fontSize: 11, color: expenseCategory === cat ? colors.golden[700] : '#888' }}>
                          {t(`billing.categories.${cat}`)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              {expenseCategory === 'custom' && (
                <TextInput
                  style={{ fontSize: 14, color: colors.navy.DEFAULT, borderWidth: 1, borderColor: colors.golden[100], borderRadius: 8, padding: 10, backgroundColor: "#FFF", marginBottom: 8 }}
                  placeholder={t("billing.category")}
                  placeholderTextColor="#CCC"
                  value={expenseCustomCategory}
                  onChangeText={setExpenseCustomCategory}
                />
              )}
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <TextInput
                  style={{ flex: 1, fontSize: 14, color: colors.navy.DEFAULT, borderWidth: 1, borderColor: colors.golden[100], borderRadius: 8, padding: 10, backgroundColor: "#FFF" }}
                  placeholder="DD.MM.YYYY"
                  placeholderTextColor="#CCC"
                  value={expenseDate}
                  onChangeText={setExpenseDate}
                />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
                <Pressable onPress={() => { setAddingExpense(false); setExpenseAmount(""); setExpenseDescription(""); setExpenseDate(""); setExpenseCategory("court-fees"); }}>
                  <Text style={{ fontSize: 13, color: "#AAA" }}>{t("notes.cancel")}</Text>
                </Pressable>
                <Pressable onPress={handleAddExpense}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("billing.save")}</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Combined Billing List */}
          {billingItems.length > 0 ? (
            billingItems.map((item) => {
              if (item.type === 'time') {
                const te = item.data as TimeEntry;
                return (
                  <View
                    key={te.id}
                    style={{
                      backgroundColor: "#FFF",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: colors.golden.DEFAULT,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.03,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Ionicons name={"time-outline" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
                      <Text style={{ fontSize: 15, fontWeight: "700", color: colors.navy.DEFAULT }}>{te.hours}h</Text>
                      <View style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 10,
                        backgroundColor: te.billable ? '#E8F5E9' : '#ECEFF1',
                      }}>
                        <Text style={{ fontSize: 10, fontWeight: "600", color: te.billable ? '#2E7D32' : '#546E7A' }}>
                          {te.billable ? t("billing.billable") : t("billing.nonBillable")}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }} />
                      <Pressable onPress={() => handleDeleteTimeEntry(te.id)}>
                        <Ionicons name={"trash-outline" as IoniconsName} size={16} color="#E57373" />
                      </Pressable>
                    </View>
                    <Text style={{ fontSize: 13, color: colors.navy.DEFAULT, marginTop: 4 }}>{te.description}</Text>
                    <Text style={{ fontSize: 11, color: "#BBB", marginTop: 4 }}>
                      {te.date.split("-").reverse().join(".")}
                    </Text>
                  </View>
                );
              } else {
                const ex = item.data as Expense;
                const isPaid = ex.paid === true;
                return (
                  <View
                    key={ex.id}
                    style={{
                      backgroundColor: "#FFF",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: isPaid ? '#CCC' : '#43A047',
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.03,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Pressable
                        onPress={async () => {
                          await services.expenses.updateExpense(ex.id, { paid: !isPaid });
                          const refreshed = await services.expenses.getExpensesByCaseId(id);
                          setExpenses(refreshed);
                        }}
                        hitSlop={8}
                      >
                        <Ionicons
                          name={(isPaid ? "checkmark-circle" : "ellipse-outline") as IoniconsName}
                          size={20}
                          color={isPaid ? "#2E7D32" : "#CCC"}
                        />
                      </Pressable>
                      <Ionicons name={"wallet-outline" as IoniconsName} size={18} color={isPaid ? "#AAA" : "#43A047"} />
                      <Text style={{ fontSize: 15, fontWeight: "700", color: isPaid ? "#AAA" : colors.navy.DEFAULT }}>{ex.amount.toLocaleString('sr-Latn-RS')} RSD</Text>
                      <View style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 10,
                        backgroundColor: colors.golden[50],
                      }}>
                        <Text style={{ fontSize: 10, fontWeight: "600", color: colors.golden.DEFAULT }}>
                          {t(`billing.categories.${ex.category}`)}
                        </Text>
                      </View>
                      {isPaid && (
                        <View style={{
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 8,
                          backgroundColor: "#E8F5E9",
                        }}>
                          <Text style={{ fontSize: 9, fontWeight: "700", color: "#2E7D32" }}>
                            {t("billing.paid")}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }} />
                      <Pressable onPress={() => handleDeleteExpense(ex.id)}>
                        <Ionicons name={"trash-outline" as IoniconsName} size={16} color="#E57373" />
                      </Pressable>
                    </View>
                    <Text style={{
                      fontSize: 13,
                      color: isPaid ? "#AAA" : colors.navy.DEFAULT,
                      marginTop: 4,
                      textDecorationLine: isPaid ? "line-through" : "none",
                    }}>{ex.description}</Text>
                    <Text style={{ fontSize: 11, color: "#BBB", marginTop: 4 }}>
                      {ex.date.split("-").reverse().join(".")}
                    </Text>
                  </View>
                );
              }
            })
          ) : (
            !addingTime && !addingExpense && (
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
                <Ionicons name={"cash-outline" as IoniconsName} size={28} color="#DDD" />
                <Text style={{ fontSize: 13, color: "#AAA", marginTop: 8, textAlign: "center", paddingHorizontal: 16 }}>
                  {t("billing.emptyState")}
                </Text>
              </View>
            )
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
                onPress={() => router.push(`/(tabs)/cases/${link.linkedCase.id}` as any)}
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
                  <View
                    key={doc.id}
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
                  </View>
                );
              })}
              <Pressable
                onPress={() => router.push('/(tabs)/cases/documents/' + id as any)}
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
                onPress={() => router.push('/(tabs)/cases/documents/' + id as any)}
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

        {/* Calendar Events Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"calendar-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
              {t("detail.linkedEvents")} ({caseEvents.length})
            </Text>
          </View>
          {caseEvents.length > 0 ? (
            <>
              {caseEvents
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 3)
                .map((evt) => {
                  const evtColor = EVENT_TYPE_COLORS[evt.type];
                  return (
                    <View
                      key={evt.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: "#F5F0E8",
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: evtColor.dot,
                          marginRight: 10,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontSize: 13, color: colors.navy.DEFAULT }}
                          numberOfLines={1}
                        >
                          {evt.title}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>
                          {evt.date.split("-").reverse().join(".")} {evt.startTime && evt.endTime ? `${evt.startTime} - ${evt.endTime}` : tc("allDay")}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              <Pressable
                onPress={() => router.push("/(tabs)/calendar" as any)}
                style={{
                  marginTop: 10,
                  paddingVertical: 8,
                  alignItems: "center",
                  backgroundColor: colors.golden[50],
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>
                  {tc("viewAll")}
                </Text>
              </Pressable>
            </>
          ) : (
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
              <Ionicons name={"time-outline" as IoniconsName} size={28} color="#DDD" />
              <Text style={{ fontSize: 13, color: "#AAA", marginTop: 8, textAlign: "center", paddingHorizontal: 16 }}>
                {t("detail.noEventsYet")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Quick Action Bar */}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          paddingBottom: 12 + insets.bottom,
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
    </>
  );
}

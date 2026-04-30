import { View, Text, FlatList, Pressable, ActivityIndicator, Alert, ScrollView, Modal, Linking, Platform, Image, Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { useState, useCallback } from "react";
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import * as FileSystem from "expo-file-system/legacy";
import { useServices } from "../../../../src/hooks/useServices";
import { colors } from "../../../../src/theme/tokens";
import type { ClientDocument, Client, CaseSummary, Document, DocumentFolderCategory, DocumentTemplate } from "../../../../src/services/types";
import { CLIENT_DOC_TYPES, DOC_TYPE_ICONS, formatFileSize, DOCUMENT_FOLDER_CATEGORIES, FOLDER_ICONS } from "../../../../src/services/types";
import { DeleteConfirmDialog } from "../../../../src/components/ui/DeleteConfirmDialog";
import { ConfirmDialog } from "../../../../src/components/ui/ConfirmDialog";

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

const TYPE_ICONS: Record<ClientDocument["type"], IoniconsName> = {
  "id-card": "card-outline" as IoniconsName,
  passport: "globe-outline" as IoniconsName,
  "power-of-attorney": "document-text-outline" as IoniconsName,
  "engagement-letter": "create-outline" as IoniconsName,
  other: "document-outline" as IoniconsName,
};

// Translation key per ClientDocument type — matches the existing keys used on the client overview.
const TYPE_LABEL_KEY: Record<ClientDocument["type"], string> = {
  "id-card": "idCard",
  passport: "passport",
  "power-of-attorney": "powerOfAttorney",
  "engagement-letter": "engagementLetter",
  other: "other",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function detectDocType(name: string, mime: string): Document["type"] {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime === "application/msword" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "word";
  if (mime.startsWith("text/") || mime === "application/rtf") return "text";
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic", "heif"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "word";
  if (["txt", "rtf", "csv", "md", "log"].includes(ext)) return "text";
  return "other";
}

function mimeFromName(name: string, fallback: string): string {
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
}

function isImageUri(uri: string): boolean {
  const lower = uri.toLowerCase().split("?")[0];
  return /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/.test(lower);
}

// Derive a Document-style file kind from a client doc's uri/name. ClientDocument
// only stores a domain `type` (id-card, passport, …), so file-type filters need
// to be inferred from the file extension. Mock client doc names like
// "Licna karta - Nikola Stankovic" don't carry an extension, so we try the name
// first (for user-uploaded files) and fall back to the URI when that fails.
function fileKindFromUri(uri: string, name: string): "pdf" | "image" | "word" | "text" | "other" {
  const inspect = (s: string): "pdf" | "image" | "word" | "text" | "other" | null => {
    const cleaned = s.toLowerCase().split("?")[0];
    if (!cleaned.includes(".")) return null;
    const ext = cleaned.split(".").pop() ?? "";
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic", "heif"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    if (ext === "doc" || ext === "docx") return "word";
    if (["txt", "rtf", "csv", "md", "log"].includes(ext)) return "text";
    return null;
  };
  return inspect(name) ?? inspect(uri) ?? "other";
}

type Tab = "client" | "case";
type FileTypeFilter = "all" | "pdf" | "image" | "word" | "text";

export default function ClientDocumentsScreen() {
  // initialTab / initialCaseId come from the case overview's "Pogledaj sve" button
  // so a user opening docs from a case lands on the Case tab with that case picked.
  const { clientId, initialTab, initialCaseId } = useLocalSearchParams<{
    clientId: string;
    initialTab?: string;
    initialCaseId?: string;
  }>();
  const { t } = useTranslation("clients");
  const { t: td } = useTranslation("documents");
  const services = useServices();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>(initialTab === "case" ? "case" : "client");

  // Client-level documents
  const [docs, setDocs] = useState<ClientDocument[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | ClientDocument["type"]>("all");
  const [clientFileTypeFilter, setClientFileTypeFilter] = useState<FileTypeFilter>("all");
  const [enhancing, setEnhancing] = useState(false);

  // Case-level documents — aggregated across all of the client's cases.
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [caseDocs, setCaseDocs] = useState<Document[]>([]);
  // null means "all cases"; only meaningful when cases.length > 1.
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseFileTypeFilter, setCaseFileTypeFilter] = useState<FileTypeFilter>("all");
  const [caseSelectedFolder, setCaseSelectedFolder] = useState<"all" | DocumentFolderCategory>("all");
  const [casePickerVisible, setCasePickerVisible] = useState(false);

  // Case-tab upload/capture flow: after the asset is captured/picked we ask the
  // user which folder it belongs to (mirrors the case-documents page).
  type CasePendingAsset = { uri: string; name: string; type: Document["type"]; mimeType: string; size: number; caseId: string };
  const [casePendingAsset, setCasePendingAsset] = useState<CasePendingAsset | null>(null);
  const [folderPickerVisible, setFolderPickerVisible] = useState(false);

  // Pending asset waiting for the user to pick its document type.
  type PendingAsset = { uri: string; name: string };
  const [pendingAsset, setPendingAsset] = useState<PendingAsset | null>(null);
  const [typePickerVisible, setTypePickerVisible] = useState(false);

  // Speed-dial FAB (matches the home page) — opens Take Photo / Upload File / From template.
  const [fabOpen, setFabOpen] = useState(false);

  // Template flow: pick a template → copy file into the documents directory →
  // run it through the existing folder/type picker → open the new file in an
  // external editor so the user can edit the copy.
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatePickerVisible, setTemplatePickerVisible] = useState(false);
  // When set, the next folder/type save also opens the file in the system editor.
  const [openAfterSave, setOpenAfterSave] = useState<{ uri: string; name: string; mimeType: string; isImage: boolean } | null>(null);

  // Delete + image preview + capture confirm modals (mirrors case docs page)
  const [deleteDocConfirm, setDeleteDocConfirm] = useState<ClientDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ uri: string } | null>(null);
  const [captureConfirm, setCaptureConfirm] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const loadData = useCallback(async () => {
    if (!clientId) return;
    const [d, c, cs] = await Promise.all([
      services.clientDocuments.getByClientId(clientId),
      services.clients.getClientById(clientId),
      services.cases.getCasesByClientId(clientId),
    ]);
    setDocs(d);
    setClient(c);
    setCases(cs);
    // Pull every case's docs in parallel and flatten them.
    const docsPerCase = await Promise.all(cs.map((cse) => services.documents.getDocumentsByCaseId(cse.id)));
    setCaseDocs(docsPerCase.flat());
    // Pre-select: explicit initialCaseId from the case-overview link wins;
    // otherwise lock to the only case so the dropdown can be hidden.
    if (initialCaseId && cs.some((cse) => cse.id === initialCaseId)) {
      setSelectedCaseId(initialCaseId);
    } else if (cs.length === 1) {
      setSelectedCaseId(cs[0].id);
    }
    setLoading(false);
  }, [clientId, services, initialCaseId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filteredDocs = docs.filter((d) => {
    if (filterType !== "all" && d.type !== filterType) return false;
    if (clientFileTypeFilter !== "all" && fileKindFromUri(d.uri, d.name) !== clientFileTypeFilter) return false;
    return true;
  });

  const filteredCaseDocs = caseDocs.filter((d) => {
    if (selectedCaseId && d.caseId !== selectedCaseId) return false;
    if (caseFileTypeFilter !== "all" && d.type !== caseFileTypeFilter) return false;
    if (caseSelectedFolder !== "all" && d.folderId !== caseSelectedFolder) return false;
    return true;
  });

  // Resolve which case the new asset should belong to. Returns the caseId, or
  // null after surfacing an alert if the user must pick one first.
  const resolveTargetCaseId = (): string | null => {
    if (cases.length === 1) return cases[0].id;
    if (selectedCaseId) return selectedCaseId;
    Alert.alert(t("clientDocuments.selectCase"), t("clientDocuments.pickCaseHint"));
    setCasePickerVisible(true);
    return null;
  };

  const caseById = (cid: string): CaseSummary | undefined => cases.find((c) => c.id === cid);
  const selectedCase = selectedCaseId ? caseById(selectedCaseId) : null;

  const showTypePicker = (asset: PendingAsset) => {
    setPendingAsset(asset);
    setTypePickerVisible(true);
  };

  const handleTypeSelected = async (type: ClientDocument["type"]) => {
    setTypePickerVisible(false);
    if (pendingAsset && clientId) {
      const asset = pendingAsset;
      setPendingAsset(null);
      await services.clientDocuments.create({
        clientId,
        type,
        name: asset.name,
        uri: asset.uri,
      });
      await loadData();
      // Template flow: open the freshly-created copy in the system editor.
      const open = openAfterSave;
      if (open) {
        setOpenAfterSave(null);
        await openUri(open.uri, open.name, open.isImage, open.mimeType);
      }
    }
  };

  const handleUploadFile = async () => {
    // Case tab requires a target case before the picker even opens.
    let targetCaseId: string | null = null;
    if (activeTab === "case") {
      targetCaseId = resolveTargetCaseId();
      if (!targetCaseId) return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "image/*",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/*",
        "application/rtf",
      ],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (activeTab === "case" && targetCaseId) {
        const mime = mimeFromName(asset.name, asset.mimeType ?? "");
        const docType = detectDocType(asset.name, mime);
        setCasePendingAsset({
          uri: asset.uri,
          name: asset.name,
          type: docType,
          mimeType: mime,
          size: asset.size ?? 0,
          caseId: targetCaseId,
        });
        setFolderPickerVisible(true);
      } else {
        showTypePicker({ uri: asset.uri, name: asset.name });
      }
    }
  };

  const handleCapturePhoto = async () => {
    if (activeTab === "case" && resolveTargetCaseId() === null) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(td("permissionRequired"), td("permissionDenied"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCaptureConfirm(result.assets[0]);
    }
  };

  const handleUsePhoto = () => {
    const asset = captureConfirm;
    setCaptureConfirm(null);
    if (!asset) return;
    if (activeTab === "case") {
      const cid = resolveTargetCaseId();
      if (!cid) return;
      setEnhancing(true);
      setTimeout(() => {
        setEnhancing(false);
        const name = "Photo_" + Date.now() + ".jpg";
        setCasePendingAsset({
          uri: asset.uri,
          name,
          type: "image",
          mimeType: asset.mimeType ?? "image/jpeg",
          size: asset.fileSize ?? 0,
          caseId: cid,
        });
        setFolderPickerVisible(true);
      }, 1500);
      return;
    }
    setEnhancing(true);
    setTimeout(() => {
      setEnhancing(false);
      const name = "Photo_" + Date.now() + ".jpg";
      showTypePicker({ uri: asset.uri, name });
    }, 1500);
  };

  const handleCaseFolderSelected = async (folderId: DocumentFolderCategory) => {
    setFolderPickerVisible(false);
    if (casePendingAsset) {
      const a = casePendingAsset;
      setCasePendingAsset(null);
      await services.documents.addDocument({
        caseId: a.caseId,
        name: a.name,
        type: a.type,
        mimeType: a.mimeType,
        size: a.size,
        uri: a.uri,
        folderId,
      });
      await loadData();
      // Template flow: open the freshly-created copy in the system editor.
      const open = openAfterSave;
      if (open) {
        setOpenAfterSave(null);
        await openUri(open.uri, open.name, open.isImage, open.mimeType);
      }
    }
  };

  const handleRetakePhoto = () => {
    setCaptureConfirm(null);
    handleCapturePhoto();
  };

  // Open the template picker. For the case tab, ensure a target case is
  // selected first (same gating as upload/capture).
  const handleOpenTemplatePicker = async () => {
    if (activeTab === "case" && resolveTargetCaseId() === null) return;
    setTemplatePickerVisible(true);
    setTemplatesLoading(true);
    try {
      const list = await services.documentTemplates.getAll();
      setTemplates(list);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Copy the chosen template into the app's documents directory and feed the
  // copy through the existing folder/type save flow. Once saved, the file is
  // opened in an external editor (`openAfterSave`).
  const handleTemplateSelected = async (tpl: DocumentTemplate) => {
    setTemplatePickerVisible(false);
    try {
      const ext = (tpl.uri.toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/)?.[1])
        ?? (tpl.type === "word" ? "rtf" : "txt");
      const safeBase = tpl.name.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 60) || "Document";
      const targetDir = (FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? "") + "from-templates/";
      const dirInfo = await FileSystem.getInfoAsync(targetDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
      }
      const newName = `${safeBase}-${Date.now()}.${ext}`;
      const newUri = targetDir + newName;
      await FileSystem.copyAsync({ from: tpl.uri, to: newUri });
      const info = await FileSystem.getInfoAsync(newUri);
      const newSize = (info.exists && "size" in info ? info.size : tpl.size) ?? tpl.size;

      // Schedule the editor to open after the document record is saved.
      setOpenAfterSave({ uri: newUri, name: newName, mimeType: tpl.mimeType, isImage: false });

      if (activeTab === "case") {
        const cid = resolveTargetCaseId();
        if (!cid) {
          setOpenAfterSave(null);
          return;
        }
        setCasePendingAsset({
          uri: newUri,
          name: newName,
          type: tpl.type,
          mimeType: tpl.mimeType,
          size: newSize,
          caseId: cid,
        });
        setFolderPickerVisible(true);
      } else {
        setPendingAsset({ uri: newUri, name: newName });
        setTypePickerVisible(true);
      }
    } catch (err) {
      Alert.alert(td("cannotOpenTitle"), td("cannotOpenMessage"));
      setOpenAfterSave(null);
    }
  };

  const confirmDeleteDocument = async () => {
    if (!deleteDocConfirm) return;
    const id = deleteDocConfirm.id;
    setDeleteDocConfirm(null);
    await services.clientDocuments.delete(id);
    await loadData();
  };

  const openUri = async (uri: string, name: string, isImage: boolean, providedMime?: string) => {
    if (!uri || uri.startsWith("file://mock/")) {
      Alert.alert(td("cannotOpenTitle"), td("cannotOpenMessage"));
      return;
    }
    if (isImage) {
      setPreviewDoc({ uri });
      return;
    }
    const mimeType = providedMime || mimeFromName(name, "");
    try {
      if (Platform.OS === "android") {
        const contentUri = uri.startsWith("file://") ? await FileSystem.getContentUriAsync(uri) : uri;
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
          type: mimeType,
        });
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType, dialogTitle: name, UTI: mimeType });
        return;
      }
      const supported = await Linking.canOpenURL(uri);
      if (supported) {
        await Linking.openURL(uri);
      } else {
        Alert.alert(td("cannotOpenTitle"), td("cannotOpenMessage"));
      }
    } catch {
      Alert.alert(td("cannotOpenTitle"), td("cannotOpenMessage"));
    }
  };

  const handleOpenDoc = (doc: ClientDocument) => openUri(doc.uri, doc.name, isImageUri(doc.uri));
  const handleOpenCaseDoc = (doc: Document) => openUri(doc.uri, doc.name, doc.type === "image", doc.mimeType);

  const filterOptions: { key: "all" | ClientDocument["type"]; label: string; icon: IoniconsName }[] = [
    { key: "all", label: t("clientDocuments.filterAll"), icon: "albums-outline" as IoniconsName },
    ...CLIENT_DOC_TYPES.map((tp) => ({
      key: tp,
      label: t("clientDocuments." + TYPE_LABEL_KEY[tp]),
      icon: TYPE_ICONS[tp],
    })),
  ];

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: t("clientDocuments.title") }} />
        <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: client
            ? `${t("clientDocuments.title")} - ${client.type === "corporate" ? (client.companyName ?? "") : `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()}`
            : t("clientDocuments.title"),
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
        {enhancing && (
          <View
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 999,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 32, alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
              <Text style={{ fontSize: 15, color: colors.navy.DEFAULT, marginTop: 12, fontWeight: "600" }}>
                {td("scanning.enhancing")}
              </Text>
            </View>
          </View>
        )}

        {/* Tab bar — segmented-control style matching the new-client type toggle
            (Fizicko / Pravno lice). Active tab gets the golden background. */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            padding: 4,
            marginHorizontal: 16,
            marginTop: 12,
            borderWidth: 1,
            borderColor: "#F0EAE0",
          }}
        >
          {(
            [
              { key: "client", icon: "person-outline" as IoniconsName, labelKey: "clientDocuments.tabClient" },
              { key: "case", icon: "folder-outline" as IoniconsName, labelKey: "clientDocuments.tabCase" },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: isActive ? colors.golden.DEFAULT : "transparent",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Ionicons name={tab.icon} size={16} color={isActive ? "#FFFFFF" : "#888"} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: isActive ? "#FFFFFF" : "#888" }}>
                  {t(tab.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "case" && (() => {
          // Case picker shown only when more than one case exists.
          if (cases.length === 0) {
            return (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
                <Ionicons name={"folder-open-outline" as IoniconsName} size={48} color="#DDD" />
                <Text style={{ fontSize: 14, color: "#AAA", marginTop: 12, textAlign: "center" }}>
                  {t("clientDocuments.noCases")}
                </Text>
              </View>
            );
          }
          return (
            <>
              {cases.length > 1 && (
                <View style={{ ...SECTION_CARD, marginTop: 12, paddingVertical: 10 }}>
                  <Pressable
                    onPress={() => setCasePickerVisible(true)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      paddingHorizontal: 4,
                      paddingVertical: 6,
                    }}
                  >
                    <Ionicons name={"folder-outline" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: "#888" }}>{t("clientDocuments.selectCase")}</Text>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }} numberOfLines={1}>
                        {selectedCase ? `${selectedCase.title} (${selectedCase.caseNumber})` : t("clientDocuments.allCases")}
                      </Text>
                    </View>
                    <Ionicons name={"chevron-down" as IoniconsName} size={18} color={colors.navy.DEFAULT} />
                  </Pressable>
                </View>
              )}

              {/* Folder filter chips — 2-row horizontal-scroll layout (matches case docs page).
                  Drives `caseSelectedFolder` (Sve / Podnesci / Dokazi / Prepiska / …). */}
              <View style={{ ...SECTION_CARD, marginTop: cases.length > 1 ? 0 : 12 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ gap: 8 }}>
                    {(() => {
                      const folderChips: { key: "all" | DocumentFolderCategory; label: string; icon: IoniconsName }[] = [
                        { key: "all", label: td("folders.all"), icon: "albums-outline" as IoniconsName },
                        ...DOCUMENT_FOLDER_CATEGORIES.map((cat) => ({
                          key: cat,
                          label: td("folders." + cat),
                          icon: FOLDER_ICONS[cat] as IoniconsName,
                        })),
                      ];
                      const perRow = Math.ceil(folderChips.length / 2);
                      return [0, 1].map((rowIdx) => (
                        <View key={rowIdx} style={{ flexDirection: "row", gap: 8 }}>
                          {folderChips.slice(rowIdx * perRow, (rowIdx + 1) * perRow).map((opt) => {
                            const isActive = caseSelectedFolder === opt.key;
                            return (
                              <Pressable
                                key={opt.key}
                                onPress={() => setCaseSelectedFolder(opt.key)}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  paddingHorizontal: 14,
                                  paddingVertical: 8,
                                  borderRadius: 20,
                                  backgroundColor: isActive ? colors.navy.DEFAULT : "#F5F5F5",
                                  gap: 6,
                                }}
                              >
                                <Ionicons name={opt.icon} size={16} color={isActive ? "#FFFFFF" : colors.navy.DEFAULT} />
                                <Text style={{ fontSize: 13, fontWeight: "600", color: isActive ? "#FFFFFF" : colors.navy.DEFAULT }}>
                                  {opt.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ));
                    })()}
                  </View>
                </ScrollView>
              </View>

              {/* File-type filter chips — single row, scrolls horizontally */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0, flexShrink: 0, marginBottom: 12 }}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }}
              >
                {(["all", "pdf", "image", "word", "text"] as const).map((key) => {
                  const isActive = caseFileTypeFilter === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setCaseFileTypeFilter(key)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 7,
                        borderRadius: 16,
                        backgroundColor: isActive ? colors.navy.DEFAULT : "#FFFFFF",
                        borderWidth: 1,
                        borderColor: isActive ? colors.navy.DEFAULT : "#E0E0E0",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "600", color: isActive ? "#FFFFFF" : colors.navy.DEFAULT }}>
                        {td("filter." + key)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {filteredCaseDocs.length === 0 ? (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
                  <View
                    style={{
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: "#DDD",
                      borderRadius: 16,
                      paddingVertical: 40,
                      paddingHorizontal: 32,
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <Ionicons name={"folder-open-outline" as IoniconsName} size={48} color="#DDD" />
                    <Text style={{ fontSize: 14, color: "#AAA", marginTop: 12, textAlign: "center" }}>
                      {t("clientDocuments.noCaseDocs")}
                    </Text>
                  </View>
                </View>
              ) : (
                <FlatList
                  data={filteredCaseDocs}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                  renderItem={({ item }) => {
                    const iconInfo = DOC_TYPE_ICONS[item.type];
                    const owningCase = caseById(item.caseId);
                    return (
                      <Pressable
                        onPress={() => handleOpenCaseDoc(item)}
                        style={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: 12,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.04,
                          shadowRadius: 4,
                          elevation: 1,
                          borderWidth: 1,
                          borderColor: "#FFF3E0",
                        }}
                      >
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            backgroundColor: iconInfo.color + "15",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <Ionicons name={iconInfo.icon as IoniconsName} size={26} color={iconInfo.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 2 }} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: "#999" }}>
                            {formatDate(item.createdAt)} · {td("fileTypes." + item.type)}
                          </Text>
                          {owningCase && (
                            <Text style={{ fontSize: 11, color: colors.golden.DEFAULT, fontWeight: "600", marginTop: 2 }} numberOfLines={1}>
                              {owningCase.caseNumber} — {owningCase.title}
                            </Text>
                          )}
                        </View>
                        <Text style={{ fontSize: 11, color: "#BBB", marginLeft: 8 }}>{formatFileSize(item.size)}</Text>
                      </Pressable>
                    );
                  }}
                />
              )}
            </>
          );
        })()}

        {activeTab === "client" && <>
        {/* Type filter chips — wrapped 2-row layout that scrolls horizontally if overflowing */}
        <View style={{ ...SECTION_CARD, marginTop: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ gap: 8 }}>
              {(() => {
                const perRow = Math.ceil(filterOptions.length / 2);
                return [0, 1].map((rowIdx) => (
                  <View key={rowIdx} style={{ flexDirection: "row", gap: 8 }}>
                    {filterOptions.slice(rowIdx * perRow, (rowIdx + 1) * perRow).map((opt) => {
                      const isActive = filterType === opt.key;
                      return (
                        <Pressable
                          key={opt.key}
                          onPress={() => setFilterType(opt.key)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 20,
                            backgroundColor: isActive ? colors.navy.DEFAULT : "#F5F5F5",
                            gap: 6,
                          }}
                        >
                          <Ionicons name={opt.icon} size={16} color={isActive ? "#FFFFFF" : colors.navy.DEFAULT} />
                          <Text style={{ fontSize: 13, fontWeight: "600", color: isActive ? "#FFFFFF" : colors.navy.DEFAULT }}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ));
              })()}
            </View>
          </ScrollView>
        </View>

        {/* File-type filter chips on the Client tab — same slim single-row layout
            used on the Case tab (Sve / PDF / Slike / Word / Tekst). */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 0, marginBottom: 12 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }}
        >
          {(["all", "pdf", "image", "word", "text"] as const).map((key) => {
            const isActive = clientFileTypeFilter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setClientFileTypeFilter(key)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 7,
                  borderRadius: 16,
                  backgroundColor: isActive ? colors.navy.DEFAULT : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: isActive ? colors.navy.DEFAULT : "#E0E0E0",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: isActive ? "#FFFFFF" : colors.navy.DEFAULT }}>
                  {td("filter." + key)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Document list */}
        {filteredDocs.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <View
              style={{
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: "#DDD",
                borderRadius: 16,
                paddingVertical: 40,
                paddingHorizontal: 32,
                alignItems: "center",
                width: "100%",
              }}
            >
              <Ionicons name={"cloud-upload-outline" as IoniconsName} size={48} color="#DDD" />
              <Text style={{ fontSize: 15, color: "#AAA", marginTop: 12, textAlign: "center" }}>
                {t("clientDocuments.noDocsYet")}
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredDocs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleOpenDoc(item)}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                  borderWidth: 1,
                  borderColor: "#FFF3E0",
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: colors.golden[50],
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name={TYPE_ICONS[item.type]} size={26} color={colors.golden.DEFAULT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 2 }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <View style={{ backgroundColor: colors.golden[50], borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: colors.golden.DEFAULT }}>
                        {t("clientDocuments." + TYPE_LABEL_KEY[item.type])}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: "#999" }}>{formatDate(item.createdAt)}</Text>
                    {item.expiresAt && (
                      <Text style={{ fontSize: 11, color: "#A89F8F" }}>
                        · {t("clientDocuments.expiresAt")}: {formatDate(item.expiresAt)}
                      </Text>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    setDeleteDocConfirm(item);
                  }}
                  hitSlop={8}
                  style={{ marginLeft: 8, padding: 4 }}
                >
                  <Ionicons name={"trash-outline" as IoniconsName} size={18} color="#E57373" />
                </Pressable>
              </Pressable>
            )}
          />
        )}
        </>}

        {/* Speed-dial FAB — Take Photo / Upload File (mirrors the home page FAB). */}
        {fabOpen && (
          <>
            <Pressable
              onPress={() => setFabOpen(false)}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.3)" }}
            />
            {(
              [
                { icon: "camera-outline" as IoniconsName, label: td("capturePhoto"), onPress: handleCapturePhoto },
                { icon: "document-attach-outline" as IoniconsName, label: td("uploadFile"), onPress: handleUploadFile },
                { icon: "library-outline" as IoniconsName, label: td("createFromTemplate"), onPress: handleOpenTemplatePicker },
              ] as const
            ).map((action, index) => (
              <Pressable
                key={action.label}
                onPress={() => {
                  setFabOpen(false);
                  action.onPress();
                }}
                style={{
                  position: "absolute",
                  bottom: 88 + index * 56,
                  right: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 28,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.golden[50],
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Ionicons name={action.icon} size={18} color={colors.golden.DEFAULT} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT }}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </>
        )}

        {/* Main FAB */}
        <Pressable
          onPress={() => setFabOpen((prev) => !prev)}
          style={{
            position: "absolute",
            bottom: 24,
            right: 20,
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: colors.golden.DEFAULT,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.golden.DEFAULT,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 6,
            zIndex: 10,
          }}
        >
          <Ionicons name={(fabOpen ? "close" : "add") as IoniconsName} size={28} color="#FFFFFF" />
        </Pressable>

        {/* Case picker — only matters when more than one case exists. */}
        <Modal
          visible={casePickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCasePickerVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingTop: 20,
                paddingBottom: 40,
                paddingHorizontal: 20,
                maxHeight: "80%",
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 16, textAlign: "center" }}>
                {t("clientDocuments.selectCase")}
              </Text>
              <ScrollView style={{ maxHeight: 400 }}>
                <Pressable
                  onPress={() => {
                    setSelectedCaseId(null);
                    setCasePickerVisible(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F0F0F0",
                    gap: 12,
                  }}
                >
                  <Ionicons name={"albums-outline" as IoniconsName} size={20} color={colors.navy.DEFAULT} />
                  <Text style={{ fontSize: 15, color: colors.navy.DEFAULT, fontWeight: selectedCaseId === null ? "700" : "500", flex: 1 }}>
                    {t("clientDocuments.allCases")}
                  </Text>
                  {selectedCaseId === null && (
                    <Ionicons name={"checkmark" as IoniconsName} size={20} color={colors.golden.DEFAULT} />
                  )}
                </Pressable>
                {cases.map((cse) => {
                  const isActive = selectedCaseId === cse.id;
                  return (
                    <Pressable
                      key={cse.id}
                      onPress={() => {
                        setSelectedCaseId(cse.id);
                        setCasePickerVisible(false);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "#F0F0F0",
                        gap: 12,
                      }}
                    >
                      <Ionicons name={"folder-outline" as IoniconsName} size={20} color={colors.golden.DEFAULT} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: isActive ? "700" : "600", color: colors.navy.DEFAULT }} numberOfLines={1}>
                          {cse.title}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#888", marginTop: 2 }} numberOfLines={1}>
                          {cse.caseNumber}
                        </Text>
                      </View>
                      {isActive && <Ionicons name={"checkmark" as IoniconsName} size={20} color={colors.golden.DEFAULT} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Pressable
                onPress={() => setCasePickerVisible(false)}
                style={{ marginTop: 12, alignItems: "center", paddingVertical: 14, backgroundColor: "#F5F5F5", borderRadius: 12 }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#999" }}>{td("cancel")}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Template picker — opens from the FAB's "Create from template" action.
            Lists firm-wide DocumentTemplates; on selection the file is copied
            into the documents directory and run through the existing folder/
            type picker → save → open-in-editor flow. */}
        <Modal
          visible={templatePickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setTemplatePickerVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingTop: 20,
                paddingBottom: 40,
                paddingHorizontal: 20,
                maxHeight: "80%",
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 16, textAlign: "center" }}>
                {td("pickTemplate")}
              </Text>
              {templatesLoading ? (
                <View style={{ paddingVertical: 30, alignItems: "center" }}>
                  <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
                </View>
              ) : templates.length === 0 ? (
                <View style={{ paddingVertical: 30, alignItems: "center" }}>
                  <Ionicons name={"library-outline" as IoniconsName} size={32} color="#DDD" />
                  <Text style={{ marginTop: 8, color: "#999" }}>{td("noTemplates")}</Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 420 }}>
                  {templates.map((tpl) => (
                    <Pressable
                      key={tpl.id}
                      onPress={() => handleTemplateSelected(tpl)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "#F0F0F0",
                        gap: 12,
                      }}
                    >
                      <Ionicons
                        name={(tpl.type === "word" ? "document-outline" : "reader-outline") as IoniconsName}
                        size={22}
                        color={colors.golden.DEFAULT}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT }} numberOfLines={1}>
                          {tpl.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                          {tpl.category} · {tpl.type === "word" ? "Word" : "Text"}
                        </Text>
                      </View>
                      <Ionicons name={"chevron-forward" as IoniconsName} size={16} color="#CCC" />
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              <Pressable
                onPress={() => setTemplatePickerVisible(false)}
                style={{ marginTop: 12, alignItems: "center", paddingVertical: 14, backgroundColor: "#F5F5F5", borderRadius: 12 }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#999" }}>{td("cancel")}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Folder picker — opens after a case-tab capture/upload, mirrors the case docs page. */}
        <Modal
          visible={folderPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFolderPickerVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingTop: 20,
                paddingBottom: 40,
                paddingHorizontal: 20,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 16, textAlign: "center" }}>
                {td("selectFolder")}
              </Text>
              {DOCUMENT_FOLDER_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => handleCaseFolderSelected(cat)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F0F0F0",
                    gap: 12,
                  }}
                >
                  <Ionicons name={FOLDER_ICONS[cat] as IoniconsName} size={22} color={colors.navy.DEFAULT} />
                  <Text style={{ fontSize: 15, color: colors.navy.DEFAULT, fontWeight: "500" }}>
                    {td("folders." + cat)}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => {
                  setFolderPickerVisible(false);
                  setCasePendingAsset(null);
                }}
                style={{
                  marginTop: 12,
                  alignItems: "center",
                  paddingVertical: 14,
                  backgroundColor: "#F5F5F5",
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#999" }}>{td("cancel")}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Document type picker — opens after a file is captured/uploaded */}
        <Modal
          visible={typePickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setTypePickerVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingTop: 20,
                paddingBottom: 40,
                paddingHorizontal: 20,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 16, textAlign: "center" }}>
                {t("clientDocuments.selectType")}
              </Text>
              {CLIENT_DOC_TYPES.map((tp) => (
                <Pressable
                  key={tp}
                  onPress={() => handleTypeSelected(tp)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F0F0F0",
                    gap: 12,
                  }}
                >
                  <Ionicons name={TYPE_ICONS[tp]} size={22} color={colors.navy.DEFAULT} />
                  <Text style={{ fontSize: 15, color: colors.navy.DEFAULT, fontWeight: "500" }}>
                    {t("clientDocuments." + TYPE_LABEL_KEY[tp])}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => {
                  setTypePickerVisible(false);
                  setPendingAsset(null);
                }}
                style={{
                  marginTop: 12,
                  alignItems: "center",
                  paddingVertical: 14,
                  backgroundColor: "#F5F5F5",
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#999" }}>{td("cancel")}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Image preview modal */}
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

        {/* Capture confirm dialog (golden tone, secondary "Retake") */}
        <ConfirmDialog
          visible={captureConfirm !== null}
          onCancel={() => setCaptureConfirm(null)}
          onConfirm={handleUsePhoto}
          onSecondary={handleRetakePhoto}
          secondaryLabel={td("scanning.retake")}
          title={td("scanning.scanConfirmTitle")}
          body={td("scanning.scanConfirmMessage")}
          confirmLabel={td("scanning.usePhoto")}
          icon={"camera-outline"}
          tone="default"
        />

        <DeleteConfirmDialog
          visible={deleteDocConfirm !== null}
          onCancel={() => setDeleteDocConfirm(null)}
          onConfirm={confirmDeleteDocument}
          title={td("deleteConfirmTitle")}
          body={deleteDocConfirm ? td("deleteConfirmMessage", { name: deleteDocConfirm.name }) : ""}
          confirmLabel={td("deleteDocument")}
        />
      </View>
    </>
  );
}

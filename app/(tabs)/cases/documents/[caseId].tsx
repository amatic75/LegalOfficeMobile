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
import { useDocumentStore } from "../../../../src/stores/document-store";
import { colors } from "../../../../src/theme/tokens";
import type { Document, CaseSummary, DocumentFolder, DocumentFolderCategory, DocumentTemplate } from "../../../../src/services/types";
import { formatFileSize, DOC_TYPE_ICONS, DOCUMENT_FOLDER_CATEGORIES, FOLDER_ICONS } from "../../../../src/services/types";
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

const IMAGE_MIME_PREFIX = "image/";
const PDF_MIME = "application/pdf";
const TEXT_MIME_PREFIXES = ["text/"];
const TEXT_EXTRA_MIMES = new Set(["application/rtf", "application/json", "application/xml"]);
const WORD_MIMES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function detectDocType(name: string, mime: string): Document["type"] {
  if (mime.startsWith(IMAGE_MIME_PREFIX)) return "image";
  if (mime === PDF_MIME) return "pdf";
  if (WORD_MIMES.has(mime)) return "word";
  if (TEXT_MIME_PREFIXES.some((p) => mime.startsWith(p)) || TEXT_EXTRA_MIMES.has(mime)) return "text";
  // Fall back to file extension when MIME is missing/generic
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
    case "pdf": return PDF_MIME;
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

export default function DocumentListScreen() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const { t } = useTranslation("documents");
  const services = useServices();
  const router = useRouter();

  const { filterType, setFilterType } = useDocumentStore();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [caseData, setCaseData] = useState<CaseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [enhancing, setEnhancing] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  // Typed shape for the asset we hand off to the folder picker — keeps detected
  // file type / mime / size intact instead of round-tripping through ImagePickerAsset
  // (which silently dropped them and made every upload look like a JPEG).
  type PendingAsset = {
    uri: string;
    name: string;
    type: Document["type"];
    mimeType: string;
    size: number;
  };
  const [pendingPhotoAsset, setPendingPhotoAsset] = useState<PendingAsset | null>(null);
  const [deleteDocConfirm, setDeleteDocConfirm] = useState<Document | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  // Captured photo waiting for the user to confirm "Use Photo" or "Retake".
  // Replaces the native Alert.alert with our themed ConfirmDialog.
  const [captureConfirm, setCaptureConfirm] = useState<ImagePicker.ImagePickerAsset | null>(null);
  // Speed-dial FAB (matches the home page) — opens Take Photo / Upload File / From template.
  const [fabOpen, setFabOpen] = useState(false);
  // Template flow state — see clients/documents page for the full pattern.
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatePickerVisible, setTemplatePickerVisible] = useState(false);
  const [openAfterSave, setOpenAfterSave] = useState<Document | null>(null);

  const loadData = useCallback(async () => {
    if (!caseId) return;
    const [docs, cs, fldrs] = await Promise.all([
      services.documents.getDocumentsByCaseId(caseId),
      services.cases.getCaseById(caseId),
      services.documents.getDocumentFolders(caseId),
    ]);
    setDocuments(docs);
    setCaseData(cs);
    setFolders(fldrs);
    setLoading(false);
  }, [caseId, services]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filteredDocs = documents.filter((doc) => {
    if (filterType !== "all" && doc.type !== filterType) return false;
    if (selectedFolder !== "all" && doc.folderId !== selectedFolder) return false;
    return true;
  });

  const saveDocumentWithFolder = async (
    asset: { uri: string; name: string; type: Document["type"]; mimeType: string; size: number },
    folderId: string,
  ) => {
    await services.documents.addDocument({
      caseId: caseId!,
      name: asset.name,
      type: asset.type,
      mimeType: asset.mimeType,
      size: asset.size,
      uri: asset.uri,
      folderId,
    });
    await loadData();
  };

  const showFolderPicker = (asset: PendingAsset) => {
    setPendingPhotoAsset(asset);
    setFolderModalVisible(true);
  };

  const handleFolderSelected = async (folderId: string) => {
    setFolderModalVisible(false);
    if (pendingPhotoAsset) {
      const asset = pendingPhotoAsset;
      setPendingPhotoAsset(null);
      await saveDocumentWithFolder(asset, folderId);
      // Template flow: open the freshly-saved copy in the system editor.
      const open = openAfterSave;
      if (open) {
        setOpenAfterSave(null);
        await handleOpenDoc(open);
      }
    }
  };

  // Open the template picker (lazy-loads the template list on first open).
  const handleOpenTemplatePicker = async () => {
    setTemplatePickerVisible(true);
    setTemplatesLoading(true);
    try {
      const list = await services.documentTemplates.getAll();
      setTemplates(list);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Copy the chosen template into the documents directory and feed it through
  // the existing folder picker → save → open-in-editor flow.
  const handleTemplateSelected = async (tpl: DocumentTemplate) => {
    setTemplatePickerVisible(false);
    try {
      const ext = (tpl.uri.toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/)?.[1])
        ?? (tpl.type === "word" ? "rtf" : "txt");
      const safeBase = tpl.name.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 60) || "Document";
      const targetDir = (FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? "") + "from-templates/";
      const dirInfo = await FileSystem.getInfoAsync(targetDir);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
      const newName = `${safeBase}-${Date.now()}.${ext}`;
      const newUri = targetDir + newName;
      await FileSystem.copyAsync({ from: tpl.uri, to: newUri });
      const info = await FileSystem.getInfoAsync(newUri);
      const newSize = (info.exists && "size" in info ? info.size : tpl.size) ?? tpl.size;

      // Schedule open-in-editor right after the document record is saved.
      setOpenAfterSave({
        id: "pending",
        caseId: caseId!,
        name: newName,
        type: tpl.type,
        mimeType: tpl.mimeType,
        size: newSize,
        uri: newUri,
        createdAt: new Date().toISOString(),
      });
      showFolderPicker({
        uri: newUri,
        name: newName,
        type: tpl.type,
        mimeType: tpl.mimeType,
        size: newSize,
      });
    } catch {
      Alert.alert(t("cannotOpenTitle"), t("cannotOpenMessage"));
      setOpenAfterSave(null);
    }
  };

  const handleCapturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("permissionRequired"), t("permissionDenied"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Hand off to the themed ConfirmDialog instead of Alert.alert.
      setCaptureConfirm(result.assets[0]);
    }
  };

  const handleUsePhoto = () => {
    const asset = captureConfirm;
    setCaptureConfirm(null);
    if (!asset) return;
    setEnhancing(true);
    setTimeout(() => {
      setEnhancing(false);
      showFolderPicker({
        uri: asset.uri,
        name: "Photo_" + Date.now() + ".jpg",
        type: "image",
        mimeType: asset.mimeType ?? "image/jpeg",
        size: asset.fileSize ?? 0,
      });
    }, 1500);
  };

  const handleRetakePhoto = () => {
    setCaptureConfirm(null);
    handleCapturePhoto();
  };

  const handleUploadFile = async () => {
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
      const mime = mimeFromName(asset.name, asset.mimeType ?? "");
      const docType = detectDocType(asset.name, mime);
      showFolderPicker({
        uri: asset.uri,
        name: asset.name,
        type: docType,
        mimeType: mime,
        size: asset.size ?? 0,
      });
    }
  };

  const handleOpenDoc = async (doc: Document) => {
    if (!doc.uri || doc.uri.startsWith("file://mock/")) {
      Alert.alert(t("cannotOpenTitle"), t("cannotOpenMessage"));
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
        Alert.alert(t("cannotOpenTitle"), t("cannotOpenMessage"));
      }
    } catch {
      Alert.alert(t("cannotOpenTitle"), t("cannotOpenMessage"));
    }
  };

  const handleDeleteDocument = (doc: Document) => {
    setDeleteDocConfirm(doc);
  };

  const confirmDeleteDocument = async () => {
    if (!deleteDocConfirm) return;
    const docId = deleteDocConfirm.id;
    setDeleteDocConfirm(null);
    await services.documents.deleteDocument(docId);
    await loadData();
  };

  const filterOptions: { key: "all" | "pdf" | "image" | "word" | "text"; label: string }[] = [
    { key: "all", label: t("filter.all") },
    { key: "pdf", label: t("filter.pdf") },
    { key: "image", label: t("filter.image") },
    { key: "word", label: t("filter.word") },
    { key: "text", label: t("filter.text") },
  ];

  const folderOptions: { key: string; label: string; icon: string }[] = [
    { key: "all", label: t("folders.all"), icon: "albums-outline" },
    ...DOCUMENT_FOLDER_CATEGORIES.map((cat) => ({
      key: cat,
      label: t("folders." + cat),
      icon: FOLDER_ICONS[cat],
    })),
  ];

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: t("title") }} />
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
          headerTitle: caseData ? `${t("title")} - ${caseData.caseNumber}` : t("title"),
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
        {/* Enhancing Overlay */}
        {enhancing && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 999,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
              <Text style={{ fontSize: 15, color: colors.navy.DEFAULT, marginTop: 12, fontWeight: "600" }}>
                {t("scanning.enhancing")}
              </Text>
            </View>
          </View>
        )}

        {/* Folder Chips — laid out in 2 fixed rows that scroll together horizontally
            (filling left-to-right, top row first, then bottom row) */}
        <View style={{ ...SECTION_CARD, marginTop: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ gap: 8 }}>
              {(() => {
                const perRow = Math.ceil(folderOptions.length / 2);
                return [0, 1].map((rowIdx) => (
                  <View key={rowIdx} style={{ flexDirection: "row", gap: 8 }}>
                    {folderOptions.slice(rowIdx * perRow, (rowIdx + 1) * perRow).map((opt) => {
                      const isActive = selectedFolder === opt.key;
                      return (
                        <Pressable
                          key={opt.key}
                          onPress={() => setSelectedFolder(opt.key)}
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
                          <Ionicons
                            name={opt.icon as IoniconsName}
                            size={16}
                            color={isActive ? "#FFFFFF" : colors.navy.DEFAULT}
                          />
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

        {/* File-type filter chips — single row, scrolls horizontally if not enough room.
            `flexGrow: 0` keeps the ScrollView from stretching vertically inside the
            screen's flex column; chips stay slim. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 0, marginBottom: 12 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }}
        >
          {filterOptions.map((opt) => {
            const isActive = filterType === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setFilterType(opt.key)}
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
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Document List */}
        {filteredDocs.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 32,
            }}
          >
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
              <Text
                style={{
                  fontSize: 15,
                  color: "#AAA",
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                {t("noDocuments")}
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredDocs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => {
              const iconInfo = DOC_TYPE_ICONS[item.type];
              return (
                <Pressable
                  onPress={() => handleOpenDoc(item)}
                  onLongPress={() =>
                    router.push("/(tabs)/cases/documents/preview/" + item.id as any)
                  }
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
                  {/* File Type Icon */}
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
                    <Ionicons
                      name={iconInfo.icon as IoniconsName}
                      size={28}
                      color={iconInfo.color}
                    />
                  </View>

                  {/* Document Info */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.navy.DEFAULT,
                        marginBottom: 2,
                      }}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#999" }}>
                      {formatDate(item.createdAt)} {" \u00B7 "} {t("fileTypes." + item.type)}
                    </Text>
                    {/* Tags and Description */}
                    {(item.tags && item.tags.length > 0) || item.description ? (
                      <View style={{ marginTop: 4 }}>
                        {item.tags && item.tags.length > 0 && (
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: item.description ? 2 : 0 }}>
                            {item.tags.map((tag) => (
                              <View
                                key={tag}
                                style={{
                                  backgroundColor: colors.golden[50],
                                  borderRadius: 8,
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                }}
                              >
                                <Text style={{ fontSize: 10, color: colors.golden.dark, fontWeight: "600" }}>
                                  {tag}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                        {item.description && (
                          <Text style={{ fontSize: 11, color: "#BBB" }} numberOfLines={1}>
                            {item.description}
                          </Text>
                        )}
                      </View>
                    ) : null}
                  </View>

                  {/* File Size */}
                  <Text style={{ fontSize: 12, color: "#BBB", marginLeft: 8 }}>
                    {formatFileSize(item.size)}
                  </Text>

                  {/* Delete Button */}
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteDocument(item);
                    }}
                    hitSlop={8}
                    style={{ marginLeft: 8, padding: 4 }}
                  >
                    <Ionicons
                      name={"trash-outline" as IoniconsName}
                      size={18}
                      color="#E57373"
                    />
                  </Pressable>
                </Pressable>
              );
            }}
          />
        )}

        {/* Speed-dial FAB — Take Photo / Upload File (mirrors the home page FAB). */}
        {fabOpen && (
          <>
            <Pressable
              onPress={() => setFabOpen(false)}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.3)" }}
            />
            {(
              [
                { icon: "camera-outline" as IoniconsName, label: t("capturePhoto"), onPress: handleCapturePhoto },
                { icon: "document-attach-outline" as IoniconsName, label: t("uploadFile"), onPress: handleUploadFile },
                { icon: "library-outline" as IoniconsName, label: t("createFromTemplate"), onPress: handleOpenTemplatePicker },
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

        {/* Template picker — opens from FAB's "From template" action. Picks one
            of the firm-wide templates, copies it into the documents directory,
            and chains into the existing folder-picker → save → editor flow. */}
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
                {t("pickTemplate")}
              </Text>
              {templatesLoading ? (
                <View style={{ paddingVertical: 30, alignItems: "center" }}>
                  <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
                </View>
              ) : templates.length === 0 ? (
                <View style={{ paddingVertical: 30, alignItems: "center" }}>
                  <Ionicons name={"library-outline" as IoniconsName} size={32} color="#DDD" />
                  <Text style={{ marginTop: 8, color: "#999" }}>{t("noTemplates")}</Text>
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
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#999" }}>{t("cancel")}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Folder Selection Modal */}
        <Modal
          visible={folderModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFolderModalVisible(false)}
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
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: colors.navy.DEFAULT,
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                {t("selectFolder")}
              </Text>
              {DOCUMENT_FOLDER_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => handleFolderSelected(cat)}
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
                  <Ionicons
                    name={FOLDER_ICONS[cat] as IoniconsName}
                    size={22}
                    color={colors.navy.DEFAULT}
                  />
                  <Text style={{ fontSize: 15, color: colors.navy.DEFAULT, fontWeight: "500" }}>
                    {t("folders." + cat)}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => {
                  setFolderModalVisible(false);
                  setPendingPhotoAsset(null);
                }}
                style={{
                  marginTop: 12,
                  alignItems: "center",
                  paddingVertical: 14,
                  backgroundColor: "#F5F5F5",
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#999" }}>
                  {t("cancel")}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Image preview modal — mirrors client overview's behavior. */}
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

        {/* Photo-captured confirm dialog — same shell as DeleteConfirmDialog
            but in the app's golden tone, with a secondary "Retake" button. */}
        <ConfirmDialog
          visible={captureConfirm !== null}
          onCancel={() => setCaptureConfirm(null)}
          onConfirm={handleUsePhoto}
          onSecondary={handleRetakePhoto}
          secondaryLabel={t("scanning.retake")}
          title={t("scanning.scanConfirmTitle")}
          body={t("scanning.scanConfirmMessage")}
          confirmLabel={t("scanning.usePhoto")}
          icon={"camera-outline"}
          tone="default"
        />

        <DeleteConfirmDialog
          visible={deleteDocConfirm !== null}
          onCancel={() => setDeleteDocConfirm(null)}
          onConfirm={confirmDeleteDocument}
          title={t("deleteConfirmTitle")}
          body={deleteDocConfirm ? t("deleteConfirmMessage", { name: deleteDocConfirm.name }) : ""}
          confirmLabel={t("deleteDocument")}
        />
      </View>
    </>
  );
}

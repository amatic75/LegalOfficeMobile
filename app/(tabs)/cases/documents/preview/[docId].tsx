import { View, Text, Image, ActivityIndicator, ScrollView, TextInput, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useLocalSearchParams, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useServices } from "../../../../../src/hooks/useServices";
import { colors } from "../../../../../src/theme/tokens";
import type { Document, DocumentVersion } from "../../../../../src/services/types";
import { formatFileSize, DOC_TYPE_ICONS, PREDEFINED_TAGS } from "../../../../../src/services/types";

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

export default function DocumentPreviewScreen() {
  const { docId } = useLocalSearchParams<{ docId: string }>();
  const { t } = useTranslation("documents");
  const services = useServices();

  const [doc, setDoc] = useState<Document | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionText, setDescriptionText] = useState("");
  const [showTagPicker, setShowTagPicker] = useState(false);

  useEffect(() => {
    if (!docId) return;
    Promise.all([
      services.documents.getDocumentById(docId),
      services.documents.getDocumentVersions(docId),
    ]).then(([d, v]) => {
      setDoc(d);
      setVersions(v);
      setDescriptionText(d?.description ?? "");
      setLoading(false);
    });
  }, [docId, services]);

  const handleSaveDescription = async () => {
    if (!doc) return;
    await services.documents.updateDocument(doc.id, { description: descriptionText });
    setDoc({ ...doc, description: descriptionText });
    setEditingDescription(false);
  };

  const handleToggleTag = async (tag: string) => {
    if (!doc) return;
    const currentTags = doc.tags ?? [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    await services.documents.updateDocument(doc.id, { tags: newTags });
    setDoc({ ...doc, tags: newTags });
  };

  if (loading || !doc) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: t("preview") }} />
        <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
        </View>
      </>
    );
  }

  const iconInfo = DOC_TYPE_ICONS[doc.type];
  const isMockUri = doc.uri.startsWith("file:///mock/");

  return (
    <>
      <Stack.Screen options={{ headerTitle: doc.name }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Preview Area */}
        <View style={{ height: 280, alignItems: "center", justifyContent: "center" }}>
          {isMockUri ? (
            <View style={{ alignItems: "center", paddingHorizontal: 32 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  backgroundColor: iconInfo.color + "15",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons
                  name={iconInfo.icon as IoniconsName}
                  size={40}
                  color={iconInfo.color}
                />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.navy.DEFAULT,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                {doc.name}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#999",
                  textAlign: "center",
                }}
              >
                {t("previewNotAvailable")}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#BBB",
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                {t("mockPreview")}
              </Text>
            </View>
          ) : doc.type === "image" && !imageError ? (
            <Image
              source={{ uri: doc.uri }}
              style={{ flex: 1, width: "100%" }}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          ) : doc.type === "image" && imageError ? (
            <View style={{ alignItems: "center", paddingHorizontal: 32 }}>
              <Ionicons name={"image-outline" as IoniconsName} size={48} color="#DDD" />
              <Text style={{ fontSize: 14, color: "#999", marginTop: 8, textAlign: "center" }}>
                {t("previewNotAvailable")}
              </Text>
            </View>
          ) : doc.type === "pdf" ? (
            <View style={{ alignItems: "center", paddingHorizontal: 32 }}>
              <Ionicons name={"document-text-outline" as IoniconsName} size={48} color="#E53935" />
              <Text style={{ fontSize: 14, color: "#999", marginTop: 8, textAlign: "center" }}>
                {t("previewNotAvailable")}
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingHorizontal: 32 }}>
              <Ionicons name={"document-outline" as IoniconsName} size={48} color="#757575" />
              <Text style={{ fontSize: 14, color: "#999", marginTop: 8, textAlign: "center" }}>
                {t("previewNotAvailable")}
              </Text>
            </View>
          )}
        </View>

        {/* File Info */}
        <View
          style={{
            ...SECTION_CARD,
            marginTop: 4,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.navy.DEFAULT,
              marginBottom: 10,
            }}
            numberOfLines={2}
          >
            {doc.name}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name={"folder-outline" as IoniconsName} size={14} color="#999" />
              <Text style={{ fontSize: 13, color: "#999" }}>
                {t("fileTypes." + doc.type)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name={"resize-outline" as IoniconsName} size={14} color="#999" />
              <Text style={{ fontSize: 13, color: "#999" }}>
                {formatFileSize(doc.size)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name={"calendar-outline" as IoniconsName} size={14} color="#999" />
              <Text style={{ fontSize: 13, color: "#999" }}>
                {formatDate(doc.createdAt)}
              </Text>
            </View>
            {doc.version && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name={"git-branch-outline" as IoniconsName} size={14} color="#999" />
                <Text style={{ fontSize: 13, color: "#999" }}>
                  {t("metadata.version")} {doc.version}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Metadata Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"information-circle-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {t("metadata.tags")} & {t("metadata.description")}
            </Text>
          </View>

          {/* Tags */}
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#999", marginBottom: 6 }}>
            {t("metadata.tags")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {(doc.tags ?? []).map((tag) => (
              <View
                key={tag}
                style={{
                  backgroundColor: colors.golden[50],
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.golden.dark, fontWeight: "600" }}>
                  {tag}
                </Text>
                <Pressable onPress={() => handleToggleTag(tag)} hitSlop={4}>
                  <Ionicons name={"close-circle" as IoniconsName} size={14} color={colors.golden.dark} />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={() => setShowTagPicker(!showTagPicker)}
              style={{
                borderWidth: 1,
                borderColor: "#E0E0E0",
                borderStyle: "dashed",
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Ionicons name={"add" as IoniconsName} size={14} color="#999" />
              <Text style={{ fontSize: 12, color: "#999" }}>
                {t("metadata.tags")}
              </Text>
            </Pressable>
          </View>

          {/* Tag Picker */}
          {showTagPicker && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#F0F0F0" }}>
              {PREDEFINED_TAGS.filter((tag) => !(doc.tags ?? []).includes(tag)).map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => {
                    handleToggleTag(tag);
                    setShowTagPicker(false);
                  }}
                  style={{
                    backgroundColor: "#F5F5F5",
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.navy.DEFAULT }}>
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Description */}
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#999", marginBottom: 6 }}>
            {t("metadata.description")}
          </Text>
          {editingDescription ? (
            <View>
              <TextInput
                value={descriptionText}
                onChangeText={setDescriptionText}
                multiline
                style={{
                  borderWidth: 1,
                  borderColor: colors.golden.DEFAULT,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  fontSize: 13,
                  color: colors.navy.DEFAULT,
                  minHeight: 60,
                  textAlignVertical: "top",
                }}
                autoFocus
              />
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <Pressable
                  onPress={() => {
                    setDescriptionText(doc.description ?? "");
                    setEditingDescription(false);
                  }}
                  style={{ paddingHorizontal: 12, paddingVertical: 6 }}
                >
                  <Text style={{ fontSize: 13, color: "#999" }}>{t("cancel")}</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveDescription}
                  style={{
                    backgroundColor: colors.golden.DEFAULT,
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 13, color: "#FFFFFF", fontWeight: "600" }}>
                    {t("filter.all") === "All" ? "Save" : "Sacuvaj"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setEditingDescription(true)}>
              <Text style={{ fontSize: 13, color: doc.description ? colors.navy.DEFAULT : "#BBB" }}>
                {doc.description || (t("filter.all") === "All" ? "Tap to add description" : "Dodirnite za dodavanje opisa")}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Version History Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"git-branch-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {t("metadata.versionHistory")}
            </Text>
          </View>

          {versions.length === 0 ? (
            <Text style={{ fontSize: 13, color: "#BBB", textAlign: "center", paddingVertical: 12 }}>
              {t("metadata.noVersions")}
            </Text>
          ) : (
            <View>
              {versions.map((ver, index) => (
                <View
                  key={ver.id}
                  style={{
                    flexDirection: "row",
                    paddingVertical: 10,
                    borderBottomWidth: index < versions.length - 1 ? 1 : 0,
                    borderBottomColor: "#F5F5F5",
                  }}
                >
                  {/* Timeline dot and line */}
                  <View style={{ width: 24, alignItems: "center", marginRight: 10 }}>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: index === 0 ? colors.golden.DEFAULT : "#DDD",
                        marginTop: 4,
                      }}
                    />
                    {index < versions.length - 1 && (
                      <View
                        style={{
                          width: 2,
                          flex: 1,
                          backgroundColor: "#EEE",
                          marginTop: 2,
                        }}
                      />
                    )}
                  </View>

                  {/* Version info */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT }}>
                        {t("metadata.version")} {ver.version}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#BBB" }}>
                        {formatFileSize(ver.size)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                      {formatDate(ver.createdAt)} {" \u00B7 "} {ver.modifiedBy}
                    </Text>
                    {ver.changes && (
                      <Text style={{ fontSize: 12, color: "#AAA", marginTop: 2, fontStyle: "italic" }}>
                        {ver.changes}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

import { View, Text, Image, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useLocalSearchParams, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useServices } from "../../../../../src/hooks/useServices";
import { colors } from "../../../../../src/theme/tokens";
import type { Document } from "../../../../../src/services/types";
import { formatFileSize, DOC_TYPE_ICONS } from "../../../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

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
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!docId) return;
    services.documents.getDocumentById(docId).then((d) => {
      setDoc(d);
      setLoading(false);
    });
  }, [docId, services]);

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
      <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
        {/* Preview Area */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          {isMockUri ? (
            /* Mock data placeholder */
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
            /* For real PDF URIs, we would use ExpoPDFViewer here */
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

        {/* Metadata Footer */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            paddingHorizontal: 20,
            paddingVertical: 16,
            paddingBottom: 28,
            borderTopWidth: 1,
            borderTopColor: "#F0E8D8",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 3,
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
          </View>
        </View>
      </View>
    </>
  );
}

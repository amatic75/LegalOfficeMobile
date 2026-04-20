import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter, Stack } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useServices } from "../../../../src/hooks/useServices";
import { useReturnBack } from "../../../../src/hooks/useReturnBack";
import { colors } from "../../../../src/theme/tokens";

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
  marginBottom: 12,
  borderWidth: 1,
  borderColor: "#FFF3E0",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
} as const;

type TabType = "client" | "case";

interface ClientBalance {
  clientId: string;
  clientName: string;
  totalOutstanding: number;
  invoiceCount: number;
}

interface CaseBalance {
  caseId: string;
  caseName: string;
  caseNumber: string;
  clientName: string;
  totalOutstanding: number;
  invoiceCount: number;
}

export default function BalancesScreen() {
  const { t } = useTranslation("billing");
  const router = useRouter();
  const { goBack, returnTo } = useReturnBack();
  const services = useServices();
  const [activeTab, setActiveTab] = useState<TabType>("client");
  const [clientBalances, setClientBalances] = useState<ClientBalance[]>([]);
  const [caseBalances, setCaseBalances] = useState<CaseBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([
        services.billing.getOutstandingByClient(),
        services.billing.getOutstandingByCase(),
      ]).then(([byClient, byCase]) => {
        if (active) {
          setClientBalances(byClient);
          setCaseBalances(byCase);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const totalOutstanding =
    activeTab === "client"
      ? clientBalances.reduce((sum, c) => sum + c.totalOutstanding, 0)
      : caseBalances.reduce((sum, c) => sum + c.totalOutstanding, 0);

  const renderClientItem = ({ item }: { item: ClientBalance }) => (
    <Pressable
      onPress={() => router.push({ pathname: "/(tabs)/clients/[id]", params: { id: item.clientId, returnTo: "/(tabs)/more/billing/balances" } })}
      style={SECTION_CARD}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: colors.navy.DEFAULT,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {item.clientName}
        </Text>
        <View
          style={{
            backgroundColor: "#FFF3E0",
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 10,
            marginLeft: 8,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: "#E65100",
            }}
          >
            {item.invoiceCount} {t("balance.invoices")}
          </Text>
        </View>
      </View>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: "#C62828",
        }}
      >
        {formatRSD(item.totalOutstanding)}
      </Text>
    </Pressable>
  );

  const renderCaseItem = ({ item }: { item: CaseBalance }) => (
    <Pressable
      onPress={() => router.push({ pathname: "/(tabs)/cases/[id]", params: { id: item.caseId, returnTo: "/(tabs)/more/billing/balances" } })}
      style={SECTION_CARD}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: colors.navy.DEFAULT,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {item.caseName}
        </Text>
        <View
          style={{
            backgroundColor: "#FFF3E0",
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 10,
            marginLeft: 8,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: "#E65100",
            }}
          >
            {item.invoiceCount} {t("balance.invoices")}
          </Text>
        </View>
      </View>
      <Text
        style={{
          fontSize: 12,
          color: "#8899AA",
          marginBottom: 2,
        }}
      >
        {item.caseNumber}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: "#8899AA",
          marginBottom: 8,
        }}
      >
        {item.clientName}
      </Text>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: "#C62828",
        }}
      >
        {formatRSD(item.totalOutstanding)}
      </Text>
    </Pressable>
  );

  const EmptyState = () => (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 60,
      }}
    >
      <Ionicons name="checkmark-circle-outline" size={56} color="#2E7D32" />
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: "#2E7D32",
          marginTop: 12,
        }}
      >
        {t("balance.noOutstanding")}
      </Text>
    </View>
  );

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
      {/* Summary header */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#FFF3E0",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 13,
            color: "#8899AA",
            marginBottom: 4,
          }}
        >
          {t("balance.outstanding")}
        </Text>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: colors.golden.DEFAULT,
          }}
        >
          {formatRSD(totalOutstanding)}
        </Text>
      </View>

      {/* Tab chips */}
      <View
        style={{
          flexDirection: "row",
          padding: 12,
          paddingBottom: 4,
          gap: 10,
        }}
      >
        <Pressable
          onPress={() => setActiveTab("client")}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 20,
            alignItems: "center",
            backgroundColor:
              activeTab === "client" ? colors.golden.DEFAULT : "#FFFFFF",
            borderWidth: 1,
            borderColor:
              activeTab === "client" ? colors.golden.DEFAULT : "#E0E0E0",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: activeTab === "client" ? "700" : "500",
              color:
                activeTab === "client" ? "#FFFFFF" : colors.navy.DEFAULT,
            }}
          >
            {t("balance.byClient")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("case")}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 20,
            alignItems: "center",
            backgroundColor:
              activeTab === "case" ? colors.golden.DEFAULT : "#FFFFFF",
            borderWidth: 1,
            borderColor:
              activeTab === "case" ? colors.golden.DEFAULT : "#E0E0E0",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: activeTab === "case" ? "700" : "500",
              color:
                activeTab === "case" ? "#FFFFFF" : colors.navy.DEFAULT,
            }}
          >
            {t("balance.byCase")}
          </Text>
        </Pressable>
      </View>

      {/* Balance list */}
      {activeTab === "client" ? (
        <FlatList
          data={clientBalances}
          keyExtractor={(item) => item.clientId}
          renderItem={renderClientItem}
          contentContainerStyle={{ padding: 12, paddingTop: 8 }}
          ListEmptyComponent={EmptyState}
        />
      ) : (
        <FlatList
          data={caseBalances}
          keyExtractor={(item) => item.caseId}
          renderItem={renderCaseItem}
          contentContainerStyle={{ padding: 12, paddingTop: 8 }}
          ListEmptyComponent={EmptyState}
        />
      )}
    </View>
  );
}

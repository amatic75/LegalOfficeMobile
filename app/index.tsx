import { View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";

/**
 * TEMPORARY test screen to validate NativeWind styling.
 * This file will be replaced in Plan 03 when the (tabs) navigation
 * structure takes over routing.
 */
export default function TestScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-cream">
      <StatusBar style="dark" />

      <View className="mb-8 rounded-xl bg-navy p-6">
        <Text className="text-center text-2xl font-bold text-white">
          LegalOffice
        </Text>
        <Text className="mt-2 text-center text-sm text-cream-200">
          Pravna kancelarija
        </Text>
      </View>

      <View className="mb-4 rounded-lg bg-golden px-6 py-3">
        <Text className="text-center font-semibold text-white">
          Golden Button Test
        </Text>
      </View>

      <View className="rounded-lg border border-golden bg-golden-50 px-4 py-2">
        <Text className="text-golden-700">Badge Style Test</Text>
      </View>

      <Text className="mt-8 text-sm text-navy-500">
        Design system colors verified
      </Text>
    </View>
  );
}

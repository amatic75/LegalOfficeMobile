import { View, Text } from "react-native";

type BadgeVariant = "golden" | "navy" | "success" | "warning" | "danger";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantClasses: Record<BadgeVariant, string> = {
  golden: "bg-golden-50",
  navy: "bg-navy-50",
  success: "bg-green-50",
  warning: "bg-amber-50",
  danger: "bg-red-50",
};

const variantTextClasses: Record<BadgeVariant, string> = {
  golden: "text-golden-700",
  navy: "text-navy-500",
  success: "text-green-700",
  warning: "text-amber-700",
  danger: "text-red-700",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2.5 py-0.5",
  md: "px-3 py-1",
};

const sizeTextClasses: Record<BadgeSize, string> = {
  sm: "text-xs",
  md: "text-sm",
};

export function Badge({
  label,
  variant = "golden",
  size = "sm",
}: BadgeProps) {
  return (
    <View
      className={`rounded-full ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      <Text
        className={`font-medium ${variantTextClasses[variant]} ${sizeTextClasses[size]}`}
      >
        {label}
      </Text>
    </View>
  );
}

import { useState } from "react";
import { Pressable, Text } from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-golden",
  secondary: "bg-navy",
  outline: "border border-golden bg-transparent",
};

const variantPressedClasses: Record<ButtonVariant, string> = {
  primary: "bg-golden-dark",
  secondary: "bg-navy-dark",
  outline: "border border-golden-dark bg-transparent",
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-white",
  outline: "text-golden",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5",
  md: "px-4 py-2",
  lg: "px-6 py-3",
};

const sizeTextClasses: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);

  const bgClass = pressed
    ? variantPressedClasses[variant]
    : variantClasses[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className={`items-center justify-center rounded-lg ${sizeClasses[size]} ${bgClass} ${disabled ? "opacity-50" : ""} ${className}`}
    >
      <Text
        className={`font-semibold ${variantTextClasses[variant]} ${sizeTextClasses[size]}`}
      >
        {title}
      </Text>
    </Pressable>
  );
}

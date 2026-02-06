import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { borderRadius, spacing, shadows } from '../../theme/spacing';
import { useAuthStore } from '../../stores/authStore';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDarkMode = useAuthStore((s) => s.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const isGradient = variant === 'gradient' || variant === 'primary';

  const buttonStyles: ViewStyle[] = [
    styles.base,
    size === 'small' && styles.small,
    size === 'large' && styles.large,
    !isGradient && variant === 'secondary' && { backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border },
    !isGradient && variant === 'outline' && { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.primary },
    !isGradient && variant === 'ghost' && { backgroundColor: 'transparent' },
    isGradient && shadows.colored(theme.primary),
    disabled && { opacity: 0.5 },
    style,
  ];

  const labelStyles: TextStyle[] = [
    styles.label,
    isGradient && { color: '#FFFFFF' },
    variant === 'secondary' && { color: theme.text },
    variant === 'outline' && { color: theme.primary },
    variant === 'ghost' && { color: theme.primary },
    size === 'small' && { ...typography.buttonSmall },
    textStyle,
  ];

  const content = loading ? (
    <ActivityIndicator
      color={isGradient ? '#FFFFFF' : theme.primary}
    />
  ) : (
    <Text style={labelStyles}>{title}</Text>
  );

  if (isGradient) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[{ overflow: 'hidden', borderRadius: borderRadius.full }, shadows.colored(theme.primary), disabled && { opacity: 0.5 }, style]}
      >
        <LinearGradient
          colors={[theme.primaryGradientStart, theme.primaryGradientEnd] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.base,
            size === 'small' && styles.small,
            size === 'large' && styles.large,
          ]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  large: {
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  label: {
    ...typography.button,
    color: '#FFFFFF',
  },
});

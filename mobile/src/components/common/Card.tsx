import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing, shadows } from '../../theme/spacing';
import { useAuthStore } from '../../stores/authStore';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'hero';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  const isDarkMode = useAuthStore((s) => s.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: isDarkMode ? 'transparent' : 'rgba(226, 232, 240, 0.5)' },
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && { borderWidth: 1, borderColor: theme.border },
        variant === 'hero' && styles.hero,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
  },
  elevated: {
    ...shadows.md,
  },
  hero: {
    borderRadius: borderRadius.xxl,
    ...shadows.lg,
  },
});

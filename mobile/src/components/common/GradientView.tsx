import React from 'react';
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../stores/authStore';

interface GradientViewProps {
  variant?: 'primary' | 'secondary' | 'accent';
  style?: ViewStyle;
  children?: React.ReactNode;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  customColors?: string[];
}

export function GradientView({
  variant = 'primary',
  style,
  children,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  customColors,
}: GradientViewProps) {
  const isDarkMode = useAuthStore((s) => s.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const gradientColors = customColors || (() => {
    switch (variant) {
      case 'primary':
        return [theme.primaryGradientStart, theme.primaryGradientEnd];
      case 'secondary':
        return [theme.secondaryGradientStart, theme.secondaryGradientEnd];
      case 'accent':
        return [theme.coral, theme.pink];
      default:
        return [theme.primaryGradientStart, theme.primaryGradientEnd];
    }
  })();

  return (
    <LinearGradient
      colors={gradientColors as [string, string, ...string[]]}
      start={start}
      end={end}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}

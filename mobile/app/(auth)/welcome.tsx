import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/stores/authStore';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { setItem } from '../../src/utils/storage';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  features: { icon: keyof typeof Ionicons.glyphMap; text: string }[];
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'wallet',
    iconColor: '#00A86B',
    iconBg: '#D1FAE5',
    title: 'Your Money,\nYour Way',
    subtitle: 'Banking designed for the way you actually live. No minimums, no hidden fees.',
    features: [
      { icon: 'checkmark-circle', text: 'Free checking & savings' },
      { icon: 'checkmark-circle', text: 'No monthly maintenance fees' },
      { icon: 'checkmark-circle', text: 'FDIC insured up to $250K' },
    ],
  },
  {
    id: '2',
    icon: 'flash',
    iconColor: '#F59E0B',
    iconBg: '#FEF3C7',
    title: 'Get ExtraCash\nWhen You Need It',
    subtitle: 'Access up to $250 in fee-free advances. No interest, no credit check.',
    features: [
      { icon: 'checkmark-circle', text: 'Up to $250 cash advances' },
      { icon: 'checkmark-circle', text: 'No interest or credit check' },
      { icon: 'checkmark-circle', text: 'Instant or standard delivery' },
    ],
  },
  {
    id: '3',
    icon: 'bar-chart',
    iconColor: '#3B82F6',
    iconBg: '#DBEAFE',
    title: 'Smart Budgeting\n& Goals',
    subtitle: 'Track spending, set savings goals, and get AI-powered insights to grow your wealth.',
    features: [
      { icon: 'checkmark-circle', text: 'Spending insights & predictions' },
      { icon: 'checkmark-circle', text: 'Automated round-up savings' },
      { icon: 'checkmark-circle', text: 'Savings goals with tracking' },
    ],
  },
  {
    id: '4',
    icon: 'shield-checkmark',
    iconColor: '#8B5CF6',
    iconBg: '#F3E8FF',
    title: 'Bank-Level\nSecurity',
    subtitle: 'Your money is protected with Face ID, PIN lock, and enterprise-grade encryption.',
    features: [
      { icon: 'checkmark-circle', text: 'Face ID & PIN protection' },
      { icon: 'checkmark-circle', text: '256-bit encryption' },
      { icon: 'checkmark-circle', text: 'Real-time fraud alerts' },
    ],
  },
];

export default function WelcomeScreen() {
  const { isDarkMode } = useAuthStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleGetStarted = async () => {
    await setItem('onboarding_complete', 'true');
    router.replace('/(auth)/register');
  };

  const handleSignIn = async () => {
    await setItem('onboarding_complete', 'true');
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[slideStyles.slide, { width }]}>
      <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: item.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
            ...shadows.lg,
          }}
        >
          <Ionicons name={item.icon} size={48} color={item.iconColor} />
        </View>
      </View>

      <Text style={[slideStyles.title, { color: theme.text }]}>
        {item.title}
      </Text>
      <Text style={[slideStyles.subtitle, { color: theme.textSecondary }]}>
        {item.subtitle}
      </Text>

      <View style={slideStyles.featureList}>
        {item.features.map((feature, idx) => (
          <View key={idx} style={slideStyles.featureRow}>
            <Ionicons name={feature.icon} size={20} color={theme.primary} />
            <Text style={[slideStyles.featureText, { color: theme.text }]}>
              {feature.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={[theme.background, isDarkMode ? '#0A1F0A' : '#F5F7F5']}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Skip button */}
        <View style={slideStyles.topBar}>
          <View style={{ width: 60 }} />
          <View style={slideStyles.logoRow}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: theme.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>C</Text>
            </View>
            <Text style={[slideStyles.logoText, { color: theme.text }]}>Cayden</Text>
          </View>
          <TouchableOpacity onPress={handleSignIn}>
            <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 15 }}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          style={{ flex: 1 }}
        />

        {/* Bottom section */}
        <View style={slideStyles.bottomSection}>
          {/* Pagination dots */}
          <View style={slideStyles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  slideStyles.dot,
                  {
                    backgroundColor: index === currentIndex ? theme.primary : theme.border,
                    width: index === currentIndex ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* Buttons */}
          {currentIndex === slides.length - 1 ? (
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
              <TouchableOpacity activeOpacity={0.8} onPress={handleGetStarted}>
                <LinearGradient
                  colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={slideStyles.primaryButton}
                >
                  <Text style={slideStyles.primaryButtonText}>Create Free Account</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[slideStyles.secondaryButton, { borderColor: theme.border }]}
                onPress={handleSignIn}
              >
                <Text style={[slideStyles.secondaryButtonText, { color: theme.text }]}>
                  Already have an account? Sign In
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
              <TouchableOpacity activeOpacity={0.8} onPress={handleNext}>
                <LinearGradient
                  colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={slideStyles.primaryButton}
                >
                  <Text style={slideStyles.primaryButtonText}>Next</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[slideStyles.secondaryButton, { borderColor: theme.border }]}
                onPress={handleGetStarted}
              >
                <Text style={[slideStyles.secondaryButtonText, { color: theme.text }]}>
                  Skip to Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: spacing.md }} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const slideStyles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoText: {
    ...typography.h4,
  },
  slide: {
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 42,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  featureList: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureText: {
    ...typography.body,
    fontWeight: '500',
  },
  bottomSection: {
    paddingBottom: spacing.md,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 18,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { CaydenLogo } from '../../src/components/common/CaydenLogo';
import { useAuthStore } from '../../src/stores/authStore';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isDarkMode } = useAuthStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert(
        'Login Failed',
        err.response?.data?.message || 'Invalid email or password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Decorative gradient blob at top */}
      <LinearGradient
        colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.decorativeBlob}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoSection}>
          <CaydenLogo size={120} />
          <Text style={[styles.appName, { color: theme.text }]}>
            Cayden Bank
          </Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            Your money, your way
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon="lock-closed-outline"
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="large"
          />

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
            <View
              style={[
                styles.dividerPill,
                { backgroundColor: theme.surfaceSecondary },
              ]}
            >
              <Text style={[styles.dividerText, { color: theme.textTertiary }]}>
                or
              </Text>
            </View>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            style={styles.registerLink}
          >
            <Text style={[styles.registerText, { color: theme.textSecondary }]}>
              Don't have an account?{' '}
              <Text style={{ color: theme.primary, fontWeight: '600' }}>
                Sign Up
              </Text>
            </Text>
          </TouchableOpacity>

          {__DEV__ && (
            <View
              style={[
                styles.demoSection,
                {
                  backgroundColor: theme.surfaceSecondary,
                },
              ]}
            >
              <View style={styles.demoHeader}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={theme.textTertiary}
                />
                <Text style={[styles.demoLabel, { color: theme.textTertiary }]}>
                  Demo credentials
                </Text>
              </View>
              <Text style={[styles.demoText, { color: theme.textSecondary }]}>
                cayden@example.com / Password123!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorativeBlob: {
    position: 'absolute',
    top: -80,
    left: -40,
    right: -40,
    height: 300,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    opacity: 0.08,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  appName: {
    ...typography.h1,
  },
  tagline: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  form: {
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerPill: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  dividerText: {
    ...typography.caption,
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  registerText: {
    ...typography.body,
  },
  demoSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  demoLabel: {
    ...typography.small,
  },
  demoText: {
    ...typography.caption,
  },
});

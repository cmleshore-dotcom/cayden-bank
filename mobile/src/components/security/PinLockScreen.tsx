import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePinStore } from '../../stores/pinStore';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PinLockScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shakeAnim] = useState(new Animated.Value(0));
  const { verifyPin, isPinLocked, cooldownUntil } = usePinStore();
  const { isDarkMode, logout } = useAuthStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownSeconds(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handlePress = useCallback(
    async (digit: string) => {
      if (cooldownSeconds > 0) return;

      if (digit === 'delete') {
        setPin((prev) => prev.slice(0, -1));
        setError('');
        return;
      }

      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === 4) {
        const success = await verifyPin(newPin);
        if (!success) {
          shake();
          setError('Incorrect PIN');
          setPin('');
        }
      }
    },
    [pin, cooldownSeconds, verifyPin, shake]
  );

  if (!isPinLocked) return null;

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Lock Icon */}
        <View style={[styles.lockIcon, { backgroundColor: theme.primary + '15' }]}>
          <Ionicons name="lock-closed" size={40} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Enter PIN</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Enter your 4-digit PIN to unlock
        </Text>

        {/* PIN Dots */}
        <Animated.View
          style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i < pin.length ? theme.primary : 'transparent',
                  borderColor: i < pin.length ? theme.primary : theme.border,
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Error / Cooldown */}
        {cooldownSeconds > 0 ? (
          <Text style={styles.errorText}>
            Too many attempts. Try again in {cooldownSeconds}s
          </Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View style={{ height: 20 }} />
        )}

        {/* Number Pad */}
        <View style={styles.numpad}>
          {digits.map((digit, index) => {
            if (digit === '') {
              return <View key={index} style={styles.numpadButton} />;
            }
            if (digit === 'delete') {
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.numpadButton}
                  onPress={() => handlePress('delete')}
                  disabled={cooldownSeconds > 0}
                >
                  <Ionicons
                    name="backspace-outline"
                    size={28}
                    color={theme.text}
                  />
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.numpadButton,
                  { backgroundColor: theme.surfaceSecondary },
                ]}
                onPress={() => handlePress(digit)}
                disabled={cooldownSeconds > 0}
                activeOpacity={0.6}
              >
                <Text style={[styles.numpadText, { color: theme.text }]}>
                  {digit}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout option */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            logout();
          }}
        >
          <Text style={[styles.logoutText, { color: theme.error }]}>
            Log Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: SCREEN_WIDTH,
    paddingHorizontal: spacing.xl,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: spacing.md,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    height: 20,
    marginBottom: spacing.sm,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    justifyContent: 'center',
    gap: 16,
    marginTop: spacing.md,
  },
  numpadButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadText: {
    fontSize: 28,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePinStore } from '../../stores/pinStore';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type Step = 'enter' | 'confirm' | 'password';

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

export function PinSetupScreen({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState<Step>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shakeAnim] = useState(new Animated.Value(0));
  const { setPin: savePinToServer, isLoading } = usePinStore();
  const { isDarkMode } = useAuthStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const currentPin = step === 'enter' ? pin : step === 'confirm' ? confirmPin : password;
  const maxLength = step === 'password' ? 50 : 4;

  const handlePress = useCallback(
    async (digit: string) => {
      if (isLoading) return;

      if (digit === 'delete') {
        if (step === 'enter') setPin((p) => p.slice(0, -1));
        else if (step === 'confirm') setConfirmPin((p) => p.slice(0, -1));
        else setPassword((p) => p.slice(0, -1));
        setError('');
        return;
      }

      if (step === 'enter') {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 4) {
          setTimeout(() => setStep('confirm'), 200);
        }
      } else if (step === 'confirm') {
        const newConfirm = confirmPin + digit;
        setConfirmPin(newConfirm);
        if (newConfirm.length === 4) {
          if (newConfirm !== pin) {
            shake();
            setError('PINs do not match');
            setConfirmPin('');
          } else {
            setTimeout(() => setStep('password'), 200);
          }
        }
      } else if (step === 'password') {
        setPassword((p) => p + digit);
      }
    },
    [pin, confirmPin, password, step, isLoading, shake]
  );

  const handleSubmitPassword = async () => {
    if (!password) {
      setError('Enter your password to confirm');
      return;
    }
    try {
      await savePinToServer(pin, password);
      Alert.alert('Success', 'Your PIN has been set!');
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid password');
      setPassword('');
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'enter':
        return 'Create PIN';
      case 'confirm':
        return 'Confirm PIN';
      case 'password':
        return 'Verify Password';
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 'enter':
        return 'Choose a 4-digit PIN';
      case 'confirm':
        return 'Re-enter your PIN to confirm';
      case 'password':
        return 'Enter your account password to save';
    }
  };

  const displayPin = step === 'password' ? password : step === 'enter' ? pin : confirmPin;
  const displayLength = step === 'password' ? Math.min(password.length, 12) : (step === 'enter' ? pin : confirmPin).length;

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.lockIcon, { backgroundColor: theme.primary + '15' }]}>
          <Ionicons
            name={step === 'password' ? 'key' : 'keypad'}
            size={36}
            color={theme.primary}
          />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{getTitle()}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {getSubtitle()}
        </Text>

        {/* PIN Dots or Password Dots */}
        {step !== 'password' ? (
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
                      i < displayLength ? theme.primary : 'transparent',
                    borderColor: i < displayLength ? theme.primary : theme.border,
                  },
                ]}
              />
            ))}
          </Animated.View>
        ) : (
          <Animated.View style={[styles.passwordDots, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={[styles.passwordDisplay, { color: theme.text }]}>
              {'•'.repeat(password.length)}
              {password.length === 0 && (
                <Text style={{ color: theme.textTertiary }}>Enter password</Text>
              )}
            </Text>
          </Animated.View>
        )}

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View style={{ height: 20 }} />
        )}

        {/* Number Pad (for PIN steps) or Submit (for password step) */}
        {step !== 'password' ? (
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
                  >
                    <Ionicons name="backspace-outline" size={28} color={theme.text} />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.numpadButton, { backgroundColor: theme.surfaceSecondary }]}
                  onPress={() => handlePress(digit)}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.numpadText, { color: theme.text }]}>{digit}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.passwordSection}>
            {/* Simple password input using number pad for basic chars + submit */}
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
                    >
                      <Ionicons name="backspace-outline" size={28} color={theme.text} />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.numpadButton, { backgroundColor: theme.surfaceSecondary }]}
                    onPress={() => handlePress(digit)}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.numpadText, { color: theme.text }]}>{digit}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleSubmitPassword}
              disabled={isLoading}
            >
              <Text style={styles.submitText}>
                {isLoading ? 'Saving...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step indicator */}
        <View style={styles.steps}>
          {['enter', 'confirm', 'password'].map((s, i) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    s === step
                      ? theme.primary
                      : ['enter', 'confirm', 'password'].indexOf(step) > i
                        ? theme.primary + '60'
                        : theme.border,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
  },
  cancelButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: -60,
  },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    textAlign: 'center',
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
  passwordDots: {
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  passwordDisplay: {
    fontSize: 24,
    letterSpacing: 4,
    textAlign: 'center',
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
  passwordSection: {
    alignItems: 'center',
  },
  submitButton: {
    marginTop: spacing.lg,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  steps: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xl,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

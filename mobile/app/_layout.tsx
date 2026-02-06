import React, { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/stores/authStore';
import { usePinStore } from '../src/stores/pinStore';
import { colors } from '../src/theme/colors';
import { LoadingSpinner } from '../src/components/common/LoadingSpinner';
import { PinLockScreen } from '../src/components/security/PinLockScreen';

export default function RootLayout() {
  const { isLoading, loadUser, isDarkMode, isAuthenticated, resetActivity, checkSessionTimeout } =
    useAuthStore();
  const { isPinLocked, hasPin, lockApp, checkPinStatus } = usePinStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const appState = useRef(AppState.currentState);

  // Load user and PIN status on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Check PIN status once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      checkPinStatus();
    }
  }, [isAuthenticated]);

  // AppState listener: lock on background, check timeout on foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/active/) &&
          nextAppState.match(/inactive|background/)
        ) {
          // App going to background — lock if PIN is set
          if (hasPin && isAuthenticated) {
            lockApp();
          }
        }

        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // App coming to foreground — check session timeout
          if (isAuthenticated) {
            const timedOut = checkSessionTimeout();
            if (!timedOut && hasPin) {
              lockApp();
            }
          }
        }

        appState.current = nextAppState;
      }
    );

    return () => subscription.remove();
  }, [hasPin, isAuthenticated]);

  // Session timeout check every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      checkSessionTimeout();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Track user activity via touch events
  const handleTouchStart = useCallback(() => {
    if (isAuthenticated) {
      resetActivity();
    }
  }, [isAuthenticated, resetActivity]);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading Cayden Bank..." />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={{ flex: 1 }}
        onTouchStart={handleTouchStart}
      >
        <StatusBar style={theme.statusBar} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}
        />
        {/* PIN Lock overlay */}
        {isPinLocked && isAuthenticated && <PinLockScreen />}
      </View>
    </GestureHandlerRootView>
  );
}

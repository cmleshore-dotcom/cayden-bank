import { useState, useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { getItem } from '../src/utils/storage';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const value = await getItem('onboarding_complete');
      setOnboardingComplete(value === 'true');
    })();
  }, []);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  // Wait until we know onboarding status
  if (onboardingComplete === null) {
    return null;
  }

  if (!onboardingComplete) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return <Redirect href="/(auth)/login" />;
}

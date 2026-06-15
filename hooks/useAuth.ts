import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isInitialized, isAuthenticated]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
  };
}

import { useEffect, useCallback, useRef } from 'react';
import { getSocket, disconnectSocket, onOrderUpdate, onDeliveryLocationUpdate, onDeliveryAssigned } from '@/lib/socket';
import { useAuthStore } from '@/stores';

export function useSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const socketRef = useRef<ReturnType<typeof getSocket> extends Promise<infer T> ? T : never>();

  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;

    (async () => {
      const socket = await getSocket();
      if (mounted) {
        socketRef.current = socket;
      }
    })();

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, [isAuthenticated]);

  const subscribeOrderUpdates = useCallback(
    (callback: (data: Record<string, unknown>) => void) => {
      return onOrderUpdate(callback);
    },
    []
  );

  const subscribeDeliveryTracking = useCallback(
    (callback: (data: Record<string, unknown>) => void) => {
      return onDeliveryLocationUpdate(callback);
    },
    []
  );

  const subscribeDeliveryAssigned = useCallback(
    (callback: (data: Record<string, unknown>) => void) => {
      return onDeliveryAssigned(callback);
    },
    []
  );

  return {
    subscribeOrderUpdates,
    subscribeDeliveryTracking,
    subscribeDeliveryAssigned,
  };
}

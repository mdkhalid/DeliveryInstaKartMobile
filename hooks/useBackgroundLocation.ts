import { useEffect, useCallback, useState } from 'react';
import {
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
  isBackgroundLocationTrackingActive,
} from '@/lib/backgroundLocation';
import { useAgentStore } from '@/stores';

export function useBackgroundLocation() {
  const isOnline = useAgentStore((s) => s.isOnline);
  const [isActive, setIsActive] = useState(false);

  // ─── Start tracking ───
  const startTracking = useCallback(async () => {
    const started = await startBackgroundLocationTracking();
    setIsActive(started);
  }, []);

  // ─── Stop tracking ───
  const stopTracking = useCallback(async () => {
    await stopBackgroundLocationTracking();
    setIsActive(false);
  }, []);

  // ─── Auto-start/stop based on online state ───
  useEffect(() => {
    if (isOnline) {
      startTracking();
    } else {
      stopTracking();
    }
  }, [isOnline, startTracking, stopTracking]);

  // ─── Cleanup on unmount ───
  useEffect(() => {
    return () => {
      stopBackgroundLocationTracking();
      setIsActive(false);
    };
  }, []);

  // ─── Check status on mount ───
  useEffect(() => {
    (async () => {
      const active = await isBackgroundLocationTrackingActive();
      setIsActive(active);
    })();
  }, []);

  return {
    startTracking,
    stopTracking,
    isActive,
  };
}

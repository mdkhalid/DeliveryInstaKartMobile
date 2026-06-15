import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { deliveryAPI } from './api';

// ─── Task name ───
export const BACKGROUND_LOCATION_TASK = 'background-location-delivery';

// ─── Last sent location (to avoid duplicate API calls) ───
let lastSentAt = 0;
const MIN_SEND_INTERVAL_MS = 10_000; // 10 seconds minimum between sends

// ─── Define the background task (must be at module top-level scope) ───
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundLocation] Error:', error.message);
    return;
  }

  if (!data) return;

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations || locations.length === 0) return;

  const location = locations[locations.length - 1];
  const { latitude, longitude } = location.coords;

  const now = Date.now();
  if (now - lastSentAt < MIN_SEND_INTERVAL_MS) return;
  lastSentAt = now;

  try {
    // Send via API (socket not reliable in background — OS may kill connection)
    await deliveryAPI.updateLocation(latitude, longitude);
  } catch (err) {
    console.error('[BackgroundLocation] Failed to send location:', err);
  }
});

// ─── Start background location tracking ───
export async function startBackgroundLocationTracking(): Promise<boolean> {
  try {
    // Request "Always" permission
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.warn('[BackgroundLocation] Foreground permission denied');
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn('[BackgroundLocation] Background permission denied');
      return false;
    }

    // Check if task is already running
    const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (isRunning) {
      console.log('[BackgroundLocation] Already running');
      return true;
    }

    // Start background updates
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 15_000, // 15 seconds
      distanceInterval: 50, // 50 meters
      deferredUpdatesInterval: 15_000,
      showsBackgroundLocationIndicator: true, // iOS blue indicator
      foregroundService: {
        notificationTitle: 'InstaKart Delivery',
        notificationBody: 'Tracking your location for deliveries',
        notificationColor: '#FF6B35',
      },
    });

    console.log('[BackgroundLocation] Started successfully');
    return true;
  } catch (err) {
    console.error('[BackgroundLocation] Failed to start:', err);
    return false;
  }
}

// ─── Stop background location tracking ───
export async function stopBackgroundLocationTracking(): Promise<void> {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('[BackgroundLocation] Stopped');
    }
  } catch (err) {
    console.error('[BackgroundLocation] Failed to stop:', err);
  }
}

// ─── Check if tracking is active ───
export async function isBackgroundLocationTrackingActive(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  } catch {
    return false;
  }
}

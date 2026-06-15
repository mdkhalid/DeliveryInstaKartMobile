import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
  permissionGranted: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    address: null,
    isLoading: true,
    error: null,
    permissionGranted: false,
  });

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Location permission denied',
        permissionGranted: false,
      }));
      return false;
    }
    setState((prev) => ({ ...prev, permissionGranted: true }));
    return true;
  };

  const getCurrentLocation = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocode
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const address = geo ? `${geo.street || ''}, ${geo.city || ''}, ${geo.region || ''}`.trim() : null;

      setState({
        latitude,
        longitude,
        address,
        isLoading: false,
        error: null,
        permissionGranted: true,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to get location',
      }));
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return {
    ...state,
    refresh: getCurrentLocation,
  };
}

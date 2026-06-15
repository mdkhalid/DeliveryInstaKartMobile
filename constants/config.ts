import Constants from 'expo-constants';

const ENV = {
  API_BASE_URL: Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:4000/api/v1',
  SOCKET_URL: Constants.expoConfig?.extra?.socketUrl || 'http://localhost:4000',
  APP_NAME: 'InstaKart Delivery',
  CURRENCY: '₹',
} as const;

export default ENV;

export const Colors = {
  primary: '#FF6B35',
  primaryDark: '#E55A2B',
  primaryLight: '#FF8F66',
  secondary: '#004E89',
  accent: '#FCBF49',

  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceAlt: '#F0F1F3',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  rating: '#FBBF24',

  skeleton: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',

  shadow: 'rgba(0, 0, 0, 0.08)',
} as const;

export type ColorKey = keyof typeof Colors;

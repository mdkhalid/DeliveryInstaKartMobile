import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface BadgeProps {
  text: string;
  color?: string;
  backgroundColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({
  text,
  color = Colors.textInverse,
  backgroundColor = Colors.primary,
  size = 'sm',
  style,
}: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`size_${size}`], { backgroundColor }, style]}>
      <Text style={[styles.text, styles[`text_${size}`], { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Layout.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  size_sm: { paddingHorizontal: Layout.spacing.sm, paddingVertical: 2 },
  size_md: { paddingHorizontal: Layout.spacing.md, paddingVertical: Layout.spacing.xs },
  text: { fontWeight: '600' },
  text_sm: { fontSize: Layout.font.xs },
  text_md: { fontSize: Layout.font.sm },
});

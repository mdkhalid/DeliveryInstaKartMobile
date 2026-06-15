import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores';
import { Input, Button } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

export default function OtpLoginScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp, isLoading, error, clearError } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = async () => {
    if (!phone) return;
    try {
      await sendOtp(phone);
      setOtpSent(true);
    } catch { /* error handled by store */ }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    try {
      await verifyOtp(phone, otp);
      router.replace('/(main)');
    } catch { /* error handled by store */ }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>{otpSent ? 'Enter OTP' : 'OTP Login'}</Text>
          <Text style={styles.subtitle}>
            {otpSent ? `Code sent to ${phone}` : 'Enter your phone number to receive a verification code'}
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!otpSent ? (
          <View style={styles.form}>
            <Input
              label="Phone Number"
              placeholder="Enter phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={20} color={Colors.textTertiary} />}
            />
            <Button title="Send OTP" onPress={handleSendOtp} loading={isLoading} />
          </View>
        ) : (
          <View style={styles.form}>
            <Input
              label="Verification Code"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              leftIcon={<Ionicons name="keypad-outline" size={20} color={Colors.textTertiary} />}
            />
            <Button title="Verify & Login" onPress={handleVerifyOtp} loading={isLoading} />
            <TouchableOpacity onPress={handleSendOtp} style={styles.resendButton}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: Layout.padding.xl },
  backButton: { marginTop: Layout.spacing.xl, marginBottom: Layout.spacing.lg },
  header: { marginBottom: Layout.spacing.xl },
  title: { fontSize: Layout.font.xxl, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: Layout.font.md, color: Colors.textSecondary, marginTop: Layout.spacing.xs },
  errorContainer: {
    backgroundColor: Colors.errorLight, borderRadius: Layout.radius.md,
    padding: Layout.spacing.md, marginBottom: Layout.spacing.md,
  },
  errorText: { fontSize: Layout.font.sm, color: Colors.error },
  form: { gap: Layout.spacing.md },
  resendButton: { alignItems: 'center', marginTop: Layout.spacing.lg },
  resendText: { fontSize: Layout.font.md, color: Colors.primary, fontWeight: '600' },
});

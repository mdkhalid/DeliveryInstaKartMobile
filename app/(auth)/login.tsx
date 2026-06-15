import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores';
import { Input, Button } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      await login(email, password);
      router.replace('/(main)');
    } catch { /* error handled by store */ }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="cart" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue shopping</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons name="close" size={18} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.textTertiary} />}
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} />}
          />

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button title="Sign In" onPress={handleLogin} loading={isLoading} />

          <TouchableOpacity onPress={() => router.push('/(auth)/otp-login')} style={styles.otpButton}>
            <Text style={styles.otpText}>Login with OTP</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.signupText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Layout.padding.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: Layout.spacing.xxxl },
  logoContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center', justifyContent: 'center', marginBottom: Layout.spacing.lg,
  },
  title: { fontSize: Layout.font.xxl, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: Layout.font.md, color: Colors.textSecondary, marginTop: Layout.spacing.xs },
  errorContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.errorLight,
    borderRadius: Layout.radius.md, padding: Layout.spacing.md, marginBottom: Layout.spacing.md,
  },
  errorText: { flex: 1, fontSize: Layout.font.sm, color: Colors.error, marginLeft: Layout.spacing.sm },
  form: { marginBottom: Layout.spacing.xl },
  forgotButton: { alignSelf: 'flex-end', marginBottom: Layout.spacing.lg },
  forgotText: { fontSize: Layout.font.sm, color: Colors.primary, fontWeight: '500' },
  otpButton: { alignItems: 'center', marginTop: Layout.spacing.lg },
  otpText: { fontSize: Layout.font.md, color: Colors.primary, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Layout.spacing.xl },
  footerText: { fontSize: Layout.font.md, color: Colors.textSecondary },
  signupText: { fontSize: Layout.font.md, color: Colors.primary, fontWeight: '700' },
});

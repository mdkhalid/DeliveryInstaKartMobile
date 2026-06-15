import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useAgentStore } from '@/stores';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { profile, stats } = useAgentStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const menuItems = [
    { icon: 'person-outline' as const, label: 'Edit Profile', onPress: () => {} },
    { icon: 'key-outline' as const, label: 'Change Password', onPress: () => {} },
    { icon: 'car-outline' as const, label: 'Vehicle Details', onPress: () => {} },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', onPress: () => {} },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={Colors.textInverse} />
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email || user?.phone}</Text>
        {profile && (
          <View style={styles.badge}>
            <Ionicons name="star" size={14} color={Colors.rating} />
            <Text style={styles.badgeText}>{profile.rating.toFixed(1)} Rating</Text>
            <Text style={styles.badgeSeparator}>•</Text>
            <Text style={styles.badgeText}>{profile.vehicleType}</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.totalDeliveries || 0}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(stats?.totalEarnings || 0)}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.rating?.toFixed(1) || '5.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </Card>

      {/* Vehicle Info */}
      {profile && (
        <Card style={styles.vehicleCard}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.vehicleRow}>
            <Ionicons name={profile.vehicleType === 'BIKE' ? 'bicycle' : profile.vehicleType === 'CAR' ? 'car' : 'walk'} size={20} color={Colors.primary} />
            <Text style={styles.vehicleText}>{profile.vehicleType}</Text>
          </View>
          {profile.vehicleNumber && (
            <View style={styles.vehicleRow}>
              <Ionicons name="card-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.vehicleText}>{profile.vehicleNumber}</Text>
            </View>
          )}
          <View style={styles.vehicleRow}>
            <Ionicons name="briefcase-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.vehicleText}>{profile.type === 'FULL_TIME' ? 'Full Time' : 'Part Time'}</Text>
          </View>
        </Card>
      )}

      {/* Menu Items */}
      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
            <Ionicons name={item.icon} size={24} color={Colors.textSecondary} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color={Colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    alignItems: 'center', paddingVertical: Layout.spacing.xxxl,
    backgroundColor: Colors.background,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: Layout.spacing.md,
  },
  name: { fontSize: Layout.font.xl, fontWeight: '700', color: Colors.text },
  email: { fontSize: Layout.font.sm, color: Colors.textSecondary, marginTop: Layout.spacing.xs },
  badge: {
    flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacing.sm,
    backgroundColor: Colors.surfaceAlt, paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs, borderRadius: Layout.radius.full,
  },
  badgeText: { fontSize: Layout.font.xs, fontWeight: '500', color: Colors.text, marginLeft: 4 },
  badgeSeparator: { marginHorizontal: Layout.spacing.xs, color: Colors.textTertiary },

  statsCard: { marginHorizontal: Layout.padding.md, marginBottom: Layout.spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Layout.spacing.md },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: Layout.font.lg, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: Layout.font.xs, color: Colors.textTertiary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },

  vehicleCard: { marginHorizontal: Layout.padding.md, marginBottom: Layout.spacing.md },
  sectionTitle: { fontSize: Layout.font.md, fontWeight: '600', color: Colors.text, marginBottom: Layout.spacing.md },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Layout.spacing.sm },
  vehicleText: { fontSize: Layout.font.md, color: Colors.text, marginLeft: Layout.spacing.md },

  menu: { marginTop: Layout.spacing.md, backgroundColor: Colors.background, marginHorizontal: Layout.padding.md, borderRadius: Layout.radius.lg },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: Layout.spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  menuLabel: { flex: 1, fontSize: Layout.font.md, color: Colors.text, marginLeft: Layout.spacing.md },

  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: Layout.spacing.xl, paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.errorLight, marginHorizontal: Layout.padding.md,
    borderRadius: Layout.radius.lg,
  },
  logoutText: { fontSize: Layout.font.md, color: Colors.error, fontWeight: '600', marginLeft: Layout.spacing.sm },
});

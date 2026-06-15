import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useAgentStore } from '@/stores';
import { useBackgroundLocation } from '@/hooks/useBackgroundLocation';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Card, Badge } from '@/components/ui';
import { formatCurrency, formatDate, getAssignmentStatusLabel, getAssignmentStatusColor } from '@/lib/utils';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile, stats, isOnline, activeAssignment, fetchProfile, fetchStats, fetchAssignments, toggleOnline, isLoading } = useAgentStore();
  const { startTracking, stopTracking } = useBackgroundLocation();
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    await Promise.all([fetchProfile(), fetchStats(), fetchAssignments()]);
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleOnline = async () => {
    try { await toggleOnline(); } catch { /* handled */ }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.scroll}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {user?.firstName || 'Agent'}! 👋</Text>
          <Text style={styles.subtitle}>Ready to deliver?</Text>
        </View>
        <TouchableOpacity
          style={[styles.onlineToggle, isOnline && styles.onlineToggleActive]}
          onPress={handleToggleOnline}
          disabled={isLoading}
        >
          <View style={[styles.onlineDot, isOnline && styles.onlineDotActive]} />
          <Text style={[styles.onlineText, isOnline && styles.onlineTextActive]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Ionicons name="bicycle" size={24} color={Colors.primary} />
          <Text style={styles.statValue}>{stats?.todayAssigned || 0}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          <Text style={styles.statValue}>{stats?.todayCompleted || 0}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="star" size={24} color={Colors.rating} />
          <Text style={styles.statValue}>{profile?.rating?.toFixed(1) || '5.0'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="wallet" size={24} color={Colors.primary} />
          <Text style={styles.statValue}>{formatCurrency(stats?.todayEarnings || 0)}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </Card>
      </View>

      {/* Active Delivery */}
      {activeAssignment && (
        <TouchableOpacity
          style={styles.activeCard}
          onPress={() => router.push(`/tracking/${activeAssignment.orderId}`)}
          activeOpacity={0.8}
        >
          <View style={styles.activeHeader}>
            <Text style={styles.activeTitle}>Active Delivery</Text>
            <Badge
              text={getAssignmentStatusLabel(activeAssignment.status)}
              backgroundColor={getAssignmentStatusColor(activeAssignment.status)}
              size="sm"
            />
          </View>
          <Text style={styles.activeOrderNumber}>#{activeAssignment.order?.orderNumber || 'N/A'}</Text>
          <View style={styles.activeDetails}>
            <View style={styles.activeDetailRow}>
              <Ionicons name="location" size={16} color={Colors.success} />
              <Text style={styles.activeDetailText} numberOfLines={1}>
                {activeAssignment.order?.store?.name || 'Pickup'}
              </Text>
            </View>
            <Ionicons name="arrow-down" size={14} color={Colors.textTertiary} style={{ marginLeft: 8 }} />
            <View style={styles.activeDetailRow}>
              <Ionicons name="location" size={16} color={Colors.error} />
              <Text style={styles.activeDetailText} numberOfLines={1}>
                {activeAssignment.order?.address?.street || 'Drop-off'}
              </Text>
            </View>
          </View>
          <View style={styles.activeFooter}>
            <Text style={styles.activeDistance}>
              {activeAssignment.distanceKm ? `${activeAssignment.distanceKm.toFixed(1)} km` : 'Calculating...'}
            </Text>
            <Text style={styles.activeTap}>Tap to view →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <Card style={styles.weekCard}>
          <View style={styles.weekRow}>
            <Text style={styles.weekLabel}>Total Deliveries</Text>
            <Text style={styles.weekValue}>{stats?.totalDeliveries || 0}</Text>
          </View>
          <View style={styles.weekRow}>
            <Text style={styles.weekLabel}>Total Earnings</Text>
            <Text style={styles.weekValue}>{formatCurrency(stats?.totalEarnings || 0)}</Text>
          </View>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(main)/deliveries')}>
            <View style={[styles.actionIcon, { backgroundColor: Colors.infoLight }]}>
              <Ionicons name="list" size={24} color={Colors.info} />
            </View>
            <Text style={styles.actionLabel}>Deliveries</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(main)/earnings')}>
            <View style={[styles.actionIcon, { backgroundColor: Colors.successLight }]}>
              <Ionicons name="wallet" size={24} color={Colors.success} />
            </View>
            <Text style={styles.actionLabel}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(main)/profile')}>
            <View style={[styles.actionIcon, { backgroundColor: Colors.warningLight }]}>
              <Ionicons name="person" size={24} color={Colors.warning} />
            </View>
            <Text style={styles.actionLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: Layout.padding.md },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Layout.spacing.xl, paddingTop: Layout.spacing.lg,
  },
  greeting: { fontSize: Layout.font.xxl, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: Layout.font.md, color: Colors.textSecondary, marginTop: 2 },
  onlineToggle: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Layout.spacing.md, paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  onlineToggleActive: { backgroundColor: Colors.successLight, borderColor: Colors.success },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.textTertiary, marginRight: Layout.spacing.xs },
  onlineDotActive: { backgroundColor: Colors.success },
  onlineText: { fontSize: Layout.font.sm, fontWeight: '600', color: Colors.textSecondary },
  onlineTextActive: { color: Colors.success },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: Layout.spacing.xl },
  statCard: { width: '48%', padding: Layout.spacing.md, marginBottom: Layout.spacing.sm, alignItems: 'center' },
  statValue: { fontSize: Layout.font.xl, fontWeight: '700', color: Colors.text, marginTop: Layout.spacing.sm },
  statLabel: { fontSize: Layout.font.xs, color: Colors.textTertiary, marginTop: 2 },

  activeCard: {
    backgroundColor: Colors.primary, borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg, marginBottom: Layout.spacing.xl,
  },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Layout.spacing.sm },
  activeTitle: { fontSize: Layout.font.lg, fontWeight: '700', color: Colors.textInverse },
  activeOrderNumber: { fontSize: Layout.font.md, color: Colors.textInverse, opacity: 0.8, marginBottom: Layout.spacing.md },
  activeDetails: { marginBottom: Layout.spacing.md },
  activeDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Layout.spacing.xs },
  activeDetailText: { fontSize: Layout.font.sm, color: Colors.textInverse, marginLeft: Layout.spacing.sm, flex: 1 },
  activeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: Layout.spacing.sm },
  activeDistance: { fontSize: Layout.font.sm, color: Colors.textInverse, fontWeight: '600' },
  activeTap: { fontSize: Layout.font.sm, color: Colors.textInverse, fontWeight: '600' },

  section: { marginBottom: Layout.spacing.xl },
  sectionTitle: { fontSize: Layout.font.lg, fontWeight: '700', color: Colors.text, marginBottom: Layout.spacing.md },
  weekCard: { padding: Layout.spacing.lg },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Layout.spacing.xs },
  weekLabel: { fontSize: Layout.font.md, color: Colors.textSecondary },
  weekValue: { fontSize: Layout.font.md, fontWeight: '600', color: Colors.text },

  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionItem: { alignItems: 'center', flex: 1 },
  actionIcon: { width: 56, height: 56, borderRadius: Layout.radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Layout.spacing.sm },
  actionLabel: { fontSize: Layout.font.sm, fontWeight: '500', color: Colors.text },
});

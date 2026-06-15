import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAgentStore } from '@/stores';
import { Card, EmptyState } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { DeliveryActivity } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function EarningsScreen() {
  const { stats, activity, fetchStats, fetchActivity } = useAgentStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    await Promise.all([fetchStats(), fetchActivity(30)]);
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderActivity = ({ item }: { item: DeliveryActivity }) => (
    <Card style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityDate}>{formatDate(item.date)}</Text>
        <Text style={styles.activityEarnings}>{formatCurrency(item.earnings)}</Text>
      </View>
      <View style={styles.activityStats}>
        <View style={styles.activityStat}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.activityStatText}>{item.ordersCompleted} delivered</Text>
        </View>
        <View style={styles.activityStat}>
          <Ionicons name="close-circle" size={16} color={Colors.error} />
          <Text style={styles.activityStatText}>{item.ordersFailed} failed</Text>
        </View>
        <View style={styles.activityStat}>
          <Ionicons name="map" size={16} color={Colors.textTertiary} />
          <Text style={styles.activityStatText}>{item.distanceKm.toFixed(1)} km</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <FlatList
      data={activity}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <>
          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            <Card style={styles.summaryCard}>
              <Ionicons name="wallet" size={24} color={Colors.primary} />
              <Text style={styles.summaryValue}>{formatCurrency(stats?.todayEarnings || 0)}</Text>
              <Text style={styles.summaryLabel}>Today</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Ionicons name="trending-up" size={24} color={Colors.success} />
              <Text style={styles.summaryValue}>{formatCurrency(stats?.totalEarnings || 0)}</Text>
              <Text style={styles.summaryLabel}>All Time</Text>
            </Card>
          </View>

          <View style={styles.summaryGrid}>
            <Card style={styles.summaryCard}>
              <Ionicons name="bicycle" size={24} color={Colors.info} />
              <Text style={styles.summaryValue}>{stats?.todayCompleted || 0}</Text>
              <Text style={styles.summaryLabel}>Today</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Ionicons name="checkmark-done" size={24} color={Colors.success} />
              <Text style={styles.summaryValue}>{stats?.totalDeliveries || 0}</Text>
              <Text style={styles.summaryLabel}>All Time</Text>
            </Card>
          </View>

          <Text style={styles.sectionTitle}>Activity History</Text>
        </>
      }
      renderItem={renderActivity}
      ListEmptyComponent={
        <EmptyState icon="wallet-outline" title="No activity yet" description="Your delivery activity will appear here" />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: Layout.padding.md, paddingBottom: 40 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Layout.spacing.md },
  summaryCard: { width: '48%', padding: Layout.spacing.lg, alignItems: 'center' },
  summaryValue: { fontSize: Layout.font.xxl, fontWeight: '700', color: Colors.text, marginTop: Layout.spacing.sm },
  summaryLabel: { fontSize: Layout.font.xs, color: Colors.textTertiary, marginTop: 2 },
  sectionTitle: { fontSize: Layout.font.lg, fontWeight: '700', color: Colors.text, marginBottom: Layout.spacing.md, marginTop: Layout.spacing.sm },
  activityCard: { marginBottom: Layout.spacing.md },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Layout.spacing.sm },
  activityDate: { fontSize: Layout.font.md, fontWeight: '600', color: Colors.text },
  activityEarnings: { fontSize: Layout.font.lg, fontWeight: '700', color: Colors.primary },
  activityStats: { flexDirection: 'row', gap: Layout.spacing.lg },
  activityStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activityStatText: { fontSize: Layout.font.sm, color: Colors.textSecondary },
});

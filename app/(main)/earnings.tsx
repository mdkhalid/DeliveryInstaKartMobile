import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAgentStore } from '@/stores';
import { Card } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { DeliveryActivity } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

// ─── Period options ───
type Period = 'today' | 'week' | 'month' | 'all';

const PERIODS: { key: Period; label: string; days: number }[] = [
  { key: 'today', label: 'Today', days: 1 },
  { key: 'week', label: 'This Week', days: 7 },
  { key: 'month', label: 'This Month', days: 30 },
  { key: 'all', label: 'All Time', days: 90 },
];

// ─── Simple bar chart component ───
function EarningsBarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBars}>
        {data.map((item, index) => {
          const height = Math.max((item.value / maxValue) * 120, 4);
          return (
            <View key={index} style={styles.chartBarWrapper}>
              <View style={styles.chartBarTrack}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height,
                      backgroundColor: item.value > 0 ? Colors.primary : Colors.surfaceAlt,
                    },
                  ]}
                />
              </View>
              <Text style={styles.chartBarValue}>
                {item.value > 0 ? formatCurrency(item.value) : '-'}
              </Text>
              <Text style={styles.chartBarLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Stat pill component ───
function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statPill}>
      <View style={[styles.statPillIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.statPillInfo}>
        <Text style={styles.statPillValue}>{value}</Text>
        <Text style={styles.statPillLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function EarningsScreen() {
  const { stats, activity, fetchStats, fetchActivity } = useAgentStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');

  const periodDays = PERIODS.find((p) => p.key === selectedPeriod)?.days || 7;

  const loadData = useCallback(async () => {
    await Promise.all([fetchStats(), fetchActivity(periodDays)]);
  }, [periodDays, fetchStats, fetchActivity]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ─── Filter activity by selected date range ───
  const visibleData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);
    cutoff.setHours(0, 0, 0, 0);
    return activity.filter((a) => new Date(a.date) >= cutoff);
  }, [activity, periodDays]);

  // ─── Compute period stats from filtered activity ───
  const periodStats = useMemo(() => {
    const totalEarnings = visibleData.reduce((sum, a) => sum + a.earnings, 0);
    const totalCompleted = visibleData.reduce((sum, a) => sum + a.ordersCompleted, 0);
    const totalFailed = visibleData.reduce((sum, a) => sum + a.ordersFailed, 0);
    const totalAssigned = visibleData.reduce((sum, a) => sum + a.ordersAssigned, 0);
    const totalDistance = visibleData.reduce((sum, a) => sum + a.distanceKm, 0);
    const avgPerDelivery = totalCompleted > 0 ? totalEarnings / totalCompleted : 0;
    const attemptRate = totalAssigned > 0 ? ((totalCompleted + totalFailed) / totalAssigned) * 100 : 0;
    const successRate = totalCompleted + totalFailed > 0 ? (totalCompleted / (totalCompleted + totalFailed)) * 100 : 0;

    return {
      totalEarnings,
      totalCompleted,
      totalFailed,
      totalAssigned,
      totalDistance,
      avgPerDelivery,
      attemptRate,
      successRate,
    };
  }, [visibleData]);

  // ─── Chart data (last 7 days) ───
  const chartData = useMemo(() => {
    const last7 = activity.slice(0, 7).reverse();
    return last7.map((a) => ({
      label: new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short' }),
      value: a.earnings,
    }));
  }, [activity]);

  // ─── Render activity item ───
  const renderActivity = ({ item, index }: { item: DeliveryActivity; index: number }) => {
    const isToday = new Date(item.date).toDateString() === new Date().toDateString();
    const dayLabel = isToday ? 'Today' : formatDate(item.date);

    return (
      <View style={styles.historyItem}>
        <View style={styles.historyLeft}>
          <View style={[styles.historyDot, { backgroundColor: item.ordersCompleted > 0 ? Colors.success : Colors.textTertiary }]} />
          {index < visibleData.length - 1 && <View style={styles.historyLine} />}
        </View>
        <Card style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyDate}>{dayLabel}</Text>
            <Text style={styles.historyEarnings}>{formatCurrency(item.earnings)}</Text>
          </View>
          <View style={styles.historyStats}>
            <View style={styles.historyStat}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.historyStatText}>{item.ordersCompleted}</Text>
            </View>
            {item.ordersFailed > 0 && (
              <View style={styles.historyStat}>
                <Ionicons name="close-circle" size={14} color={Colors.error} />
                <Text style={styles.historyStatText}>{item.ordersFailed}</Text>
              </View>
            )}
            <View style={styles.historyStat}>
              <Ionicons name="map-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.historyStatText}>{item.distanceKm.toFixed(1)} km</Text>
            </View>
            {item.startTime && item.endTime && (
              <View style={styles.historyStat}>
                <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
                <Text style={styles.historyStatText}>
                  {new Date(item.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(item.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </View>
        </Card>
      </View>
    );
  };

  return (
    <FlatList
      data={visibleData}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <>
          {/* ─── Period Selector ─── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
            <View style={styles.periodSelector}>
              {PERIODS.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[styles.periodButton, selectedPeriod === period.key && styles.periodButtonActive]}
                  onPress={() => setSelectedPeriod(period.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.periodText, selectedPeriod === period.key && styles.periodTextActive]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* ─── Main Earnings Card ─── */}
          <Card style={styles.earningsCard}>
            <View style={styles.earningsHeader}>
              <Text style={styles.earningsLabel}>Total Earnings</Text>
              <Ionicons name="wallet" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.earningsValue}>{formatCurrency(periodStats.totalEarnings)}</Text>
            <View style={styles.earningsChange}>
              <Ionicons name="trending-up" size={14} color={Colors.success} />
              <Text style={styles.earningsChangeText}>
                {formatCurrency(stats?.todayEarnings || 0)} today
              </Text>
            </View>
          </Card>

          {/* ─── Quick Stats Row ─── */}
          <View style={styles.quickStats}>
            <StatPill icon="checkmark-done" label="Delivered" value={`${periodStats.totalCompleted}`} color={Colors.success} />
            <StatPill icon="close-circle" label="Failed" value={`${periodStats.totalFailed}`} color={Colors.error} />
            <StatPill icon="map" label="Distance" value={`${periodStats.totalDistance.toFixed(1)} km`} color={Colors.info} />
          </View>

          {/* ─── Detailed Stats ─── */}
          <Card style={styles.statsCard}>
            <Text style={styles.statsTitle}>Performance</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <View style={styles.statsItem}>
                  <Text style={styles.statsItemValue}>{formatCurrency(periodStats.avgPerDelivery)}</Text>
                  <Text style={styles.statsItemLabel}>Avg / Delivery</Text>
                </View>
                <View style={styles.statsDivider} />
                <View style={styles.statsItem}>
                  <Text style={styles.statsItemValue}>{periodStats.successRate.toFixed(0)}%</Text>
                  <Text style={styles.statsItemLabel}>Success Rate</Text>
                </View>
              </View>
              <View style={[styles.statsRow, { marginTop: Layout.spacing.md }]}>
                <View style={styles.statsItem}>
                  <Text style={styles.statsItemValue}>{periodStats.totalAssigned}</Text>
                  <Text style={styles.statsItemLabel}>Assigned</Text>
                </View>
                <View style={styles.statsDivider} />
                <View style={styles.statsItem}>
                  <Text style={styles.statsItemValue}>{periodStats.attemptRate.toFixed(0)}%</Text>
                  <Text style={styles.statsItemLabel}>Attempt Rate</Text>
                </View>
              </View>
            </View>
          </Card>

          {/* ─── Weekly Chart ─── */}
          {chartData.length > 0 && (
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>Last 7 Days</Text>
              <EarningsBarChart data={chartData} />
            </Card>
          )}

          {/* ─── History Section ─── */}
          <Text style={styles.sectionTitle}>Activity History</Text>
        </>
      }
      renderItem={renderActivity}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptySubtitle}>Your delivery earnings will appear here</Text>
        </View>
      }
    />
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: {
    padding: Layout.padding.md,
    paddingBottom: 40,
  },

  // Period selector
  periodScroll: { marginBottom: Layout.spacing.md },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Layout.radius.md,
    padding: 3,
  },
  periodButton: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.sm,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    fontSize: Layout.font.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  periodTextActive: {
    color: Colors.textInverse,
  },

  // Main earnings card
  earningsCard: {
    padding: Layout.spacing.xl,
    marginBottom: Layout.spacing.md,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  earningsLabel: {
    fontSize: Layout.font.sm,
    color: Colors.textSecondary,
  },
  earningsValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -1,
  },
  earningsChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Layout.spacing.sm,
  },
  earningsChangeText: {
    fontSize: Layout.font.sm,
    color: Colors.success,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Quick stats
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.sm,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statPillIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.sm,
  },
  statPillInfo: { flex: 1 },
  statPillValue: {
    fontSize: Layout.font.md,
    fontWeight: '700',
    color: Colors.text,
  },
  statPillLabel: {
    fontSize: Layout.font.xs,
    color: Colors.textTertiary,
  },

  // Stats card
  statsCard: {
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  statsTitle: {
    fontSize: Layout.font.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  statsGrid: {},
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsItemValue: {
    fontSize: Layout.font.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  statsItemLabel: {
    fontSize: Layout.font.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },

  // Chart
  chartCard: {
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  chartTitle: {
    fontSize: Layout.font.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  chartContainer: {
    height: 180,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flex: 1,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  chartBarTrack: {
    width: 28,
    height: 120,
    justifyContent: 'flex-end',
    borderRadius: Layout.radius.sm,
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    borderRadius: Layout.radius.sm,
    minHeight: 4,
  },
  chartBarValue: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  chartBarLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Section title
  sectionTitle: {
    fontSize: Layout.font.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
    marginTop: Layout.spacing.sm,
  },

  // History items
  historyItem: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.xs,
  },
  historyLeft: {
    width: 20,
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 18,
  },
  historyLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  historyCard: {
    flex: 1,
    padding: Layout.spacing.md,
    marginBottom: 0,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  historyDate: {
    fontSize: Layout.font.md,
    fontWeight: '600',
    color: Colors.text,
  },
  historyEarnings: {
    fontSize: Layout.font.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  historyStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.md,
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyStatText: {
    fontSize: Layout.font.sm,
    color: Colors.textSecondary,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xxxl,
  },
  emptyTitle: {
    fontSize: Layout.font.lg,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Layout.spacing.md,
  },
  emptySubtitle: {
    fontSize: Layout.font.md,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.sm,
  },
});

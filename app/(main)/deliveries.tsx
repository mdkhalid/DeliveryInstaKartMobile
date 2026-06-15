import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAgentStore } from '@/stores';
import { Card, Badge, EmptyState, Button } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { DeliveryAssignment, AssignmentStatus } from '@/types';
import { formatCurrency, getAssignmentStatusLabel, getAssignmentStatusColor, formatDate } from '@/lib/utils';

type Tab = 'active' | 'pending' | 'completed';

export default function DeliveriesScreen() {
  const router = useRouter();
  const { assignments, fetchAssignments, updateAssignmentStatus, isLoading } = useAgentStore();
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchAssignments(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAssignments();
    setRefreshing(false);
  };

  const filteredAssignments = assignments.filter((a) => {
    if (activeTab === 'active') return a.status === AssignmentStatus.PICKED_UP || a.status === AssignmentStatus.IN_TRANSIT;
    if (activeTab === 'pending') return a.status === AssignmentStatus.ASSIGNED;
    return a.status === AssignmentStatus.DELIVERED || a.status === AssignmentStatus.FAILED;
  });

  const handleAccept = async (id: string) => {
    try { await updateAssignmentStatus(id, AssignmentStatus.PICKED_UP); } catch { /* handled */ }
  };

  const handleDecline = async (id: string) => {
    try { await updateAssignmentStatus(id, AssignmentStatus.FAILED, 'Declined by agent'); } catch { /* handled */ }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: assignments.filter((a) => a.status === AssignmentStatus.PICKED_UP || a.status === AssignmentStatus.IN_TRANSIT).length },
    { key: 'pending', label: 'Pending', count: assignments.filter((a) => a.status === AssignmentStatus.ASSIGNED).length },
    { key: 'completed', label: 'Completed', count: assignments.filter((a) => a.status === AssignmentStatus.DELIVERED).length },
  ];

  const renderAssignment = ({ item }: { item: DeliveryAssignment }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.orderNumber}>#{item.order?.orderNumber || 'N/A'}</Text>
          <Badge
            text={getAssignmentStatusLabel(item.status)}
            backgroundColor={getAssignmentStatusColor(item.status)}
            size="sm"
          />
        </View>
        <Text style={styles.time}>{formatDate(item.assignedAt)}</Text>
      </View>

      <View style={styles.routeInfo}>
        <View style={styles.routeItem}>
          <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {item.order?.store?.name || 'Pickup'}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeItem}>
          <View style={[styles.routeDot, { backgroundColor: Colors.error }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {item.order?.address?.street || 'Drop-off'}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Text style={styles.items}>
            {item.order?.items?.length || 0} items
          </Text>
          {item.distanceKm && (
            <Text style={styles.distance}>{item.distanceKm.toFixed(1)} km</Text>
          )}
        </View>
        <Text style={styles.total}>{formatCurrency(item.order?.total || 0)}</Text>
      </View>

      {item.status === AssignmentStatus.ASSIGNED && (
        <View style={styles.actions}>
          <Button
            title="Decline"
            variant="outline"
            onPress={() => handleDecline(item.id)}
            size="sm"
            fullWidth={false}
          />
          <Button
            title="Accept"
            onPress={() => handleAccept(item.id)}
            size="sm"
            fullWidth={false}
            loading={isLoading}
          />
        </View>
      )}

      {item.status === AssignmentStatus.PICKED_UP || item.status === AssignmentStatus.IN_TRANSIT ? (
        <Button
          title="View Delivery"
          onPress={() => router.push(`/tracking/${item.orderId}`)}
          size="sm"
        />
      ) : null}
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredAssignments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderAssignment}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="bicycle-outline"
            title={`No ${activeTab} deliveries`}
            description={activeTab === 'pending' ? 'New assignments will appear here' : `You have no ${activeTab} deliveries`}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.background,
    marginHorizontal: Layout.padding.md, marginTop: Layout.padding.md,
    borderRadius: Layout.radius.md, padding: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Layout.spacing.sm, borderRadius: Layout.radius.sm,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: Layout.font.sm, fontWeight: '500', color: Colors.textSecondary },
  tabTextActive: { color: Colors.textInverse },
  tabBadge: {
    marginLeft: Layout.spacing.xs, backgroundColor: Colors.surfaceAlt,
    borderRadius: Layout.radius.full, paddingHorizontal: 6, paddingVertical: 1,
    minWidth: 20, alignItems: 'center',
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  tabBadgeTextActive: { color: Colors.textInverse },

  list: { padding: Layout.padding.md },
  card: { marginBottom: Layout.spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Layout.spacing.md },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.sm },
  orderNumber: { fontSize: Layout.font.md, fontWeight: '700', color: Colors.text },
  time: { fontSize: Layout.font.xs, color: Colors.textTertiary },

  routeInfo: { marginBottom: Layout.spacing.md },
  routeItem: { flexDirection: 'row', alignItems: 'center' },
  routeDot: { width: 10, height: 10, borderRadius: 5, marginRight: Layout.spacing.sm },
  routeText: { fontSize: Layout.font.sm, color: Colors.text, flex: 1 },
  routeLine: { width: 1, height: 12, backgroundColor: Colors.border, marginLeft: 4, marginVertical: 2 },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Layout.spacing.sm,
  },
  footerLeft: { flexDirection: 'row', gap: Layout.spacing.md },
  items: { fontSize: Layout.font.sm, color: Colors.textSecondary },
  distance: { fontSize: Layout.font.sm, color: Colors.textSecondary },
  total: { fontSize: Layout.font.md, fontWeight: '700', color: Colors.primary },

  actions: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: Layout.spacing.sm,
    marginTop: Layout.spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight,
    paddingTop: Layout.spacing.md,
  },
});

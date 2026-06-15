import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { orderAPI, deliveryAPI } from '@/lib/api';
import { useSocket } from '@/hooks';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Order, AssignmentStatus, OrderItem } from '@/types';
import {
  formatCurrency,
  getOrderStatusLabel,
  getOrderStatusColor,
} from '@/lib/utils';
import { Badge, Card } from '@/components/ui';

// ─── Status step definitions for agent workflow ───
const DELIVERY_STEPS: {
  status: AssignmentStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { status: AssignmentStatus.ASSIGNED, label: 'Assigned', icon: 'clipboard-outline' },
  { status: AssignmentStatus.PICKED_UP, label: 'Picked Up', icon: 'bag-check-outline' },
  { status: AssignmentStatus.IN_TRANSIT, label: 'In Transit', icon: 'bicycle-outline' },
  { status: AssignmentStatus.DELIVERED, label: 'Delivered', icon: 'checkmark-circle-outline' },
];

function getStepIndex(status: AssignmentStatus): number {
  return DELIVERY_STEPS.findIndex((s) => s.status === status);
}

// ─── Navigation helper ───
function openNavigation(lat: number, lng: number, label: string) {
  const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const appleMapsUrl = `${scheme}?q=${lat},${lng}&ll=&near=${lat},${lng}`;

  Alert.alert('Open Navigation', `Navigate to ${label}?`, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Google Maps',
      onPress: () => Linking.openURL(googleMapsUrl),
    },
    ...(Platform.OS === 'ios'
      ? [
          {
            text: 'Apple Maps',
            onPress: () => Linking.openURL(appleMapsUrl),
          },
        ]
      : []),
  ]);
}

// ─── Call helper ───
function callNumber(phone: string) {
  Linking.openURL(`tel:${phone}`);
}

// ─── Order Item Component ───
function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <View style={styles.itemRow}>
      {item.productImage ? (
        <Image source={{ uri: item.productImage }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
          <Ionicons name="cube-outline" size={20} color={Colors.textTertiary} />
        </View>
      )}
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.productName}
        </Text>
        <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
      </View>
      <Text style={styles.itemPrice}>{formatCurrency(item.totalPrice)}</Text>
    </View>
  );
}

export default function ActiveDeliveryScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { subscribeOrderUpdates } = useSocket();

  const [order, setOrder] = useState<Order | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [status, setStatus] = useState<AssignmentStatus>(AssignmentStatus.ASSIGNED);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // ─── Fetch order data ───
  const fetchData = useCallback(async () => {
    if (!orderId) return;
    try {
      const { data } = await orderAPI.detail(orderId);
      const ord = data.data as Order;
      setOrder(ord);

      if (ord.deliveryAssignment) {
        setAssignmentId(ord.deliveryAssignment.id);
        setStatus(ord.deliveryAssignment.status);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Socket subscriptions ───
  useEffect(() => {
    const unsubOrder = subscribeOrderUpdates((data) => {
      if (data.orderId === orderId && data.status) {
        fetchData();
      }
    });

    return () => {
      unsubOrder();
    };
  }, [orderId, subscribeOrderUpdates, fetchData]);

  // ─── Computed values ───
  const storeLocation = useMemo(() => {
    if (order?.store?.lat && order?.store?.lng) {
      return { latitude: order.store.lat, longitude: order.store.lng };
    }
    return null;
  }, [order?.store?.lat, order?.store?.lng]);

  const customerLocation = useMemo(() => {
    if (order?.address?.lat && order?.address?.lng) {
      return { latitude: order.address.lat, longitude: order.address.lng };
    }
    return null;
  }, [order?.address?.lat, order?.address?.lng]);

  const currentStepIndex = getStepIndex(status);
  const isAssigned = status === AssignmentStatus.ASSIGNED;
  const isPickedUp = status === AssignmentStatus.PICKED_UP;
  const isInTransit = status === AssignmentStatus.IN_TRANSIT;
  const isDelivered = status === AssignmentStatus.DELIVERED;
  const isFailed = status === AssignmentStatus.FAILED;
  const isActive = !isDelivered && !isFailed;

  // ─── Determine current destination based on status ───
  const currentDestination = useMemo(() => {
    if (isAssigned) return storeLocation; // Going to pickup
    if (isPickedUp || isInTransit) return customerLocation; // Going to drop
    return null;
  }, [isAssigned, isPickedUp, isInTransit, storeLocation, customerLocation]);

  // ─── Fit map to show route ───
  const fitToPoints = useCallback(() => {
    if (!mapRef.current) return;
    const points = [storeLocation, customerLocation].filter(
      (p): p is { latitude: number; longitude: number } => p !== null
    );
    if (points.length > 1) {
      mapRef.current.fitToCoordinates(points, {
        edgePadding: { top: 80, right: 80, bottom: 300, left: 80 },
        animated: true,
      });
    } else if (points.length === 1) {
      mapRef.current.animateToRegion(
        { ...points[0], latitudeDelta: 0.02, longitudeDelta: 0.02 },
        500
      );
    }
  }, [storeLocation, customerLocation]);

  useEffect(() => {
    if (mapReady) {
      setTimeout(fitToPoints, 300);
    }
  }, [mapReady, fitToPoints]);

  // ─── Update assignment status ───
  const updateStatus = async (newStatus: AssignmentStatus) => {
    if (!assignmentId) return;

    const statusLabels: Record<AssignmentStatus, string> = {
      [AssignmentStatus.ASSIGNED]: 'Pick Up',
      [AssignmentStatus.PICKED_UP]: 'Start Delivery',
      [AssignmentStatus.IN_TRANSIT]: 'Mark as Delivered',
      [AssignmentStatus.DELIVERED]: 'Delivered',
      [AssignmentStatus.FAILED]: 'Mark as Failed',
    };

    const actionLabel = statusLabels[newStatus];

    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${actionLabel.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newStatus === AssignmentStatus.FAILED ? 'destructive' : 'default',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await deliveryAPI.updateAssignmentStatus(assignmentId, newStatus);
              setStatus(newStatus);
              Alert.alert('Success', `Status updated to ${actionLabel}`);
            } catch (error) {
              Alert.alert('Error', 'Failed to update status. Please try again.');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  // ─── Loading state ───
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading delivery details...</Text>
      </View>
    );
  }

  // ─── No order state ───
  if (!order) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.textTertiary} />
        <Text style={styles.emptyTitle}>Order not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Map region ───
  const initialRegion = storeLocation
    ? { ...storeLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : customerLocation
    ? { ...customerLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : { latitude: 28.6139, longitude: 77.209, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  // ─── Get next action button config ───
  const getNextActionButton = () => {
    if (isAssigned) {
      return {
        label: 'Picked Up',
        icon: 'bag-check-outline' as keyof typeof Ionicons.glyphMap,
        nextStatus: AssignmentStatus.PICKED_UP,
        color: Colors.primary,
      };
    }
    if (isPickedUp) {
      return {
        label: 'Start Delivery',
        icon: 'bicycle-outline' as keyof typeof Ionicons.glyphMap,
        nextStatus: AssignmentStatus.IN_TRANSIT,
        color: Colors.primary,
      };
    }
    if (isInTransit) {
      return {
        label: 'Delivered',
        icon: 'checkmark-circle-outline' as keyof typeof Ionicons.glyphMap,
        nextStatus: AssignmentStatus.DELIVERED,
        color: Colors.success,
      };
    }
    return null;
  };

  const nextAction = getNextActionButton();

  return (
    <View style={styles.container}>
      {/* ─── Map ─── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        onMapReady={() => setMapReady(true)}
      >
        {/* Store marker (pickup) */}
        {storeLocation && (
          <Marker coordinate={storeLocation} identifier="store">
            <View style={styles.storeMarker}>
              <Ionicons name="storefront" size={16} color={Colors.textInverse} />
            </View>
          </Marker>
        )}

        {/* Customer marker (drop) */}
        {customerLocation && (
          <Marker coordinate={customerLocation} identifier="customer">
            <View style={styles.customerMarker}>
              <Ionicons name="location" size={16} color={Colors.textInverse} />
            </View>
          </Marker>
        )}

        {/* Route polyline from store to customer */}
        {storeLocation && customerLocation && (
          <Polyline
            coordinates={[storeLocation, customerLocation]}
            strokeColor={isAssigned ? Colors.textTertiary : Colors.primary}
            strokeWidth={4}
            lineDashPattern={isAssigned ? [8, 4] : undefined}
          />
        )}
      </MapView>

      {/* ─── Re-center button ─── */}
      <TouchableOpacity style={styles.recenterButton} onPress={fitToPoints} activeOpacity={0.8}>
        <Ionicons name="locate" size={20} color={Colors.primary} />
      </TouchableOpacity>

      {/* ─── Bottom sheet ─── */}
      <View style={styles.bottomSheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bottomScrollContent}>
          {/* Status Timeline */}
          <View style={styles.timeline}>
            {DELIVERY_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <View key={step.status} style={styles.timelineStep}>
                  <View
                    style={[
                      styles.timelineDot,
                      isCompleted && styles.timelineDotCompleted,
                      isCurrent && styles.timelineDotCurrent,
                    ]}
                  >
                    <Ionicons
                      name={isCompleted ? 'checkmark' : step.icon}
                      size={isCurrent ? 14 : 10}
                      color={isCompleted ? Colors.textInverse : Colors.textTertiary}
                    />
                  </View>
                  <Text style={[styles.timelineLabel, isCompleted && styles.timelineLabelCompleted]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ─── Delivery Info Card ─── */}
          <Card style={styles.deliveryCard}>
            <View style={styles.deliveryHeader}>
              <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
              <Badge
                text={getOrderStatusLabel(order.status)}
                backgroundColor={getOrderStatusColor(order.status)}
                size="sm"
              />
            </View>

            {/* Pickup Location */}
            {order.store && (
              <TouchableOpacity
                style={styles.locationRow}
                onPress={() => storeLocation && openNavigation(storeLocation.latitude, storeLocation.longitude, order.store!.name)}
              >
                <View style={[styles.locationDot, { backgroundColor: Colors.secondary }]} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>PICKUP</Text>
                  <Text style={styles.locationName}>{order.store.name}</Text>
                  <Text style={styles.locationAddress} numberOfLines={1}>
                    {order.store.addressLine1}, {order.store.city}
                  </Text>
                </View>
                <Ionicons name="navigate" size={20} color={Colors.primary} />
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={styles.locationDivider}>
              <View style={styles.dividerLine} />
              <Ionicons name="arrow-down" size={16} color={Colors.textTertiary} />
              <View style={styles.dividerLine} />
            </View>

            {/* Drop Location */}
            {order.address && (
              <TouchableOpacity
                style={styles.locationRow}
                onPress={() => customerLocation && openNavigation(customerLocation.latitude, customerLocation.longitude, 'Customer')}
              >
                <View style={[styles.locationDot, { backgroundColor: Colors.error }]} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>DROP</Text>
                  <Text style={styles.locationName}>{order.address.label || 'Customer Address'}</Text>
                  <Text style={styles.locationAddress} numberOfLines={1}>
                    {order.address.street}, {order.address.city}
                  </Text>
                  {order.address.landmark && (
                    <Text style={styles.locationLandmark}>Near: {order.address.landmark}</Text>
                  )}
                </View>
                <Ionicons name="navigate" size={20} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </Card>

          {/* ─── Customer Info Card ─── */}
          {order.user && (
            <Card style={styles.customerCard}>
              <View style={styles.customerRow}>
                <View style={styles.customerAvatar}>
                  <Ionicons name="person" size={24} color={Colors.textInverse} />
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>
                    {order.user.firstName} {order.user.lastName}
                  </Text>
                  <Text style={styles.customerPhone}>{order.user.phone || 'No phone'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => order.user?.phone && callNumber(order.user.phone)}
                >
                  <Ionicons name="call" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.chatButton}
                  onPress={() => Alert.alert('Chat', 'Chat feature coming soon')}
                >
                  <Ionicons name="chatbubble" size={22} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* ─── Order Items ─── */}
          <Card style={styles.itemsCard}>
            <Text style={styles.itemsTitle}>Order Items</Text>
            {order.items.map((item) => (
              <OrderItemRow key={item.id} item={item} />
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
            </View>
          </Card>

          {/* ─── Payment Info ─── */}
          <Card style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Ionicons
                name={order.paymentMethod === 'COD' ? 'cash-outline' : 'card-outline'}
                size={20}
                color={Colors.textSecondary}
              />
              <Text style={styles.paymentMethod}>
                {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}
              </Text>
              <Badge
                text={order.paymentStatus}
                backgroundColor={order.paymentStatus === 'PAID' ? Colors.success : Colors.warning}
                size="sm"
              />
            </View>
          </Card>

          {/* ─── Customer Notes ─── */}
          {order.notes && (
            <Card style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <Ionicons name="chatbubbles-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.notesTitle}>Customer Notes</Text>
              </View>
              <Text style={styles.notesText}>{order.notes}</Text>
            </Card>
          )}

          {/* ─── Delivered / Failed state ─── */}
          {isDelivered && (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
              <View style={styles.completedInfo}>
                <Text style={styles.completedTitle}>Delivery Completed!</Text>
                <Text style={styles.completedSubtitle}>Great job! This delivery is done.</Text>
              </View>
            </View>
          )}

          {isFailed && (
            <View style={[styles.completedBanner, { backgroundColor: Colors.errorLight }]}>
              <Ionicons name="alert-circle" size={28} color={Colors.error} />
              <View style={styles.completedInfo}>
                <Text style={[styles.completedTitle, { color: Colors.error }]}>Delivery Failed</Text>
                <Text style={styles.completedSubtitle}>This delivery could not be completed.</Text>
              </View>
            </View>
          )}

          {/* ─── Bottom spacing for action button ─── */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {/* ─── Action Buttons (Fixed at bottom) ─── */}
      {isActive && (
        <View style={styles.actionBar}>
          {nextAction && (
            <TouchableOpacity
              style={[styles.primaryActionButton, { backgroundColor: nextAction.color }]}
              onPress={() => updateStatus(nextAction.nextStatus)}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color={Colors.textInverse} />
              ) : (
                <>
                  <Ionicons name={nextAction.icon} size={22} color={Colors.textInverse} />
                  <Text style={styles.primaryActionText}>{nextAction.label}</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => updateStatus(AssignmentStatus.FAILED)}
            disabled={isUpdating}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
            <Text style={styles.secondaryActionText}>Failed</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.padding.xl,
    backgroundColor: Colors.surface,
  },
  loadingText: { fontSize: Layout.font.md, color: Colors.textSecondary, marginTop: Layout.spacing.md },
  emptyTitle: { fontSize: Layout.font.xl, fontWeight: '700', color: Colors.text, marginTop: Layout.spacing.lg },
  backButton: {
    marginTop: Layout.spacing.xl,
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.radius.md,
  },
  backButtonText: { color: Colors.textInverse, fontWeight: '600', fontSize: Layout.font.md },

  // Map
  map: { ...StyleSheet.absoluteFillObject },

  // Markers
  storeMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.textInverse,
  },
  customerMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.textInverse,
  },

  // Re-center button
  recenterButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },

  // Bottom sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: Layout.radius.xl,
    borderTopRightRadius: Layout.radius.xl,
    paddingTop: Layout.spacing.md,
    maxHeight: '65%',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
  bottomScrollContent: { paddingBottom: Layout.spacing.lg },

  // Timeline
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
  },
  timelineStep: { alignItems: 'center', flex: 1 },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.xs,
  },
  timelineDotCompleted: { backgroundColor: Colors.primary },
  timelineDotCurrent: {
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  timelineLabel: { fontSize: Layout.font.xs, color: Colors.textTertiary, textAlign: 'center' },
  timelineLabelCompleted: { color: Colors.primary, fontWeight: '600' },

  // Delivery card
  deliveryCard: { marginHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.md },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  orderNumber: { fontSize: Layout.font.lg, fontWeight: '700', color: Colors.text },

  // Location rows
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Layout.spacing.md,
  },
  locationInfo: { flex: 1 },
  locationLabel: {
    fontSize: Layout.font.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  locationName: { fontSize: Layout.font.md, fontWeight: '600', color: Colors.text },
  locationAddress: { fontSize: Layout.font.sm, color: Colors.textSecondary, marginTop: 2 },
  locationLandmark: { fontSize: Layout.font.xs, color: Colors.textTertiary, marginTop: 2 },
  locationDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Layout.spacing.xs,
    marginLeft: 5,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },

  // Customer card
  customerCard: { marginHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.md },
  customerRow: { flexDirection: 'row', alignItems: 'center' },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  customerInfo: { flex: 1 },
  customerName: { fontSize: Layout.font.md, fontWeight: '700', color: Colors.text },
  customerPhone: { fontSize: Layout.font.sm, color: Colors.textSecondary, marginTop: 2 },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.sm,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Order items
  itemsCard: { marginHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.md },
  itemsTitle: { fontSize: Layout.font.md, fontWeight: '700', color: Colors.text, marginBottom: Layout.spacing.md },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: Layout.radius.sm,
    marginRight: Layout.spacing.md,
  },
  itemImagePlaceholder: {
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: { flex: 1 },
  itemName: { fontSize: Layout.font.sm, fontWeight: '600', color: Colors.text },
  itemQty: { fontSize: Layout.font.xs, color: Colors.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: Layout.font.sm, fontWeight: '600', color: Colors.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: { fontSize: Layout.font.md, fontWeight: '600', color: Colors.text },
  totalValue: { fontSize: Layout.font.lg, fontWeight: '700', color: Colors.primary },

  // Payment card
  paymentCard: { marginHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.md },
  paymentRow: { flexDirection: 'row', alignItems: 'center' },
  paymentMethod: { flex: 1, fontSize: Layout.font.sm, color: Colors.text, marginLeft: Layout.spacing.sm },

  // Notes card
  notesCard: { marginHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.md },
  notesHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Layout.spacing.sm },
  notesTitle: { fontSize: Layout.font.sm, fontWeight: '600', color: Colors.text, marginLeft: Layout.spacing.sm },
  notesText: { fontSize: Layout.font.sm, color: Colors.textSecondary, lineHeight: 20 },

  // Completed/Failed banner
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    marginHorizontal: Layout.spacing.lg,
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    marginTop: Layout.spacing.sm,
  },
  completedInfo: { marginLeft: Layout.spacing.md, flex: 1 },
  completedTitle: { fontSize: Layout.font.lg, fontWeight: '700', color: Colors.success },
  completedSubtitle: { fontSize: Layout.font.sm, color: Colors.textSecondary, marginTop: 2 },

  // Action bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xl,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 10,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    marginRight: Layout.spacing.sm,
  },
  primaryActionText: {
    color: Colors.textInverse,
    fontSize: Layout.font.md,
    fontWeight: '700',
    marginLeft: Layout.spacing.sm,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  secondaryActionText: {
    color: Colors.error,
    fontSize: Layout.font.sm,
    fontWeight: '600',
    marginLeft: Layout.spacing.xs,
  },
});

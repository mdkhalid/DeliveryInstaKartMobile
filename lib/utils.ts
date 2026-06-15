export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(0)}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateMinutes(distanceKm: number, speedKmph = 25): number {
  return Math.ceil((distanceKm / speedKmph) * 60);
}

export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: '#F59E0B',
    CONFIRMED: '#3B82F6',
    PREPARING: '#8B5CF6',
    OUT_FOR_DELIVERY: '#FF6B35',
    DELIVERED: '#10B981',
    CANCELLED: '#EF4444',
    REFUNDED: '#6B7280',
  };
  return map[status] || '#6B7280';
}

export function getOrderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PREPARING: 'Preparing',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
  };
  return map[status] || status;
}

export function getAssignmentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ASSIGNED: 'Assigned',
    PICKED_UP: 'Picked Up',
    IN_TRANSIT: 'On the Way',
    DELIVERED: 'Delivered',
    FAILED: 'Failed',
  };
  return map[status] || status;
}

export function getAssignmentStatusColor(status: string): string {
  const map: Record<string, string> = {
    ASSIGNED: '#F59E0B',
    PICKED_UP: '#3B82F6',
    IN_TRANSIT: '#8B5CF6',
    DELIVERED: '#10B981',
    FAILED: '#EF4444',
  };
  return map[status] || '#6B7280';
}

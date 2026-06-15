// ─────────────────────── ENUMS ───────────────────────

export enum Role {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  STORE_ADMIN = 'STORE_ADMIN',
  DELIVERY_AGENT = 'DELIVERY_AGENT',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  COD = 'COD',
  RAZORPAY = 'RAZORPAY',
  STRIPE = 'STRIPE',
  UPI = 'UPI',
}

export enum DeliveryPersonStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_DELIVERY = 'ON_DELIVERY',
  OFF_DUTY = 'OFF_DUTY',
}

export enum AssignmentStatus {
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

// ─────────────────────── MODELS ───────────────────────

export interface Store {
  id: string;
  name: string;
  slug: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  phone?: string;
  email?: string;
  isActive: boolean;
  openingTime?: string;
  closingTime?: string;
  deliveryRadiusKm: number;
  deliveryFee: number;
  minOrderAmount: number;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: Role;
  isEmailVerified: boolean;
  isActive: boolean;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user?: User;
  addressId: string;
  address?: Address;
  storeId?: string;
  store?: Store;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  couponCode?: string;
  notes?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  statusHistory: OrderStatusHistory[];
  deliveryAssignment?: DeliveryAssignment;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPerson {
  id: string;
  storeId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  employeeId?: string;
  type: 'FULL_TIME' | 'PART_TIME';
  status: DeliveryPersonStatus;
  vehicleType: 'BIKE' | 'SCOOTER' | 'CAR' | 'WALK';
  vehicleNumber?: string;
  currentLat?: number;
  currentLng?: number;
  lastLocationAt?: string;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  joinedAt: string;
}

export interface DeliveryAssignment {
  id: string;
  deliveryPersonId: string;
  deliveryPerson?: DeliveryPerson;
  orderId: string;
  order?: Order;
  status: AssignmentStatus;
  assignedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  notes?: string;
  distanceKm?: number;
}

export interface DeliveryActivity {
  id: string;
  deliveryPersonId: string;
  date: string;
  ordersAssigned: number;
  ordersCompleted: number;
  ordersFailed: number;
  earnings: number;
  distanceKm: number;
  startTime?: string;
  endTime?: string;
}

// ─────────────────────── API RESPONSES ───────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

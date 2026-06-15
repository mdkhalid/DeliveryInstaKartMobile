# Delivery InstaKart Mobile App — Requirements

> Delivery Agent App for the InstantShopping backend.
> Backend: Express + Prisma + PostgreSQL + Redis + Socket.io
> API Base: `http://<host>:4000/api/v1`

---

## 1. Authentication

| # | Feature | API Endpoint | Description |
|---|---------|-------------|-------------|
| 1.1 | OTP Login | `POST /auth/send-otp` → `POST /auth/verify-otp` | Phone-based OTP login (primary auth for delivery agents). |
| 1.2 | Email Login | `POST /auth/login` | Fallback email + password login. |
| 1.3 | Token Refresh | `POST /auth/refresh` | Auto-refresh access token using refresh token. |
| 1.4 | Logout | `POST /auth/logout` | Clears refresh token from DB and cookie. |

### Auth Notes
- Access tokens are short-lived JWTs (Bearer token in Authorization header).
- Refresh tokens stored as httpOnly cookies.
- All protected endpoints require `Authorization: Bearer <token>` header.
- Delivery agents have role `DELIVERY_AGENT`.

---

## 2. Agent Profile

| # | Feature | API Endpoint | Description |
|---|---------|-------------|-------------|
| 2.1 | View Profile | `GET /users/profile` | Agent profile: name, phone, email, avatar, vehicle info, rating. |
| 2.2 | Update Profile | `PUT /users/profile` | Update name, phone. |
| 2.3 | Upload Avatar | `POST /users/avatar` | Upload profile picture. |
| 2.4 | Agent Stats | Via delivery controller | Total deliveries, rating, total earnings. |

### Agent Data (from `DeliveryPerson` model)
- `firstName`, `lastName`, `phone`, `email`, `avatarUrl`
- `vehicleType`: BIKE, SCOOTER, CAR, WALK
- `vehicleNumber`
- `type`: FULL_TIME, PART_TIME
- `status`: ACTIVE, INACTIVE, ON_DELIVERY, OFF_DUTY
- `rating`: 0–5.0 (average)
- `totalDeliveries`, `totalEarnings`
- `currentLat`, `currentLng` (live location)

---

## 3. Delivery Dashboard (Home Screen)

| # | Feature | API Endpoint | Description |
|---|---------|-------------|-------------|
| 3.1 | Today's Stats | Via delivery controller | Orders assigned today, completed, failed, earnings. |
| 3.2 | Go Online/Offline | Via delivery controller | Toggle availability status (ACTIVE ↔ OFF_DUTY). |
| 3.3 | Active Assignment | Via delivery controller | Current delivery in progress (if any). |
| 3.4 | Recent Activity | `GET /admin/delivery-persons/:id/activity` | Daily activity logs: orders, earnings, distance. |

### Dashboard Layout
```
┌─────────────────────────────────┐
│  Hi, John!          [Online ⬤] │
│                                 │
│  ┌─────────┐  ┌─────────┐      │
│  │  Today   │  │ Rating  │      │
│  │ 5 orders │  │  4.8 ⭐ │      │
│  └─────────┘  └─────────┘      │
│  ┌─────────┐  ┌─────────┐      │
│  │ Earned  │  │ Distance│      │
│  │ ₹850    │  │ 12.4 km │      │
│  └─────────┘  └─────────┘      │
│                                 │
│  [ Active Delivery Card ]       │
│  Order #IK-2026-001             │
│  Tap to view details →          │
│                                 │
│  Recent Activity                │
│  ✓ Delivered • ₹120 • 2.1km    │
│  ✓ Delivered • ₹95  • 1.8km    │
└─────────────────────────────────┘
```

---

## 4. Delivery Queue (Pending Assignments)

| # | Feature | API Endpoint | Description |
|---|---------|-------------|-------------|
| 4.1 | List Assignments | Via delivery controller | List of pending/active delivery assignments. |
| 4.2 | Assignment Detail | Via delivery controller | Full details: order items, pickup location, drop location, distance, customer info. |

### Assignment Card
```
┌─────────────────────────────────┐
│  📍 Pickup: InstaKart Store     │
│     MG Road, Bengaluru          │
│                                 │
│  📍 Drop: John's Home           │
│     123, Indiranagar            │
│                                 │
│  📦 3 items  •  ₹450  •  2.3km │
│                                 │
│  [ Accept ]  [ Decline ]        │
└─────────────────────────────────┘
```

---

## 5. Active Delivery Screen

| # | Feature | API Endpoint | Description |
|---|---------|-------------|-------------|
| 5.1 | Update Status | `PUT /admin/delivery-assignments/:id/status` | ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED / FAILED |
| 5.2 | Navigate to Pickup | Open Google Maps/Waze | Launch external navigation to pickup location. |
| 5.3 | Navigate to Drop | Open Google Maps/Waze | Launch external navigation to delivery location. |
| 5.4 | Call Customer | `Linking.openURL('tel:...')` | Call customer phone number. |
| 5.5 | Report Issue | Via delivery controller | Mark delivery as FAILED with reason. |
| 5.6 | Proof of Delivery | Via delivery controller | Optional photo upload as delivery proof. |

### Status Flow
```
ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED
                        ↓
                      FAILED
```

### Active Delivery Layout
```
┌─────────────────────────────────┐
│  ┌──────────────────────────┐   │
│  │        [ MAP VIEW ]      │   │
│  │                          │   │
│  │  🏪 Store  ←→  🚴 Me    │   │
│  │              ↓           │   │
│  │           📍 Customer    │   │
│  └──────────────────────────┘   │
│                                 │
│  Status: PICKED UP              │
│  ──●────●────○────○──           │
│  Assign  Pick  Transit Deliver  │
│                                 │
│  📍 Pickup: InstaKart Store     │
│     [ Navigate ]                │
│                                 │
│  📍 Drop: John's Home           │
│     [ Navigate ]                │
│                                 │
│  📦 3 items                     │
│  👤 John • [ Call ]             │
│                                 │
│  [ Mark as Delivered ✓ ]        │
│  [ Report Issue ✗ ]             │
└─────────────────────────────────┘
```

---

## 6. Earnings & Activity

| # | Feature | API Endpoint | Description |
|---|---------|-------------|-------------|
| 6.1 | Daily Activity | `GET /admin/delivery-persons/:id/activity` | Daily metrics: orders assigned, completed, failed, earnings, distance. |
| 6.2 | Earnings Summary | Via delivery controller | Total earnings, average per delivery, best day. |
| 6.3 | Delivery History | Via delivery controller | List of all completed deliveries with amounts and distances. |

### Earnings Layout
```
┌─────────────────────────────────┐
│  Earnings                       │
│                                 │
│  Today        ₹ 850            │
│  This Week    ₹ 4,200          │
│  This Month   ₹ 18,500         │
│                                 │
│  ─────────────────────────      │
│  Delivery History               │
│                                 │
│  #IK-2026-001  ₹120  2.1km     │
│  #IK-2026-002  ₹95   1.8km     │
│  #IK-2026-003  ₹110  3.2km     │
│  ...                            │
└─────────────────────────────────┘
```

---

## 7. Real-Time Updates (Socket.io)

| # | Feature | Description |
|---|---------|-------------|
| 7.1 | New Assignment Alert | Push notification when a new delivery is assigned. |
| 7.2 | Order Status Updates | Store confirms order, starts preparing. |
| 7.3 | Location Updates | Agent sends current location to server periodically. |
| 7.4 | Assignment Cancellation | Admin cancels assignment. |

### Socket.io Room
- `delivery` — All connected delivery agents receive assignment events.

### Socket Events (Agent Receives)
| Event | Data | Description |
|-------|------|-------------|
| `delivery:assigned` | `{ assignmentId, order, store, customer }` | New delivery assigned |
| `delivery:cancelled` | `{ assignmentId, reason }` | Assignment cancelled by admin |
| `order:status-update` | `{ orderId, status }` | Order status changed by store |

### Socket Events (Agent Sends)
| Event | Data | Description |
|-------|------|-------------|
| `delivery:location-update` | `{ lat, lng }` | Agent's current location |

---

## 8. Background Location Service

| # | Feature | Description |
|---|---------|-------------|
| 8.1 | Continuous Location Updates | Send GPS coordinates to server every 30 seconds while online. |
| 8.2 | Battery Optimization | Reduce update frequency when stationary. |
| 8.3 | Foreground Service | Keep location updates running when app is in background. |

### Implementation Notes
- Use `expo-location` with `watchPositionAsync` for continuous updates.
- Send location via Socket.io `delivery:location-update` event.
- Only send updates when agent status is `ACTIVE` or `ON_DELIVERY`.
- Stop updates when agent goes `OFF_DUTY`.

---

## 9. Navigation Helper

| # | Feature | Description |
|---|---------|-------------|
| 9.1 | Open in Maps | Launch Google Maps / Waze with destination coordinates. |
| 9.2 | Distance Display | Show distance to pickup/drop from current location. |
| 9.3 | ETA Display | Show estimated time of arrival based on distance. |

### Navigation Data
- Pickup: Store lat/lng from `Store` model
- Drop: Customer address lat/lng from `Address` model
- Use `Linking.openURL` to open external maps app

---

## 10. App-Level Requirements

### 10.1 Technical
- **Platform**: React Native (Expo)
- **Framework**: Expo SDK 52, Expo Router (file-based routing)
- **State Management**: Zustand
- **HTTP Client**: Axios with interceptors for auth token refresh
- **WebSocket**: Socket.io client for real-time updates
- **Local Storage**: expo-secure-store for tokens
- **Maps**: react-native-maps for delivery tracking view
- **Location**: expo-location for GPS tracking

### 10.2 Screens (Minimum Viable)
1. **Splash** — App loading screen
2. **OTP Login** — Phone-based authentication
3. **Dashboard** — Today's stats, active delivery, go online/offline
4. **Delivery Queue** — Pending assignments with accept/decline
5. **Active Delivery** — Map, status updates, navigation, call customer
6. **Earnings** — Daily/weekly/monthly earnings, delivery history
7. **Profile** — Agent info, vehicle, rating, settings
8. **Delivery Detail** — Full details of a completed/active delivery

### 10.3 UX Requirements
- **Online/Offline Toggle**: Prominent toggle on dashboard, with status indicator
- **Push Notifications**: Alert for new assignments even when app is backgrounded
- **One-Tap Status Update**: Quick buttons for status transitions
- **Navigation Integration**: One-tap to open Google Maps with destination
- **Pull-to-Refresh**: On delivery queue and activity lists
- **Haptic Feedback**: On status updates and new assignments
- **Loading States**: Skeleton screens for lists
- **Empty States**: Meaningful states when no deliveries are assigned
- **Error Handling**: Retry buttons, network error messages

### 10.4 Security
- Store JWT tokens in Secure Storage (Keychain/Keystore)
- Certificate pinning for API calls
- Clear sensitive data on logout

---

## 11. Backend Configuration

### Environment Variables
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
```

### API Base URLs
- **Development**: `http://localhost:4000/api/v1`
- **Production**: TBD

---

## 12. Priority Roadmap

### Phase 1 — Core (MVP)
- [ ] OTP-based login
- [ ] Agent dashboard (today's stats, online toggle)
- [ ] Delivery queue (pending assignments, accept/decline)
- [ ] Active delivery screen (status updates, navigation)
- [ ] Basic profile

### Phase 2 — Enhanced
- [ ] Background location service (continuous GPS updates)
- [ ] Push notifications (FCM/APNs for new assignments)
- [ ] Earnings dashboard with history
- [ ] Proof of delivery (photo upload)
- [ ] External navigation integration (Google Maps/Waze)

### Phase 3 — Advanced
- [ ] Daily/weekly/monthly analytics
- [ ] Performance metrics (acceptance rate, on-time delivery)
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Biometric login

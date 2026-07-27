# Booking System Architecture & Lifecycle

This document outlines the architectural flow, state management, and interaction model for the booking module within the Kambata Travel ecosystem. It is designed to demonstrate industry-grade standards, RESTful API principles, and robust concurrency handling.

---

## 1. Booking State Machine & Lifecycle

The lifecycle of a single booking is governed by strict state transitions enforced by the backend (`BookingController`).

### **State Transitions**
1. **`pending`**: Initial state upon creation. The traveler has requested a slot, but the guide has not yet approved it.
2. **`waitlisted`**: Assigned if the requested slot exceeds current capacity. Automatically transitions to `invited` or `confirmed` if slots open up via cancellations.
3. **`confirmed`**: The local guide has accepted the request. The traveler's payment window (e.g., 30 minutes) initiates.
4. **`rejected`**: The local guide has declined the request. Any held capacity is instantly released back to the schedule pool.
5. **`cancelled`**: The traveler has cancelled their confirmed or pending request. Soft-deleted via `PATCH /api/bookings/:id/status` to maintain audit history.

---

## 2. API Design & REST Principles

All status mutations are unified under a single, highly cohesive REST endpoint to enforce strict validation and dynamic Role-Based Access Control (RBAC).

**Endpoint**: `PATCH /api/bookings/:id/status`
**Payload**: `{ "status": "<new_status>" }`
**Response Format**: `{ "success": true, "message": "...", "data": { ...booking } }`

### **Dynamic Role-Based Access Control (RBAC)**
The backend dynamically authorizes the request based on the intended status:
- **Cancellations (`status: "cancelled"`)**: Only authorized for the `Explorer` who created the booking, or system Admins.
- **Approvals/Rejections (`status: "confirmed" | "rejected"`)**: Only authorized for the specific `Guide` assigned to that exact schedule, or system Admins.

### **Concurrency & Data Integrity**
- **Atomic Operations**: Capacity decrement operations are handled using atomic `$inc` operators (`updateRemainingSlots`) to prevent race conditions during high-traffic booking windows.
- **Idempotency Checks**: The backend verifies `oldStatus === newStatus` and blocks duplicate transitions (e.g., preventing a guide from accepting an already cancelled booking).
- **Audit Trails**: Every status transition automatically captures the `updatedBy` ID (the actor who triggered the change) and logs the event for administrative auditing.

---

## 3. Frontend Architecture: Optimistic UI & Resilience

Both the Explorer and Guide dashboards are engineered for high perceived performance while maintaining strict data consistency.

### **Optimistic UI Updates**
When a user executes a state change (e.g., Guide clicks "Accept Booking"):
1. The UI instantly transitions to the new state locally, delivering immediate sub-millisecond feedback.
2. An asynchronous network request is fired to `PATCH /api/bookings/:id/status`.
3. **Rollback Mechanism**: If the server responds with an error (e.g., due to a concurrent cancellation), the `catch` block intercepts the failure, reverts the local state array to its original form, and surfaces a detailed toast notification to the user.

### **UX Enhancements**
- **Destructive Action Guards**: Destructive mutations (like cancellations) trigger a modern, animated React Modal (using Framer Motion) rather than generic browser dialogs.
- **State Locks**: Action buttons are disabled and render a `Loader2` spinner during in-flight network requests, preventing duplicate submissions.

---

## 4. End-to-End User Flow Example

1. **Discovery**: Explorer views `GET /api/tours` and selects a specific date/time schedule from the `tour.schedules` array.
2. **Commitment**: Explorer submits `POST /api/bookings`. The system creates a `pending` booking.
3. **Notification**: The system dispatches a real-time notification to the Guide associated with that schedule.
4. **Resolution**: The Guide reviews the request in their dashboard and clicks Accept.
5. **Finalization**: `PATCH /api/bookings/:id/status` (`status: "confirmed"`) fires. Capacity is atomically reduced, and an approval notification is dispatched back to the Explorer to initiate payment.

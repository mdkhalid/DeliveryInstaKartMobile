import { create } from 'zustand';
import { deliveryAPI } from '@/lib/api';
import { DeliveryAssignment, DeliveryActivity, DeliveryPerson, AssignmentStatus } from '@/types';

interface AgentState {
  profile: DeliveryPerson | null;
  assignments: DeliveryAssignment[];
  activeAssignment: DeliveryAssignment | null;
  activity: DeliveryActivity[];
  stats: {
    todayAssigned: number;
    todayCompleted: number;
    todayFailed: number;
    todayEarnings: number;
    todayDistance: number;
    totalDeliveries: number;
    totalEarnings: number;
    rating: number;
  } | null;
  isOnline: boolean;
  isLoading: boolean;

  fetchProfile: () => Promise<void>;
  fetchAssignments: (status?: string) => Promise<void>;
  fetchActivity: (days?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  updateAssignmentStatus: (assignmentId: string, status: AssignmentStatus, notes?: string) => Promise<void>;
  toggleOnline: () => Promise<void>;
  setActiveAssignment: (assignment: DeliveryAssignment | null) => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  profile: null,
  assignments: [],
  activeAssignment: null,
  activity: [],
  stats: null,
  isOnline: false,
  isLoading: false,

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const { data } = await deliveryAPI.getMyProfile();
      const profile = data.data;
      set({
        profile,
        isOnline: profile.status === 'ACTIVE' || profile.status === 'ON_DELIVERY',
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchAssignments: async (status) => {
    set({ isLoading: true });
    try {
      const { data } = await deliveryAPI.getMyAssignments(status ? { status } : undefined);
      const assignments = data.data || [];
      const active = assignments.find(
        (a: DeliveryAssignment) => a.status === 'ASSIGNED' || a.status === 'PICKED_UP' || a.status === 'IN_TRANSIT'
      );
      set({ assignments, activeAssignment: active || null, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchActivity: async (days = 7) => {
    try {
      const { data } = await deliveryAPI.getMyActivity(days);
      set({ activity: data.data || [] });
    } catch { /* silent */ }
  },

  fetchStats: async () => {
    try {
      const { data } = await deliveryAPI.getMyStats();
      set({ stats: data.data });
    } catch { /* silent */ }
  },

  updateAssignmentStatus: async (assignmentId, status, notes) => {
    set({ isLoading: true });
    try {
      await deliveryAPI.updateAssignmentStatus(assignmentId, status, notes);
      await get().fetchAssignments();
      await get().fetchStats();
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  toggleOnline: async () => {
    const newStatus = get().isOnline ? 'OFF_DUTY' : 'ACTIVE';
    set({ isLoading: true });
    try {
      await deliveryAPI.toggleStatus(newStatus);
      set({ isOnline: newStatus === 'ACTIVE', isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  setActiveAssignment: (assignment) => set({ activeAssignment: assignment }),
}));

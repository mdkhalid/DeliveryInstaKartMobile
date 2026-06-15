import { io, Socket } from 'socket.io-client';
import ENV from '@/constants/config';
import { getAccessToken } from './storage';

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await getAccessToken();

  socket = io(ENV.SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ─── Event Helpers ───
export function onOrderUpdate(callback: (data: Record<string, unknown>) => void): () => void {
  socket?.on('order:status-update', callback);
  return () => { socket?.off('order:status-update', callback); };
}

export function onDeliveryAssigned(callback: (data: Record<string, unknown>) => void): () => void {
  socket?.on('delivery:assigned', callback);
  return () => { socket?.off('delivery:assigned', callback); };
}

export function onDeliveryLocationUpdate(callback: (data: Record<string, unknown>) => void): () => void {
  socket?.on('delivery:location-update', callback);
  return () => { socket?.off('delivery:location-update', callback); };
}

export function onNewOrder(callback: (data: Record<string, unknown>) => void): () => void {
  socket?.on('order:new', callback);
  return () => { socket?.off('order:new', callback); };
}

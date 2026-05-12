/**
 * Browser-only Socket.IO singleton — connects to the B3 backend (port 5000).
 * B3 backend is the only connection point; B2 is never called from the browser.
 */
import { io, type Socket } from "socket.io-client";

export interface TrafficMetric {
  cameraId: string;
  windowStart: string | null;
  windowEnd: string | null;
  laneId: number | null;
  vehicleCount: number;
  countsByClass: Record<string, number>;
  averageSpeedKmh: number;
  stoppedRatio: number;
  queueLength: number;
  congestionLevel: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
  congestionScore: number;
  stale: boolean;
}

export interface TrafficAlert {
  id: string;
  type: string;
  severity: "informational" | "warning" | "critical" | "emergency";
  cameraId: string;
  title: string;
  description: string;
  status: string;
  timestamp: string;
  details: {
    averageSpeedKmh: number;
    queueLength: number;
    stoppedRatio: number;
    congestionLevel: string;
  };
}

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket) {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
    _socket = io(url, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return _socket;
}

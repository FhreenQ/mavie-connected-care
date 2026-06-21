import { io, Socket } from "socket.io-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

export function connectEmergencyRealtime(token: string): Socket {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is missing. Add it to mavie-nurse-mobile/.env.");
  }

  return io(API_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
  });
}

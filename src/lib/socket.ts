/**
 * Socket.io server + Redis pub/sub for StanceStream real-time debates.
 * Use this alongside the Next.js API route to broadcast stance updates.
 */
import { Server as SocketServer } from "socket.io";
import { createClient } from "ioredis";

let io: SocketServer | undefined;

const publisher = createClient({ url: process.env.REDIS_URL });
const subscriber = createClient({ url: process.env.REDIS_URL });

export function getSocketServer(httpServer?: any): SocketServer {
  if (!io) {
    if (!httpServer) throw new Error("httpServer required for initial setup");
    io = new SocketServer(httpServer, {
      cors: { origin: process.env.NEXT_PUBLIC_APP_URL, credentials: true },
      path: "/api/socket",
    });

    io.on("connection", (socket) => {
      // Join a debate room
      socket.on("join:debate", (debateId: string) => {
        socket.join(`debate:${debateId}`);
      });

      // Cast a stance vote
      socket.on(
        "stance:vote",
        async (data: {
          debateId: string;
          stance: "for" | "against" | "neutral";
          userId: string;
        }) => {
          await publisher.publish(
            `stance:${data.debateId}`,
            JSON.stringify(data),
          );
        },
      );

      socket.on("disconnect", () => {
        // cleanup handled by socket rooms
      });
    });

    // Subscribe to Redis stance events and broadcast to room
    subscriber.psubscribe("stance:*", (err) => {
      if (err) console.error("Redis subscribe error:", err);
    });

    subscriber.on("pmessage", (_pattern, channel, message) => {
      const debateId = channel.replace("stance:", "");
      const data = JSON.parse(message);
      io?.to(`debate:${debateId}`).emit("stance:update", data);
    });
  }
  return io;
}

export type DebateStance = "for" | "against" | "neutral";

export interface StanceUpdate {
  debateId: string;
  stance: DebateStance;
  userId: string;
  timestamp: number;
}

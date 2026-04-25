import type { Express } from "express";
import type { Server as HTTPServer } from "http";

export interface WebSocketMessage {
  type: "notification" | "update" | "error" | "success";
  title: string;
  content: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

// Store connected clients
const connectedClients = new Map<string, Set<unknown>>();

/**
 * Initialize WebSocket server
 * Note: In production, use socket.io or ws npm package
 */
export function initializeWebSocket(_server: HTTPServer): void {
  // TODO: Implement with socket.io
  // import { Server as SocketIOServer } from 'socket.io';
  // const io = new SocketIOServer(server, {
  //   cors: { origin: '*' }
  // });
  //
  // io.on('connection', (socket) => {
  //   const userId = socket.handshake.auth.userId;
  //   if (!connectedClients.has(userId)) {
  //     connectedClients.set(userId, new Set());
  //   }
  //   connectedClients.get(userId)!.add(socket);
  //
  //   socket.on('disconnect', () => {
  //     connectedClients.get(userId)?.delete(socket);
  //   });
  // });

  console.log("[WebSocket] Initialized (placeholder)");
}

/**
 * Send notification to user via WebSocket
 */
export function sendNotificationToUser(userId: number, message: WebSocketMessage): void {
  const clients = connectedClients.get(String(userId));
  if (!clients) {
    console.log(`[WebSocket] No connected clients for user ${userId}`);
    return;
  }

  const payload = JSON.stringify(message);
  clients.forEach((client) => {
    try {
      // client.send(payload);
      console.log(`[WebSocket] Would send to user ${userId}:`, message);
    } catch (error) {
      console.error(`[WebSocket] Error sending message:`, error);
    }
  });
}

/**
 * Broadcast notification to all users
 */
export function broadcastNotification(message: WebSocketMessage): void {
  connectedClients.forEach((clients, userId) => {
    clients.forEach((client) => {
      try {
        // client.send(JSON.stringify(message));
        console.log(`[WebSocket] Would broadcast to user ${userId}:`, message);
      } catch (error) {
        console.error(`[WebSocket] Error broadcasting:`, error);
      }
    });
  });
}

/**
 * Send stage completion notification
 */
export function notifyStageCompletion(userId: number, stageName: string, workflowName: string): void {
  sendNotificationToUser(userId, {
    type: "success",
    title: `${workflowName} - 阶段完成`,
    content: `阶段 "${stageName}" 已成功完成`,
    data: { stageName, workflowName },
    timestamp: Date.now(),
  });
}

/**
 * Send approval needed notification
 */
export function notifyApprovalNeeded(userId: number, stageName: string, workflowName: string): void {
  sendNotificationToUser(userId, {
    type: "notification",
    title: `${workflowName} - 需要审批`,
    content: `阶段 "${stageName}" 需要您的审批`,
    data: { stageName, workflowName },
    timestamp: Date.now(),
  });
}

/**
 * Send bug assigned notification
 */
export function notifyBugAssigned(
  userId: number,
  bugId: number,
  bugTitle: string,
  severity: string
): void {
  sendNotificationToUser(userId, {
    type: "notification",
    title: `新缺陷分配 - #${bugId}`,
    content: `缺陷 "${bugTitle}" (${severity}) 已分配给您`,
    data: { bugId, bugTitle, severity },
    timestamp: Date.now(),
  });
}

/**
 * Send dispute escalation notification
 */
export function notifyDisputeEscalation(userId: number, disputeId: number, description: string): void {
  sendNotificationToUser(userId, {
    type: "notification",
    title: `争议升级 - #${disputeId}`,
    content: `争议 "${description}" 已升级至您进行仲裁`,
    data: { disputeId, description },
    timestamp: Date.now(),
  });
}

/**
 * Send error notification
 */
export function notifyError(userId: number, title: string, error: string): void {
  sendNotificationToUser(userId, {
    type: "error",
    title,
    content: error,
    timestamp: Date.now(),
  });
}

/**
 * Send update notification
 */
export function notifyUpdate(userId: number, title: string, content: string, data?: Record<string, unknown>): void {
  sendNotificationToUser(userId, {
    type: "update",
    title,
    content,
    data,
    timestamp: Date.now(),
  });
}

/**
 * LangGraph Debate Streaming API Route
 *
 * Provides Server-Sent Events streaming for LangGraph-orchestrated debates.
 */

import {
  Router,
  type Request,
  type Response,
  type Router as RouterType,
} from "express";
import {
  orchestrator,
  type DebateConfig,
  type DebateMessage,
  type RoundSummary,
  type StanceState,
} from "../../lib/graph/index.js";
import { getLangfuse, flushLangfuse } from "../utils/langfuse.js";

const router: RouterType = Router();

// Active SSE connections for each debate
const activeConnections = new Map<string, Set<Response>>();

// Param types for routes
interface DebateParams {
  debateId: string;
}

/**
 * Stream a debate via Server-Sent Events
 * GET /api/debate/langgraph/stream/:debateId
 */
router.get("/stream/:debateId", (req: Request<DebateParams>, res: Response) => {
  const debateId = req.params.debateId;

  // Check if debate is running
  if (!orchestrator.isRunning(debateId)) {
    res.status(404).json({
      success: false,
      error: "Debate not found or not running",
      debateId,
    });
    return;
  }

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

  // Add connection to tracking
  if (!activeConnections.has(debateId)) {
    activeConnections.set(debateId, new Set());
  }
  activeConnections.get(debateId)?.add(res);

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ debateId })}\n\n`);

  // Clean up on disconnect
  req.on("close", () => {
    activeConnections.get(debateId)?.delete(res);
    if (activeConnections.get(debateId)?.size === 0) {
      activeConnections.delete(debateId);
    }
  });
});

/**
 * Broadcast a message to all connected clients for a debate
 */
function broadcastToDebate(
  debateId: string,
  event: string,
  data: unknown,
): void {
  const connections = activeConnections.get(debateId);
  if (!connections) return;

  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const res of connections) {
    try {
      res.write(message);
    } catch (error) {
      // Connection closed, remove it
      connections.delete(res);
    }
  }
}

/**
 * Start a new LangGraph debate
 * POST /api/debate/langgraph/start
 */
router.post("/start", async (req: Request, res: Response) => {
  const {
    debateId = `lg_debate_${Date.now()}`,
    topic,
    proPosition,
    conPosition,
    rounds = 3,
  } = req.body as {
    debateId?: string;
    topic?: string;
    proPosition?: string;
    conPosition?: string;
    rounds?: number;
  };

  // Validate required fields
  if (!topic) {
    res.status(400).json({
      success: false,
      error: "Topic is required",
    });
    return;
  }

  // Default positions if not provided
  const finalProPosition = proPosition || `In favor of: ${topic}`;
  const finalConPosition = conPosition || `Against: ${topic}`;

  // Check if debate already running
  if (orchestrator.isRunning(debateId)) {
    res.status(409).json({
      success: false,
      error: "Debate is already running",
      debateId,
    });
    return;
  }

  // Validate rounds
  if (rounds < 1 || rounds > 10) {
    res.status(400).json({
      success: false,
      error: "Rounds must be between 1 and 10",
    });
    return;
  }

  console.log(`[LangGraph] Starting debate: ${debateId}`);
  console.log(`[LangGraph] Topic: ${topic}`);
  console.log(`[LangGraph] Rounds: ${rounds}`);

  // Send immediate response that debate is starting
  res.json({
    success: true,
    debateId,
    topic,
    proPosition: finalProPosition,
    conPosition: finalConPosition,
    rounds,
    message: "Debate starting",
    streamUrl: `/api/debate/langgraph/stream/${debateId}`,
    timestamp: new Date().toISOString(),
  });

  // Start debate in background
  const config: DebateConfig = {
    debateId,
    topic,
    proPosition: finalProPosition,
    conPosition: finalConPosition,
    rounds,
  };

  orchestrator
    .start(config, {
      onMessage: (message: DebateMessage) => {
        broadcastToDebate(debateId, "message", {
          type: "debate_message",
          ...message,
        });
      },
      onRoundComplete: (summary: RoundSummary) => {
        broadcastToDebate(debateId, "round_complete", {
          type: "round_summary",
          ...summary,
        });
      },
      onComplete: (state: StanceState) => {
        broadcastToDebate(debateId, "complete", {
          type: "debate_complete",
          debateId,
          finalScores: state.scores,
          totalMessages: state.debateMessages.length,
          roundSummaries: state.roundSummaries,
        });

        // Close all connections for this debate
        const connections = activeConnections.get(debateId);
        if (connections) {
          for (const res of connections) {
            try {
              res.end();
            } catch {}
          }
          activeConnections.delete(debateId);
        }
      },
      onError: (error: Error) => {
        broadcastToDebate(debateId, "error", {
          type: "error",
          message: error.message,
        });
      },
    })
    .catch((error) => {
      console.error(`[LangGraph] Debate error: ${debateId}`, error);
      broadcastToDebate(debateId, "error", {
        type: "error",
        message: error.message,
      });
    });
});

/**
 * Stop a running LangGraph debate
 * POST /api/debate/langgraph/stop/:debateId
 */
router.post("/stop/:debateId", (req: Request<DebateParams>, res: Response) => {
  const debateId = req.params.debateId;

  if (!orchestrator.isRunning(debateId)) {
    res.status(404).json({
      success: false,
      error: "Debate not found or not running",
      debateId,
    });
    return;
  }

  const cancelled = orchestrator.cancel(debateId);

  // Notify connected clients
  broadcastToDebate(debateId, "cancelled", {
    type: "debate_cancelled",
    debateId,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: cancelled,
    debateId,
    message: cancelled ? "Debate cancelled" : "Failed to cancel debate",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get status of LangGraph debates
 * GET /api/debate/langgraph/status
 */
router.get("/status", (_req: Request, res: Response) => {
  const activeDebateIds = orchestrator.getActiveDebateIds();
  const connectionCounts: Record<string, number> = {};

  for (const [debateId, connections] of activeConnections) {
    connectionCounts[debateId] = connections.size;
  }

  res.json({
    success: true,
    activeDebates: activeDebateIds.length,
    debates: activeDebateIds.map((id) => ({
      debateId: id,
      connections: connectionCounts[id] || 0,
    })),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Run a complete debate and return all messages (non-streaming)
 * POST /api/debate/langgraph/run
 */
router.post("/run", async (req: Request, res: Response) => {
  const {
    debateId = `lg_debate_${Date.now()}`,
    topic,
    proPosition,
    conPosition,
    rounds = 3,
  } = req.body as {
    debateId?: string;
    topic?: string;
    proPosition?: string;
    conPosition?: string;
    rounds?: number;
  };

  if (!topic) {
    res.status(400).json({
      success: false,
      error: "Topic is required",
    });
    return;
  }

  const finalProPosition = proPosition || `In favor of: ${topic}`;
  const finalConPosition = conPosition || `Against: ${topic}`;

  if (rounds < 1 || rounds > 10) {
    res.status(400).json({
      success: false,
      error: "Rounds must be between 1 and 10",
    });
    return;
  }

  console.log(`[LangGraph] Running complete debate: ${debateId}`);

  try {
    const config: DebateConfig = {
      debateId,
      topic,
      proPosition: finalProPosition,
      conPosition: finalConPosition,
      rounds,
    };

    const state = await orchestrator.start(config);

    res.json({
      success: true,
      debateId,
      topic,
      proPosition: finalProPosition,
      conPosition: finalConPosition,
      rounds,
      finalScores: state.scores,
      winner:
        state.scores.pro > state.scores.con
          ? "pro"
          : state.scores.con > state.scores.pro
            ? "con"
            : "tie",
      messages: state.debateMessages,
      roundSummaries: state.roundSummaries,
      totalMessages: state.debateMessages.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[LangGraph] Debate error: ${debateId}`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      debateId,
    });
  }
});

export default router;

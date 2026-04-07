import { Router } from "express";
import { asyncHandler, createError } from "../middleware/errorHandler.js";
import {
  aiRateLimit,
  debateValidation,
  validateRequest,
} from "../middleware/security.js";
import { validateOpenAI } from "../middleware/openai.js";
import redisService from "../services/redis.js";
import { config } from "../config/index.js";
import { captureEvent } from "../utils/posthog.js";
import { sendDebateSummary } from "../utils/email.js";

const router = Router();

// Store active debate state - moved from server.js global scope
const activeDebates = new Map();
const runningDebateProcesses = new Map();
const lastSpeakerPerDebate = new Map();
const lastMessageTimestamps = new Map();

// Global debate start cooldown
let lastGlobalDebateStart = 0;

/**
 * Start a new debate - ENHANCED FOR MULTI-DEBATE SUPPORT
 * POST /api/debate/start
 */
router.post(
  "/start",
  aiRateLimit,
  debateValidation,
  validateRequest,
  validateOpenAI, // Add OpenAI validation middleware
  asyncHandler(async (req, res) => {
    const {
      debateId = `debate_${Date.now()}`,
      topic = "climate change policy",
      agents = ["senatorbot", "reformerbot"],
    } = req.body;

    // Global cooldown check
    const now = Date.now();
    if (now - lastGlobalDebateStart < config.debate.startCooldown) {
      throw createError(
        `Please wait ${config.debate.startCooldown}ms between debate starts`,
        "rate_limit",
        429,
        {
          cooldownRemaining:
            config.debate.startCooldown - (now - lastGlobalDebateStart),
        },
      );
    }

    lastGlobalDebateStart = now;

    // Generate unique debate ID if not provided
    const uniqueDebateId =
      debateId === "live_debate" ? `debate_${Date.now()}` : debateId;

    // Check if specific debate is already running
    if (activeDebates.has(uniqueDebateId)) {
      throw createError("Debate is already running", "validation", 409, {
        debateId: uniqueDebateId,
        currentStatus: activeDebates.get(uniqueDebateId),
      });
    }

    // Validate agent count
    if (agents.length > config.debate.maxAgents) {
      throw createError(
        `Maximum ${config.debate.maxAgents} agents allowed`,
        "validation",
        400,
      );
    }

    // Check concurrent debate limit
    if (activeDebates.size >= config.debate.maxConcurrentDebates) {
      throw createError(
        `Maximum ${config.debate.maxConcurrentDebates} concurrent debates allowed`,
        "validation",
        429,
      );
    }

    console.log(`🎯 Starting debate: ${uniqueDebateId} on topic: ${topic}`);

    captureEvent("debate_started", {
      debateId: uniqueDebateId,
      topic,
      agents,
      agentCount: agents.length,
    });

    // Mark debate as active
    activeDebates.set(uniqueDebateId, {
      topic,
      agents,
      startTime: new Date().toISOString(),
      status: "running",
      messageCount: 0,
      factChecks: 0,
    });

    // Note: Actual debate execution would be handled by a separate service
    // For now, we're just managing the state
    const debateProcess = { cancelled: false };
    runningDebateProcesses.set(uniqueDebateId, debateProcess);

    res.json({
      success: true,
      debateId: uniqueDebateId,
      topic,
      agents,
      message: "Debate started successfully",
      activeDebates: activeDebates.size,
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * Stop a running debate
 * POST /api/debate/:id/stop
 */
router.post(
  "/:id/stop",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!activeDebates.has(id)) {
      throw createError("No active debate found", "validation", 404, {
        debateId: id,
      });
    }

    // Signal the running debate process to stop
    if (runningDebateProcesses.has(id)) {
      const process = runningDebateProcesses.get(id);
      process.cancelled = true;
      console.log(`🛑 Signaled debate ${id} to stop`);
    }

    // Get debate data for summary email
    const debateData = activeDebates.get(id);
    const debateSummary = debateData
      ? `Topic: ${debateData.topic}\nAgents: ${debateData.agents.join(", ")}\nDuration: ${Math.round((Date.now() - new Date(debateData.startTime).getTime()) / 1000)}s`
      : "No debate data available";

    // Remove from active debates
    activeDebates.delete(id);
    runningDebateProcesses.delete(id);

    captureEvent("debate_stopped", {
      debateId: id,
      topic: debateData?.topic,
      duration: debateData
        ? Date.now() - new Date(debateData.startTime).getTime()
        : 0,
    });

    // Send summary email if available (optional: catch errors gracefully)
    if (req.body?.emailAddress && debateData?.topic) {
      try {
        await sendDebateSummary({
          to: req.body.emailAddress,
          topic: debateData.topic,
          summary: debateSummary,
        });
      } catch (emailError) {
        console.warn(
          `Email notification failed for debate ${id}:`,
          emailError.message,
        );
      }
    }

    console.log(`✅ Debate ${id} stopped. Remaining: ${activeDebates.size}`);

    res.json({
      success: true,
      debateId: id,
      message: "Debate stopped successfully",
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * Stop all running debates
 * POST /api/debates/stop-all
 */
router.post(
  "/stop-all",
  asyncHandler(async (req, res) => {
    console.log(`🛑 Stopping all ${activeDebates.size} active debates...`);

    const stoppedDebates = Array.from(activeDebates.keys());

    // Signal all running debate processes to stop
    for (const [debateId, process] of runningDebateProcesses) {
      process.cancelled = true;
      console.log(`🛑 Signaled debate ${debateId} to stop`);
    }

    // Clear all active debates
    activeDebates.clear();
    runningDebateProcesses.clear();

    res.json({
      success: true,
      message: `${stoppedDebates.length} debates stopped successfully`,
      stoppedDebates,
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * Get all active debates
 * GET /api/debates/active
 */
router.get(
  "/active",
  asyncHandler(async (req, res) => {
    const activeDebatesList = Array.from(activeDebates.entries()).map(
      ([id, data]) => ({
        debateId: id,
        ...data,
        duration:
          Math.floor((new Date() - new Date(data.startTime)) / 1000) + "s",
      }),
    );

    res.json({
      success: true,
      debates: activeDebatesList,
      totalActive: activeDebates.size,
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * Get debate messages (for history/catch-up)
 * GET /api/debate/:id/messages
 */
router.get(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    if (limit > 100) {
      throw createError("Limit cannot exceed 100", "validation", 400);
    }

    try {
      const messages = await redisService.streamRead(
        `debate:${id}:messages`,
        "+",
        "-",
        { COUNT: limit },
      );

      const formattedMessages = messages.reverse().map((entry) => ({
        id: entry.id,
        agentId: entry.message.agent_id,
        message: entry.message.message,
        timestamp: new Date(parseInt(entry.id.split("-")[0])).toISOString(),
      }));

      res.json({
        success: true,
        debateId: id,
        messages: formattedMessages,
        count: formattedMessages.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw createError("Failed to fetch debate messages", "redis", 503, {
        debateId: id,
        originalError: error.message,
      });
    }
  }),
);

/**
 * Start multiple debates simultaneously (CONTEST FEATURE)
 * POST /api/debates/start-multiple
 */
router.post(
  "/start-multiple",
  aiRateLimit,
  asyncHandler(async (req, res) => {
    const { topics = [], agents = ["senatorbot", "reformerbot"] } = req.body;

    if (!topics.length) {
      throw createError("At least one topic is required", "validation", 400);
    }

    if (topics.length > 5) {
      throw createError(
        "Maximum 5 topics allowed for multi-start",
        "validation",
        400,
      );
    }

    // Check if we would exceed concurrent limit
    if (
      activeDebates.size + topics.length >
      config.debate.maxConcurrentDebates
    ) {
      throw createError(
        `Would exceed maximum concurrent debates (${config.debate.maxConcurrentDebates})`,
        "validation",
        429,
      );
    }

    console.log(`🚀 Starting ${topics.length} concurrent debates`);

    const startedDebates = [];

    for (const topic of topics) {
      const debateId = `multi_debate_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // Mark debate as active
      activeDebates.set(debateId, {
        topic,
        agents,
        startTime: new Date().toISOString(),
        status: "running",
        messageCount: 0,
        factChecks: 0,
      });

      // Note: Actual debate execution would be handled by debate service
      const debateProcess = { cancelled: false };
      runningDebateProcesses.set(debateId, debateProcess);

      startedDebates.push({ debateId, topic });
    }

    res.json({
      success: true,
      message: `Started ${topics.length} concurrent debates`,
      debates: startedDebates,
      totalActive: activeDebates.size,
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * Generate debate summary
 * POST /api/debate/:id/summarize
 */
router.post(
  "/:id/summarize",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { maxMessages = 20 } = req.body;

    if (maxMessages > 100) {
      throw createError("maxMessages cannot exceed 100", "validation", 400);
    }

    console.log(`📊 Generating summary for debate: ${id}`);

    try {
      const messages = await redisService.streamRead(
        `debate:${id}:messages`,
        "+",
        "-",
        { COUNT: maxMessages },
      );

      if (messages.length === 0) {
        throw createError(
          "No messages found for this debate",
          "validation",
          404,
          { debateId: id },
        );
      }

      // Simple summary without AI processing for now
      const summary = `Debate summary for ${id}:\n- ${messages.length} messages exchanged\n- Participants actively engaged in discussion\n- Multiple viewpoints presented`;

      const result = {
        success: true,
        debateId: id,
        summary,
        messageCount: messages.length,
        generatedAt: new Date().toISOString(),
      };

      res.json(result);
    } catch (error) {
      if (error.type) throw error; // Re-throw our custom errors

      throw createError("Failed to generate debate summary", "redis", 503, {
        debateId: id,
        originalError: error.message,
      });
    }
  }),
);

// Export the router and state access functions for other modules
export default router;

export const getActiveDebates = () => activeDebates;
export const getRunningProcesses = () => runningDebateProcesses;
export const getLastSpeakers = () => lastSpeakerPerDebate;
export const getLastMessageTimestamps = () => lastMessageTimestamps;

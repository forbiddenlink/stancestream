/**
 * LangGraph Debate Orchestrator
 *
 * JavaScript wrapper that integrates LangGraph multi-agent workflows
 * with the existing StanceStream server infrastructure.
 */

import "dotenv/config";
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import redisManager from "../../redisManager.js";
import { getLangfuse, flushLangfuse } from "../utils/langfuse.js";

// Lazy imports to avoid circular dependencies
let findClosestFact;
let sentimentAnalyzer;

// Agent system prompts
const AGENT_PROMPTS = {
  senatorbot: `You are SenatorBot, a moderate senator focused on fiscal responsibility and bipartisan compromise.
You emphasize pragmatic solutions, cost-benefit analysis, and finding middle ground.
Your tone should be measured and diplomatic. You represent traditional legislative approaches.`,

  reformerbot: `You are ReformerBot, a passionate progressive advocate for climate justice and rapid decarbonization.
You emphasize urgent action, moral imperatives, and transformative change.
Your tone should be energetic and conviction-driven. You push for bold reforms.`,
};

// Define the state schema using Annotation
const DebateStateAnnotation = Annotation.Root({
  // Core debate info
  debateId: Annotation(),
  topic: Annotation(),

  // Agents participating
  agents: Annotation(),
  agentProfiles: Annotation(),

  // Turn management
  currentAgentIndex: Annotation(),
  currentRound: Annotation(),
  totalRounds: Annotation(),

  // Message history - uses reducer to accumulate
  messages: Annotation({
    reducer: (current, update) => {
      if (!current) return update || [];
      if (!update) return current;
      return [...current, ...update];
    },
    default: () => [],
  }),

  // Agent states
  agentEmotionalStates: Annotation(),
  lastGeneratedMessage: Annotation(),

  // Control flags
  isComplete: Annotation(),
  cancelled: Annotation(),

  // Error handling
  errorCount: Annotation(),
});

/**
 * Determine emotional state based on recent conversation context
 */
function determineEmotionalState(agentId, recentMessages) {
  if (!recentMessages || recentMessages.length === 0) return "analytical";

  const lastFew = recentMessages.slice(-3);
  const context = lastFew.map((m) => m.message.toLowerCase()).join(" ");

  const frustrationWords = ["wrong", "ridiculous", "impossible", "failed"];
  const agreementWords = ["excellent", "agree", "correct", "right"];
  const challengingWords = ["however", "but", "disagree", "unfortunately"];

  if (frustrationWords.some((w) => context.includes(w))) {
    return agentId === "reformerbot" ? "passionate" : "concerned";
  }
  if (agreementWords.some((w) => context.includes(w))) {
    return "encouraged";
  }
  if (challengingWords.some((w) => context.includes(w))) {
    return "analytical";
  }

  return "neutral";
}

/**
 * Load agent profile from Redis
 */
async function loadAgentProfile(agentId) {
  try {
    const profile = await redisManager.execute(async (client) => {
      return await client.json.get(`agent:${agentId}:profile`);
    });
    return profile;
  } catch (error) {
    console.log(`Could not load profile for ${agentId}, using defaults`);
    return null;
  }
}

/**
 * Create LLM instance with optional LangSmith tracing
 * LangSmith is automatically enabled when:
 * - LANGCHAIN_TRACING_V2=true
 * - LANGCHAIN_API_KEY is set
 */
function createLLM(temperature = 0.7) {
  return new ChatOpenAI({
    modelName: "gpt-4",
    temperature,
    maxTokens: 200,
  });
}

/**
 * Node: Generate agent response
 */
async function generateAgentResponse(state) {
  const {
    agents,
    currentAgentIndex,
    topic,
    messages,
    agentProfiles,
    debateId,
  } = state;

  const agentId = agents[currentAgentIndex];
  const agentProfile = agentProfiles?.[agentId];
  const emotionalState = determineEmotionalState(agentId, messages);

  // Build context from recent messages
  const recentContext = messages
    .slice(-6)
    .map((m) => `${m.agentId}: ${m.message}`)
    .join("\n");

  // Get agent-specific system prompt
  const systemPrompt =
    AGENT_PROMPTS[agentId] || `You are ${agentId}, participating in a debate.`;

  // Build the full prompt
  const turnNumber = Math.floor(messages.length / agents.length) + 1;
  const stanceInfo = agentProfile?.stance
    ? Object.entries(agentProfile.stance)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    : "";

  const fullSystemPrompt = `${systemPrompt}

DEBATE CONTEXT:
- Topic: ${topic}
- Turn: ${turnNumber}
- Your current emotional state: ${emotionalState}
${stanceInfo ? `- Your stance positions: ${stanceInfo}` : ""}

RECENT CONVERSATION:
${recentContext || "(Opening statement)"}

INSTRUCTIONS:
- Keep your response concise (1-3 sentences)
- Stay in character and maintain your distinctive viewpoint
- Address points raised by other participants when relevant
- Do not repeat yourself or use generic statements
`;

  // Create LLM with appropriate temperature based on emotional state
  const temperature = emotionalState === "passionate" ? 0.9 : 0.7;
  const llm = createLLM(temperature);

  try {
    console.log(`Generating response for ${agentId} (turn ${turnNumber})...`);

    const langfuse = getLangfuse();
    const trace = langfuse?.trace({
      name: "debate-agent-generation",
      input: {
        debateId,
        agentId,
        topic,
        turnNumber,
        emotionalState,
      },
      metadata: {
        app: "stancestream",
        debate_type: "langgraph_orchestrated",
      },
    });

    const generation = trace?.generation({
      model: "gpt-4",
      modelParameters: {
        temperature: emotionalState === "passionate" ? 0.9 : 0.7,
        maxTokens: 200,
      },
      input: {
        systemPrompt: fullSystemPrompt,
        messages: 2,
      },
    });

    // Generate response
    const response = await llm.invoke([
      new SystemMessage(fullSystemPrompt),
      new HumanMessage(
        `Continue the debate on "${topic}". Generate your response as ${agentId}.`,
      ),
    ]);

    const responseText =
      typeof response.content === "string"
        ? response.content
        : response.content
            .map((c) =>
              typeof c === "string" ? c : c.type === "text" ? c.text : "",
            )
            .join("");

    // Lazy load dependencies to avoid circular imports
    if (!findClosestFact) {
      const factModule = await import("../../factChecker.js");
      findClosestFact = factModule.findClosestFact;
    }
    if (!sentimentAnalyzer) {
      const sentimentModule = await import("../../sentimentAnalysis.js");
      sentimentAnalyzer = sentimentModule.default;
    }

    // Run fact check and sentiment analysis in parallel
    const [factCheckResult, sentimentResult] = await Promise.all([
      findClosestFact(responseText).catch(() => ({
        content: null,
        score: 1.0,
      })),
      sentimentAnalyzer?.analyzeSentiment?.(responseText).catch(() => ({
        sentiment: "neutral",
        confidence: 0.5,
      })) || { sentiment: "neutral", confidence: 0.5 },
    ]);

    const newMessage = {
      agentId,
      message: responseText.trim(),
      timestamp: new Date().toISOString(),
      metadata: {
        emotionalState,
        cacheHit: false,
        turnNumber,
        factCheck: {
          fact: factCheckResult?.content || null,
          confidence: factCheckResult?.content
            ? Math.round((1 - factCheckResult.score) * 100)
            : 0,
        },
        sentiment: {
          sentiment: sentimentResult?.sentiment || "neutral",
          confidence: sentimentResult?.confidence || 0.5,
        },
      },
    };

    console.log(`Generated: "${responseText.substring(0, 50)}..."`);

    // End Langfuse generation span
    generation?.end({
      output: {
        text: responseText,
        textLength: responseText.length,
      },
      metadata: {
        emotionalState,
        factCheckConfidence: factCheckResult?.content
          ? Math.round((1 - factCheckResult.score) * 100)
          : 0,
        sentiment: sentimentResult?.sentiment,
      },
    });

    await flushLangfuse();

    return {
      messages: [newMessage],
      lastGeneratedMessage: newMessage,
      agentEmotionalStates: {
        ...(state.agentEmotionalStates || {}),
        [agentId]: emotionalState,
      },
    };
  } catch (error) {
    console.error(`Error generating response for ${agentId}:`, error.message);
    await flushLangfuse();
    return {
      errorCount: (state.errorCount || 0) + 1,
    };
  }
}

/**
 * Node: Store message to Redis
 */
async function storeMessage(state) {
  const { debateId, lastGeneratedMessage } = state;

  if (!lastGeneratedMessage) {
    return {};
  }

  try {
    // Store in Redis streams
    await redisManager.execute(async (client) => {
      const debateStreamKey = `debate:${debateId}:messages`;
      const memoryStreamKey = `debate:${debateId}:agent:${lastGeneratedMessage.agentId}:memory`;

      // Store in shared debate stream
      await client.xAdd(debateStreamKey, "*", {
        agent_id: lastGeneratedMessage.agentId,
        message: lastGeneratedMessage.message,
        timestamp: lastGeneratedMessage.timestamp,
        emotional_state:
          lastGeneratedMessage.metadata?.emotionalState || "neutral",
        fact_check_confidence: String(
          lastGeneratedMessage.metadata?.factCheck?.confidence || 0,
        ),
        sentiment:
          lastGeneratedMessage.metadata?.sentiment?.sentiment || "neutral",
      });

      // Store in agent memory stream
      await client.xAdd(memoryStreamKey, "*", {
        type: "debate_response",
        content: lastGeneratedMessage.message.substring(0, 200),
        emotional_state:
          lastGeneratedMessage.metadata?.emotionalState || "neutral",
      });
    });

    console.log(`Stored message from ${lastGeneratedMessage.agentId} to Redis`);
  } catch (error) {
    console.error("Error storing message to Redis:", error.message);
  }

  return {};
}

/**
 * Node: Advance to next turn
 */
function advanceTurn(state) {
  const { agents, currentAgentIndex, currentRound, totalRounds } = state;

  const nextAgentIndex = (currentAgentIndex + 1) % agents.length;
  const nextRound = nextAgentIndex === 0 ? currentRound + 1 : currentRound;
  const isComplete = nextRound > totalRounds;

  if (isComplete) {
    console.log(`Debate completing after ${totalRounds} rounds`);
  }

  return {
    currentAgentIndex: nextAgentIndex,
    currentRound: nextRound,
    isComplete,
  };
}

/**
 * Conditional: Check if debate should continue
 */
function shouldContinue(state) {
  if (state.cancelled) {
    console.log(`Debate ${state.debateId} was cancelled`);
    return "end";
  }
  if (state.isComplete) {
    console.log(`Debate ${state.debateId} completed`);
    return "end";
  }
  if ((state.errorCount || 0) > 5) {
    console.log(`Debate ${state.debateId} stopped due to too many errors`);
    return "end";
  }
  return "generate";
}

/**
 * Create the LangGraph debate workflow
 */
function createDebateGraph() {
  const graph = new StateGraph(DebateStateAnnotation)
    // Add nodes
    .addNode("generate", generateAgentResponse)
    .addNode("store", storeMessage)
    .addNode("advance", advanceTurn)

    // Add edges
    .addEdge(START, "generate")
    .addEdge("generate", "store")
    .addEdge("store", "advance")
    .addConditionalEdges("advance", shouldContinue, {
      generate: "generate",
      end: END,
    });

  return graph.compile();
}

/**
 * Create initial debate state
 */
async function createInitialState(config) {
  const { debateId, topic, agents, rounds } = config;

  // Load agent profiles from Redis
  const agentProfiles = {};
  for (const agentId of agents) {
    const profile = await loadAgentProfile(agentId);
    if (profile) {
      agentProfiles[agentId] = profile;
    }
  }

  return {
    debateId,
    topic,
    agents,
    agentProfiles,
    currentAgentIndex: 0,
    currentRound: 1,
    totalRounds: rounds,
    messages: [],
    agentEmotionalStates: {},
    lastGeneratedMessage: null,
    isComplete: false,
    cancelled: false,
    errorCount: 0,
  };
}

/**
 * Run a debate using LangGraph
 *
 * @param {Object} config - Debate configuration
 * @param {string} config.debateId - Unique debate identifier
 * @param {string} config.topic - Debate topic
 * @param {string[]} config.agents - Array of agent IDs
 * @param {number} config.rounds - Number of rounds
 * @param {Function} onMessage - Callback for each new message
 * @param {Object} debateProcess - Object with cancelled flag for abort control
 * @returns {Promise<Object[]>} Array of debate messages
 */
export async function runLangGraphDebate(config, onMessage, debateProcess) {
  const { debateId, topic, agents, rounds = 5 } = config;

  console.log(`Starting LangGraph debate: ${debateId} on "${topic}"`);
  console.log(`Agents: ${agents.join(", ")}, Rounds: ${rounds}`);

  const graph = createDebateGraph();
  const initialState = await createInitialState({
    debateId,
    topic,
    agents,
    rounds,
  });

  const allMessages = [];

  try {
    // Stream the graph execution
    const stream = await graph.stream(initialState, {
      // LangSmith tracing config (auto-enabled if env vars set)
      runName: `debate-${debateId}`,
      tags: ["debate", "stancestream", topic.replace(/\s+/g, "-")],
      metadata: {
        debateId,
        topic,
        agents,
        totalRounds: rounds,
      },
    });

    for await (const chunk of stream) {
      // Check for abort
      if (debateProcess?.cancelled) {
        console.log(`Debate ${debateId} aborted via debateProcess.cancelled`);
        break;
      }

      // Handle new messages from generate node
      if (chunk.generate?.messages) {
        for (const msg of chunk.generate.messages) {
          allMessages.push(msg);
          if (onMessage) {
            onMessage(msg);
          }
        }
      }

      // Also handle lastGeneratedMessage for single-message emission
      if (chunk.generate?.lastGeneratedMessage) {
        const msg = chunk.generate.lastGeneratedMessage;
        // Only add if not already added via messages array
        if (!allMessages.some((m) => m.timestamp === msg.timestamp)) {
          allMessages.push(msg);
          if (onMessage) {
            onMessage(msg);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Debate ${debateId} error:`, error.message);
    throw error;
  }

  console.log(
    `Debate ${debateId} completed with ${allMessages.length} messages`,
  );
  return allMessages;
}

/**
 * Create a debate orchestrator instance for server integration
 */
export function createDebateOrchestrator() {
  const activeGraphs = new Map();

  return {
    /**
     * Start a new debate using LangGraph
     */
    async startDebate(config, onMessage, debateProcess) {
      const { debateId } = config;

      // Store reference for cancellation
      activeGraphs.set(debateId, { cancelled: false });

      try {
        const messages = await runLangGraphDebate(
          config,
          onMessage,
          debateProcess || activeGraphs.get(debateId),
        );
        return messages;
      } finally {
        activeGraphs.delete(debateId);
      }
    },

    /**
     * Cancel a running debate
     */
    cancelDebate(debateId) {
      const graph = activeGraphs.get(debateId);
      if (graph) {
        graph.cancelled = true;
        console.log(`Cancellation requested for debate ${debateId}`);
        return true;
      }
      return false;
    },

    /**
     * Check if a debate is running
     */
    isDebateRunning(debateId) {
      return activeGraphs.has(debateId);
    },

    /**
     * Get count of active debates
     */
    getActiveCount() {
      return activeGraphs.size;
    },
  };
}

// Export default orchestrator instance
const orchestrator = createDebateOrchestrator();
export default orchestrator;

/**
 * LangGraph-based Multi-Agent Debate Orchestration
 *
 * Replaces custom orchestration in server.js with proper LangGraph workflows.
 * Supports observability via LangSmith when configured.
 */

import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, BaseMessage, SystemMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";

// Agent configuration types
interface AgentProfile {
  id: string;
  name: string;
  role: string;
  tone: string;
  biases: string[];
  stance: Record<string, number>;
}

interface DebateConfig {
  debateId: string;
  topic: string;
  agents: string[];
  rounds: number;
  redisClient?: any;
}

interface DebateMessage {
  agentId: string;
  message: string;
  timestamp: string;
  metadata?: {
    emotionalState?: string;
    cacheHit?: boolean;
    factCheck?: { fact: string | null; confidence: number };
    sentiment?: { sentiment: string; confidence: number };
  };
}

// Define the state annotation for the debate graph
const DebateStateAnnotation = Annotation.Root({
  // Core debate info
  debateId: Annotation<string>(),
  topic: Annotation<string>(),

  // Agents participating
  agents: Annotation<string[]>(),
  agentProfiles: Annotation<Record<string, AgentProfile>>(),

  // Turn management
  currentAgentIndex: Annotation<number>(),
  currentRound: Annotation<number>(),
  totalRounds: Annotation<number>(),

  // Message history
  messages: Annotation<DebateMessage[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Conversation context for LLM
  conversationHistory: Annotation<BaseMessage[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Agent states
  agentEmotionalStates: Annotation<Record<string, string>>(),
  agentStances: Annotation<Record<string, Record<string, number>>>(),

  // Control flags
  isComplete: Annotation<boolean>(),
  cancelled: Annotation<boolean>(),

  // Error handling
  errors: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
});

type DebateState = typeof DebateStateAnnotation.State;

// Agent system prompts
const AGENT_PROMPTS: Record<string, string> = {
  senatorbot: `You are SenatorBot, a moderate senator focused on fiscal responsibility and bipartisan compromise.
You emphasize pragmatic solutions, cost-benefit analysis, and finding middle ground.
Your tone should be measured and diplomatic. You represent traditional legislative approaches.`,

  reformerbot: `You are ReformerBot, a passionate progressive advocate for climate justice and rapid decarbonization.
You emphasize urgent action, moral imperatives, and transformative change.
Your tone should be energetic and conviction-driven. You push for bold reforms.`,
};

// Helper to get emotional state based on context
function determineEmotionalState(
  agentId: string,
  recentMessages: DebateMessage[]
): string {
  if (recentMessages.length === 0) return "analytical";

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

// Create LLM instance with optional LangSmith tracing
function createLLM(temperature = 0.7): ChatOpenAI {
  return new ChatOpenAI({
    modelName: "gpt-4",
    temperature,
    // LangSmith tracing is automatically enabled when LANGCHAIN_TRACING_V2=true
    // and LANGCHAIN_API_KEY is set in environment
  });
}

// Node: Generate agent response
async function generateAgentResponse(
  state: DebateState,
  config?: RunnableConfig
): Promise<Partial<DebateState>> {
  const { agents, currentAgentIndex, topic, messages, conversationHistory, agentProfiles } = state;

  const agentId = agents[currentAgentIndex];
  const agentProfile = agentProfiles[agentId];
  const emotionalState = determineEmotionalState(agentId, messages);

  // Build context from recent messages
  const recentContext = messages
    .slice(-6)
    .map((m) => `${m.agentId}: ${m.message}`)
    .join("\n");

  // Get agent-specific system prompt
  const systemPrompt = AGENT_PROMPTS[agentId] || `You are ${agentId}, participating in a debate.`;

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
- Your stance positions: ${stanceInfo}

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
    // Generate response
    const response = await llm.invoke([
      new SystemMessage(fullSystemPrompt),
      ...conversationHistory.slice(-10), // Last 10 messages for context
      new HumanMessage(`Continue the debate on "${topic}". Generate your response as ${agentId}.`),
    ], config);

    const responseText = typeof response.content === "string"
      ? response.content
      : response.content.map(c => typeof c === "string" ? c : c.type === "text" ? c.text : "").join("");

    const newMessage: DebateMessage = {
      agentId,
      message: responseText.trim(),
      timestamp: new Date().toISOString(),
      metadata: {
        emotionalState,
        cacheHit: false,
      },
    };

    const aiMessage = new AIMessage({
      content: responseText.trim(),
      name: agentId,
    });

    return {
      messages: [newMessage],
      conversationHistory: [aiMessage],
      agentEmotionalStates: {
        ...state.agentEmotionalStates,
        [agentId]: emotionalState,
      },
    };
  } catch (error: any) {
    console.error(`Error generating response for ${agentId}:`, error.message);
    return {
      errors: [`Failed to generate response for ${agentId}: ${error.message}`],
    };
  }
}

// Node: Advance to next turn
function advanceTurn(state: DebateState): Partial<DebateState> {
  const { agents, currentAgentIndex, currentRound, totalRounds, messages } = state;

  const nextAgentIndex = (currentAgentIndex + 1) % agents.length;
  const nextRound = nextAgentIndex === 0 ? currentRound + 1 : currentRound;
  const isComplete = nextRound > totalRounds;

  return {
    currentAgentIndex: nextAgentIndex,
    currentRound: nextRound,
    isComplete,
  };
}

// Node: Check if debate should continue
function shouldContinue(state: DebateState): "generate" | "end" {
  if (state.cancelled) {
    console.log(`Debate ${state.debateId} was cancelled`);
    return "end";
  }
  if (state.isComplete) {
    console.log(`Debate ${state.debateId} completed after ${state.totalRounds} rounds`);
    return "end";
  }
  if (state.errors.length > 5) {
    console.log(`Debate ${state.debateId} stopped due to too many errors`);
    return "end";
  }
  return "generate";
}

// Create the debate graph
export function createDebateGraph() {
  const graph = new StateGraph(DebateStateAnnotation)
    // Add nodes
    .addNode("generate", generateAgentResponse)
    .addNode("advance", advanceTurn)

    // Add edges
    .addEdge(START, "generate")
    .addEdge("generate", "advance")
    .addConditionalEdges("advance", shouldContinue, {
      generate: "generate",
      end: END,
    });

  return graph.compile();
}

// Initialize debate state
export function createInitialState(config: DebateConfig): DebateState {
  const agentProfiles: Record<string, AgentProfile> = {};
  const agentStances: Record<string, Record<string, number>> = {};

  for (const agentId of config.agents) {
    agentProfiles[agentId] = {
      id: agentId,
      name: agentId === "senatorbot" ? "SenatorBot" : "ReformerBot",
      role: agentId === "senatorbot" ? "Moderate Senator" : "Progressive Advocate",
      tone: agentId === "senatorbot" ? "diplomatic" : "passionate",
      biases: agentId === "senatorbot"
        ? ["fiscal responsibility", "bipartisan solutions"]
        : ["climate justice", "rapid change"],
      stance: {
        climate_policy: agentId === "senatorbot" ? 0.5 : 0.8,
        healthcare_policy: agentId === "senatorbot" ? 0.4 : 0.7,
      },
    };
    agentStances[agentId] = agentProfiles[agentId].stance;
  }

  return {
    debateId: config.debateId,
    topic: config.topic,
    agents: config.agents,
    agentProfiles,
    currentAgentIndex: 0,
    currentRound: 1,
    totalRounds: config.rounds,
    messages: [],
    conversationHistory: [],
    agentEmotionalStates: {},
    agentStances,
    isComplete: false,
    cancelled: false,
    errors: [],
  };
}

// Main execution function
export async function runDebate(
  config: DebateConfig,
  onMessage?: (message: DebateMessage) => void,
  abortSignal?: AbortSignal
): Promise<DebateMessage[]> {
  const graph = createDebateGraph();
  const initialState = createInitialState(config);

  console.log(`Starting LangGraph debate: ${config.debateId} on "${config.topic}"`);

  const allMessages: DebateMessage[] = [];

  try {
    // Stream the graph execution
    const stream = await graph.stream(initialState, {
      // LangSmith tracing config
      runName: `debate-${config.debateId}`,
      tags: ["debate", config.topic.replace(/\s+/g, "-")],
      metadata: {
        debateId: config.debateId,
        topic: config.topic,
        agents: config.agents,
        totalRounds: config.rounds,
      },
    });

    for await (const chunk of stream) {
      // Check for abort
      if (abortSignal?.aborted) {
        console.log(`Debate ${config.debateId} aborted`);
        break;
      }

      // Handle new messages
      if (chunk.generate?.messages) {
        for (const msg of chunk.generate.messages) {
          allMessages.push(msg);
          onMessage?.(msg);
        }
      }
    }
  } catch (error: any) {
    console.error(`Debate ${config.debateId} error:`, error.message);
    throw error;
  }

  console.log(`Debate ${config.debateId} completed with ${allMessages.length} messages`);
  return allMessages;
}

// Export types
export type { DebateState, DebateConfig, DebateMessage, AgentProfile };

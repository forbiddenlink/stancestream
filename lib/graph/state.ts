/**
 * LangGraph Debate State Definition
 *
 * Defines the state type and annotation for multi-agent debate orchestration.
 */

import { Annotation } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

// Speaker roles in the debate
export type SpeakerRole = "pro" | "con" | "moderator" | "scorer";

// Scores for each side
export interface DebateScores {
  pro: number;
  con: number;
}

// Individual debate message
export interface DebateMessage {
  role: SpeakerRole;
  content: string;
  timestamp: string;
  round: number;
  metadata?: {
    emotionalState?: string;
    argumentStrength?: number;
    factualAccuracy?: number;
    persuasiveness?: number;
  };
}

// Round summary from scorer
export interface RoundSummary {
  round: number;
  scores: DebateScores;
  winner: SpeakerRole | "tie";
  reasoning: string;
}

// Debate configuration
export interface DebateConfig {
  debateId: string;
  topic: string;
  rounds: number;
  proPosition: string;
  conPosition: string;
}

// Define the state annotation for the debate graph
export const StanceStateAnnotation = Annotation.Root({
  // Core debate configuration
  debateId: Annotation<string>(),
  topic: Annotation<string>(),
  proPosition: Annotation<string>(),
  conPosition: Annotation<string>(),

  // Turn management
  currentSpeaker: Annotation<SpeakerRole>(),
  round: Annotation<number>(),
  totalRounds: Annotation<number>(),
  turnInRound: Annotation<number>(), // 0: moderator intro, 1: pro, 2: con, 3: scorer

  // Scoring
  scores: Annotation<DebateScores>({
    reducer: (current, update) => ({
      pro: (current?.pro ?? 0) + (update?.pro ?? 0),
      con: (current?.con ?? 0) + (update?.con ?? 0),
    }),
    default: () => ({ pro: 0, con: 0 }),
  }),

  // Message history
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => [...(current ?? []), ...(update ?? [])],
    default: () => [],
  }),

  // Debate-specific messages for display
  debateMessages: Annotation<DebateMessage[]>({
    reducer: (current, update) => [...(current ?? []), ...(update ?? [])],
    default: () => [],
  }),

  // Round summaries
  roundSummaries: Annotation<RoundSummary[]>({
    reducer: (current, update) => [...(current ?? []), ...(update ?? [])],
    default: () => [],
  }),

  // Control flags
  isComplete: Annotation<boolean>(),
  cancelled: Annotation<boolean>(),

  // Last generated content (for streaming)
  lastMessage: Annotation<DebateMessage | null>(),
  lastRoundSummary: Annotation<RoundSummary | null>(),

  // Error tracking
  errors: Annotation<string[]>({
    reducer: (current, update) => [...(current ?? []), ...(update ?? [])],
    default: () => [],
  }),
});

// Export the state type
export type StanceState = typeof StanceStateAnnotation.State;

// Initial state factory
export function createInitialState(config: DebateConfig): StanceState {
  return {
    debateId: config.debateId,
    topic: config.topic,
    proPosition: config.proPosition,
    conPosition: config.conPosition,
    currentSpeaker: "moderator",
    round: 1,
    totalRounds: config.rounds,
    turnInRound: 0,
    scores: { pro: 0, con: 0 },
    messages: [],
    debateMessages: [],
    roundSummaries: [],
    isComplete: false,
    cancelled: false,
    lastMessage: null,
    lastRoundSummary: null,
    errors: [],
  };
}

/**
 * LangGraph Debate Graph Builder
 *
 * Assembles the debate state machine from nodes and edges.
 */

import { StateGraph, START, END } from "@langchain/langgraph";
import {
  StanceStateAnnotation,
  createInitialState,
  type StanceState,
  type DebateConfig,
  type DebateMessage,
  type RoundSummary,
} from "./state.js";
import {
  moderatorNode,
  proNode,
  conNode,
  scorerNode,
  advanceTurnNode,
  finalSummaryNode,
} from "./nodes.js";
import { routeAfterAdvance } from "./edges.js";

/**
 * Create the compiled debate graph
 */
export function createDebateGraph() {
  const graph = new StateGraph(StanceStateAnnotation)
    // Add all nodes
    .addNode("moderator", moderatorNode)
    .addNode("pro", proNode)
    .addNode("con", conNode)
    .addNode("scorer", scorerNode)
    .addNode("advance", advanceTurnNode)
    .addNode("finalSummary", finalSummaryNode)

    // Entry point: start with moderator
    .addEdge(START, "moderator")

    // After each speaker, go to advance
    .addEdge("moderator", "advance")
    .addEdge("pro", "advance")
    .addEdge("con", "advance")
    .addEdge("scorer", "advance")

    // Advance routes conditionally based on turn and completion
    .addConditionalEdges("advance", routeAfterAdvance, {
      moderator: "moderator",
      pro: "pro",
      con: "con",
      scorer: "scorer",
      finalSummary: "finalSummary",
      __end__: END,
    })

    // Final summary ends the graph
    .addEdge("finalSummary", END);

  return graph.compile();
}

// Callback types for debate streaming
export interface DebateCallbacks {
  onMessage?: (message: DebateMessage) => void;
  onRoundComplete?: (summary: RoundSummary) => void;
  onComplete?: (state: StanceState) => void;
  onError?: (error: Error) => void;
}

// Debate process handle for cancellation
export interface DebateProcess {
  cancelled: boolean;
}

/**
 * Run a debate with streaming callbacks
 */
export async function runDebate(
  config: DebateConfig,
  callbacks: DebateCallbacks = {},
  process?: DebateProcess
): Promise<StanceState> {
  const graph = createDebateGraph();
  const initialState = createInitialState(config);

  console.log(`[Debate] Starting debate: ${config.debateId}`);
  console.log(`[Debate] Topic: ${config.topic}`);
  console.log(`[Debate] Rounds: ${config.rounds}`);

  let finalState: StanceState = initialState;

  try {
    const stream = await graph.stream(initialState, {
      runName: `debate-${config.debateId}`,
      tags: ["debate", "stancestream"],
      metadata: {
        debateId: config.debateId,
        topic: config.topic,
        rounds: config.rounds,
      },
    });

    for await (const chunk of stream) {
      // Check for cancellation
      if (process?.cancelled) {
        console.log(`[Debate] Cancelled: ${config.debateId}`);
        break;
      }

      // Process each node output
      for (const [nodeName, nodeOutput] of Object.entries(chunk)) {
        const output = nodeOutput as Partial<StanceState>;

        // Emit message if present
        if (output.lastMessage && callbacks.onMessage) {
          callbacks.onMessage(output.lastMessage);
        }

        // Emit round summary if present
        if (output.lastRoundSummary && callbacks.onRoundComplete) {
          callbacks.onRoundComplete(output.lastRoundSummary);
        }

        // Track final state
        if (output.debateMessages) {
          finalState = {
            ...finalState,
            debateMessages: [...finalState.debateMessages, ...output.debateMessages],
          };
        }
        if (output.scores) {
          finalState = {
            ...finalState,
            scores: {
              pro: finalState.scores.pro + (output.scores.pro ?? 0),
              con: finalState.scores.con + (output.scores.con ?? 0),
            },
          };
        }
        if (output.roundSummaries) {
          finalState = {
            ...finalState,
            roundSummaries: [...finalState.roundSummaries, ...output.roundSummaries],
          };
        }
        if (output.isComplete !== undefined) {
          finalState = { ...finalState, isComplete: output.isComplete };
        }
      }
    }

    // Notify completion
    if (callbacks.onComplete) {
      callbacks.onComplete(finalState);
    }

    console.log(`[Debate] Completed: ${config.debateId}`);
    console.log(`[Debate] Final scores: PRO ${finalState.scores.pro} - CON ${finalState.scores.con}`);

    return finalState;
  } catch (error) {
    console.error(`[Debate] Error in ${config.debateId}:`, error);
    if (callbacks.onError && error instanceof Error) {
      callbacks.onError(error);
    }
    throw error;
  }
}

/**
 * Create a debate orchestrator for managing multiple debates
 */
export function createDebateOrchestrator() {
  const activeDebates = new Map<string, DebateProcess>();

  return {
    /**
     * Start a new debate
     */
    async start(
      config: DebateConfig,
      callbacks: DebateCallbacks = {}
    ): Promise<StanceState> {
      if (activeDebates.has(config.debateId)) {
        throw new Error(`Debate ${config.debateId} is already running`);
      }

      const process: DebateProcess = { cancelled: false };
      activeDebates.set(config.debateId, process);

      try {
        const result = await runDebate(config, callbacks, process);
        return result;
      } finally {
        activeDebates.delete(config.debateId);
      }
    },

    /**
     * Cancel a running debate
     */
    cancel(debateId: string): boolean {
      const process = activeDebates.get(debateId);
      if (process) {
        process.cancelled = true;
        console.log(`[Orchestrator] Cancelled debate: ${debateId}`);
        return true;
      }
      return false;
    },

    /**
     * Check if a debate is running
     */
    isRunning(debateId: string): boolean {
      return activeDebates.has(debateId);
    },

    /**
     * Get count of active debates
     */
    getActiveCount(): number {
      return activeDebates.size;
    },

    /**
     * Get all active debate IDs
     */
    getActiveDebateIds(): string[] {
      return Array.from(activeDebates.keys());
    },
  };
}

// Export types
export type {
  StanceState,
  DebateConfig,
  DebateMessage,
  RoundSummary,
} from "./state.js";

// Export default orchestrator
export const orchestrator = createDebateOrchestrator();

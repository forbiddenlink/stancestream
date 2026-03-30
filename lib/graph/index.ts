/**
 * LangGraph Debate Orchestration - Main Entry Point
 *
 * Multi-agent debate system with:
 * - Pro/Con debaters
 * - Moderator for round introductions
 * - Scorer for evaluation
 */

// State types and factory
export {
  StanceStateAnnotation,
  createInitialState,
  type StanceState,
  type DebateConfig,
  type DebateMessage,
  type DebateScores,
  type RoundSummary,
  type SpeakerRole,
} from "./state.js";

// Graph nodes
export {
  moderatorNode,
  proNode,
  conNode,
  scorerNode,
  advanceTurnNode,
  finalSummaryNode,
  nodes,
} from "./nodes.js";

// Edge routing
export {
  routeAfterAdvance,
  routeAfterSpeaker,
  routeAfterSummary,
  routeInitial,
  shouldContinue,
  getNextSpeaker,
  edgeRoutes,
  type NodeName,
} from "./edges.js";

// Graph and orchestration
export {
  createDebateGraph,
  runDebate,
  createDebateOrchestrator,
  orchestrator,
  type DebateCallbacks,
  type DebateProcess,
} from "./graph.js";

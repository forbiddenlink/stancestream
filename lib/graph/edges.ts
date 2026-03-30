/**
 * LangGraph Debate Edges
 *
 * Defines conditional routing logic for the debate state machine.
 */

import type { StanceState, SpeakerRole } from "./state.js";

// Node names used in the graph
export type NodeName =
  | "moderator"
  | "pro"
  | "con"
  | "scorer"
  | "advance"
  | "finalSummary";

/**
 * Route from advance node based on debate state
 *
 * Turn sequence per round:
 * 0 = moderator introduces
 * 1 = pro argues
 * 2 = con argues
 * 3 = scorer evaluates
 *
 * After scorer, we go back to moderator for next round (or end if complete)
 */
export function routeAfterAdvance(state: StanceState): NodeName | "__end__" {
  const { isComplete, cancelled, turnInRound, errors } = state;

  // Check termination conditions
  if (cancelled) {
    console.log("[Router] Debate cancelled");
    return "__end__";
  }

  if (errors.length > 10) {
    console.log("[Router] Too many errors, ending debate");
    return "__end__";
  }

  if (isComplete) {
    console.log("[Router] Debate complete, generating final summary");
    return "finalSummary";
  }

  // Route based on current turn
  switch (turnInRound) {
    case 0:
      return "moderator";
    case 1:
      return "pro";
    case 2:
      return "con";
    case 3:
      return "scorer";
    default:
      console.log(`[Router] Unexpected turn: ${turnInRound}, defaulting to moderator`);
      return "moderator";
  }
}

/**
 * Route after each speaker node
 * Always goes to advance to update turn tracking
 */
export function routeAfterSpeaker(_state: StanceState): "advance" {
  return "advance";
}

/**
 * Route after final summary
 */
export function routeAfterSummary(_state: StanceState): "__end__" {
  return "__end__";
}

/**
 * Initial routing - start with moderator intro
 */
export function routeInitial(_state: StanceState): NodeName {
  return "moderator";
}

/**
 * Check if debate should continue (used for streaming checkpoints)
 */
export function shouldContinue(state: StanceState): boolean {
  return !state.isComplete && !state.cancelled && state.errors.length <= 10;
}

/**
 * Get next speaker based on turn
 */
export function getNextSpeaker(turnInRound: number): SpeakerRole {
  const speakers: SpeakerRole[] = ["moderator", "pro", "con", "scorer"];
  return speakers[turnInRound % 4];
}

/**
 * Edge map for the debate graph
 */
export const edgeRoutes = {
  afterAdvance: routeAfterAdvance,
  afterSpeaker: routeAfterSpeaker,
  afterSummary: routeAfterSummary,
  initial: routeInitial,
};

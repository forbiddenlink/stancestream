/**
 * LangGraph Debate Nodes
 *
 * Defines all node functions for the debate state machine.
 */

import type { RunnableConfig } from "@langchain/core/runnables";
import type { StanceState, DebateMessage, SpeakerRole } from "./state.js";
import { generateProResponse } from "../agents/pro.js";
import { generateConResponse } from "../agents/con.js";
import { generateModeratorIntro } from "../agents/moderator.js";
import { generateScorerEvaluation } from "../agents/scorer.js";

/**
 * Node: Moderator introduces the round
 */
export async function moderatorNode(
  state: StanceState,
  _config?: RunnableConfig
): Promise<Partial<StanceState>> {
  console.log(`[Moderator] Introducing round ${state.round}`);
  const result = await generateModeratorIntro(state);
  return {
    ...result,
    currentSpeaker: "moderator" as SpeakerRole,
  };
}

/**
 * Node: Pro agent makes their argument
 */
export async function proNode(
  state: StanceState,
  _config?: RunnableConfig
): Promise<Partial<StanceState>> {
  console.log(`[Pro] Generating argument for round ${state.round}`);
  const result = await generateProResponse(state);
  return {
    ...result,
    currentSpeaker: "pro" as SpeakerRole,
  };
}

/**
 * Node: Con agent makes their argument
 */
export async function conNode(
  state: StanceState,
  _config?: RunnableConfig
): Promise<Partial<StanceState>> {
  console.log(`[Con] Generating argument for round ${state.round}`);
  const result = await generateConResponse(state);
  return {
    ...result,
    currentSpeaker: "con" as SpeakerRole,
  };
}

/**
 * Node: Scorer evaluates the round
 */
export async function scorerNode(
  state: StanceState,
  _config?: RunnableConfig
): Promise<Partial<StanceState>> {
  console.log(`[Scorer] Evaluating round ${state.round}`);
  const result = await generateScorerEvaluation(state);
  return {
    ...result,
    currentSpeaker: "scorer" as SpeakerRole,
  };
}

/**
 * Node: Advance to next turn/round
 */
export function advanceTurnNode(state: StanceState): Partial<StanceState> {
  const { round, totalRounds, turnInRound } = state;

  // Turn sequence: 0=moderator, 1=pro, 2=con, 3=scorer
  const nextTurn = (turnInRound + 1) % 4;
  const isNewRound = nextTurn === 0;
  const nextRound = isNewRound ? round + 1 : round;
  const isComplete = isNewRound && nextRound > totalRounds;

  if (isComplete) {
    console.log(`[Advance] Debate complete after ${totalRounds} rounds`);
  } else if (isNewRound) {
    console.log(`[Advance] Moving to round ${nextRound}`);
  }

  return {
    turnInRound: nextTurn,
    round: nextRound,
    isComplete,
    lastMessage: null, // Clear for next turn
    lastRoundSummary: null,
  };
}

/**
 * Node: Check for cancellation
 */
export function checkCancellationNode(state: StanceState): Partial<StanceState> {
  // This node just passes through but allows external cancellation checks
  return {};
}

/**
 * Node: Generate final summary
 */
export async function finalSummaryNode(
  state: StanceState,
  _config?: RunnableConfig
): Promise<Partial<StanceState>> {
  const { scores, roundSummaries, topic } = state;

  const totalPro = scores.pro;
  const totalCon = scores.con;
  const winner = totalPro > totalCon ? "pro" : totalCon > totalPro ? "con" : "tie";

  const summaryContent =
    `Final Results: PRO ${totalPro.toFixed(1)} - CON ${totalCon.toFixed(1)}. ` +
    (winner === "tie"
      ? "The debate ends in a tie!"
      : `${winner.toUpperCase()} wins the debate!`);

  console.log(`[Summary] ${summaryContent}`);

  const finalMessage: DebateMessage = {
    role: "moderator",
    content: summaryContent,
    timestamp: new Date().toISOString(),
    round: state.round,
    metadata: {
      emotionalState: "conclusive",
    },
  };

  return {
    debateMessages: [finalMessage],
    lastMessage: finalMessage,
    isComplete: true,
  };
}

// Export all nodes
export const nodes = {
  moderator: moderatorNode,
  pro: proNode,
  con: conNode,
  scorer: scorerNode,
  advance: advanceTurnNode,
  checkCancellation: checkCancellationNode,
  finalSummary: finalSummaryNode,
};

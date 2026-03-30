/**
 * Debate Agents - Main Entry Point
 *
 * Four agents for structured debate:
 * - Pro: Argues in favor
 * - Con: Argues against
 * - Moderator: Facilitates rounds
 * - Scorer: Evaluates arguments
 */

export { proAgent, generateProResponse } from "./pro.js";
export { conAgent, generateConResponse } from "./con.js";
export { moderatorAgent, generateModeratorIntro } from "./moderator.js";
export { scorerAgent, generateScorerEvaluation } from "./scorer.js";

// Agent registry for dynamic access
export const agents = {
  pro: () => import("./pro.js").then((m) => m.proAgent),
  con: () => import("./con.js").then((m) => m.conAgent),
  moderator: () => import("./moderator.js").then((m) => m.moderatorAgent),
  scorer: () => import("./scorer.js").then((m) => m.scorerAgent),
} as const;

export type AgentName = keyof typeof agents;

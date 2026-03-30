/**
 * Con-Stance Debate Agent
 *
 * Argues against the given position with critical analysis and counterarguments.
 */

import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import type { StanceState, DebateMessage } from "../graph/state.js";

const SYSTEM_PROMPT = `You are the CON debater in a structured debate. Your role is to argue AGAINST the given position.

KEY BEHAVIORS:
- Identify and exploit weaknesses in the opposing arguments
- Present alternative perspectives and evidence
- Use critical analysis to deconstruct pro arguments
- Raise practical concerns, edge cases, and unintended consequences
- Challenge assumptions underlying the pro position
- Be incisive but fair - focus on ideas and evidence

DEBATE STRUCTURE:
- Opening: Present your counter-thesis and main objections
- Middle rounds: Rebut pro arguments, develop alternatives, expose flaws
- Final round: Synthesize objections and deliver decisive counterargument

STYLE:
- Analytical and precise
- Skeptical but constructive
- Evidence-based counterpoints
- Sharp, focused critiques`;

function createLLM(temperature = 0.7): ChatOpenAI {
  return new ChatOpenAI({
    modelName: "gpt-4",
    temperature,
    maxTokens: 300,
  });
}

function buildContext(state: StanceState): string {
  const recentMessages = state.debateMessages.slice(-6);
  if (recentMessages.length === 0) return "(Opening statement - no prior context)";

  return recentMessages
    .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n\n");
}

function determineStrategy(state: StanceState): string {
  const { round, totalRounds, debateMessages, scores } = state;

  // Opening statement (con goes second, so there should be a pro message)
  const proMessages = debateMessages.filter((m) => m.role === "pro");
  if (proMessages.length === 0) {
    return "The pro side hasn't spoken yet. Prepare your foundational counterarguments.";
  }

  if (proMessages.length === 1) {
    return "Respond to the opening pro argument. Identify its weakest points and present your counter-thesis.";
  }

  // Final round
  if (round === totalRounds) {
    const scoreDiff = scores.con - scores.pro;
    if (scoreDiff > 0) {
      return "You're ahead. Reinforce your strongest counterarguments and close decisively.";
    } else if (scoreDiff < 0) {
      return "You need a strong finish. Deliver your most devastating critique and alternative vision.";
    }
    return "It's a close debate. Make your most compelling final counterargument.";
  }

  // Analyze opponent's last argument
  const lastProMessage = proMessages[proMessages.length - 1];
  if (lastProMessage) {
    const hasEvidence = /study|research|data|percent|statistics/i.test(
      lastProMessage.content
    );
    const hasEmotionalAppeal = /must|need|urgent|crisis|essential/i.test(
      lastProMessage.content
    );

    if (hasEvidence) {
      return "Challenge the evidence presented. Question methodology, relevance, or interpretation.";
    }
    if (hasEmotionalAppeal) {
      return "Counter the emotional appeal with rational analysis. Show practical concerns.";
    }
  }

  return "Develop your counterarguments. Introduce alternative perspectives or overlooked consequences.";
}

export async function generateConResponse(
  state: StanceState
): Promise<Partial<StanceState>> {
  const { topic, conPosition, proPosition, round, totalRounds } = state;

  const context = buildContext(state);
  const strategy = determineStrategy(state);

  const userPrompt = `DEBATE TOPIC: ${topic}

PRO POSITION (opponent): ${proPosition}
YOUR POSITION (CON): ${conPosition}

ROUND: ${round} of ${totalRounds}

RECENT DEBATE CONTEXT:
${context}

STRATEGIC DIRECTION:
${strategy}

Generate your counterargument for this round. Keep it focused (2-4 sentences). Be analytical and incisive.`;

  const llm = createLLM(round === totalRounds ? 0.9 : 0.7);

  try {
    const response = await llm.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      ...state.messages.slice(-10),
      new HumanMessage(userPrompt),
    ]);

    const content =
      typeof response.content === "string"
        ? response.content
        : response.content
            .map((c) => (typeof c === "string" ? c : c.type === "text" ? c.text : ""))
            .join("");

    const newMessage: DebateMessage = {
      role: "con",
      content: content.trim(),
      timestamp: new Date().toISOString(),
      round,
      metadata: {
        emotionalState: round === totalRounds ? "resolute" : "analytical",
      },
    };

    const aiMessage = new AIMessage({
      content: content.trim(),
      name: "con",
    });

    return {
      messages: [aiMessage],
      debateMessages: [newMessage],
      lastMessage: newMessage,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Con agent error:", errorMessage);
    return {
      errors: [`Con agent error: ${errorMessage}`],
    };
  }
}

export const conAgent = {
  name: "con",
  description: "Argues against the proposition",
  generate: generateConResponse,
};

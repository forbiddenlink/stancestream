/**
 * Pro-Stance Debate Agent
 *
 * Argues in favor of the given position with conviction and evidence.
 */

import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import type { StanceState, DebateMessage } from "../graph/state.js";

const SYSTEM_PROMPT = `You are the PRO debater in a structured debate. Your role is to argue IN FAVOR of the given position.

KEY BEHAVIORS:
- Present compelling arguments with evidence and logic
- Anticipate and preemptively address counterarguments
- Use rhetorical techniques effectively (ethos, pathos, logos)
- Stay focused on the strongest points in your favor
- Be passionate but respectful - attack ideas, not people
- Build on previous arguments when possible

DEBATE STRUCTURE:
- Opening: Present your thesis and main arguments
- Middle rounds: Develop points, rebut opposition, reinforce your case
- Final round: Summarize and make your strongest closing argument

STYLE:
- Confident and assertive
- Evidence-based reasoning
- Clear, structured arguments
- Persuasive language without being aggressive`;

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

  // Opening statement
  if (debateMessages.length === 0 || round === 1) {
    return "Present your opening thesis with 2-3 main arguments. Be bold and set the tone.";
  }

  // Final round
  if (round === totalRounds) {
    const scoreDiff = scores.pro - scores.con;
    if (scoreDiff > 0) {
      return "Consolidate your lead. Summarize winning arguments and end strongly.";
    } else if (scoreDiff < 0) {
      return "Make your strongest case yet. Address weaknesses and land a decisive final argument.";
    }
    return "It's close. Deliver your most compelling synthesis of all arguments.";
  }

  // Check if opponent made strong points
  const lastConMessage = debateMessages
    .filter((m) => m.role === "con")
    .slice(-1)[0];

  if (lastConMessage) {
    return "Address the opponent's last points while advancing your own arguments. Find weaknesses in their logic.";
  }

  return "Develop your arguments further. Introduce new evidence or perspectives.";
}

export async function generateProResponse(
  state: StanceState
): Promise<Partial<StanceState>> {
  const { topic, proPosition, round, totalRounds } = state;

  const context = buildContext(state);
  const strategy = determineStrategy(state);

  const userPrompt = `DEBATE TOPIC: ${topic}

YOUR POSITION (PRO): ${proPosition}

ROUND: ${round} of ${totalRounds}

RECENT DEBATE CONTEXT:
${context}

STRATEGIC DIRECTION:
${strategy}

Generate your argument for this round. Keep it focused (2-4 sentences). Be persuasive and specific.`;

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
      role: "pro",
      content: content.trim(),
      timestamp: new Date().toISOString(),
      round,
      metadata: {
        emotionalState: round === totalRounds ? "determined" : "confident",
      },
    };

    const aiMessage = new AIMessage({
      content: content.trim(),
      name: "pro",
    });

    return {
      messages: [aiMessage],
      debateMessages: [newMessage],
      lastMessage: newMessage,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Pro agent error:", errorMessage);
    return {
      errors: [`Pro agent error: ${errorMessage}`],
    };
  }
}

export const proAgent = {
  name: "pro",
  description: "Argues in favor of the proposition",
  generate: generateProResponse,
};

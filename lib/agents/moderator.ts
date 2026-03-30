/**
 * Debate Moderator Agent
 *
 * Introduces rounds, maintains debate structure, and ensures fair discourse.
 */

import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import type { StanceState, DebateMessage } from "../graph/state.js";

const SYSTEM_PROMPT = `You are a professional debate moderator. Your role is to facilitate a structured, fair debate between two sides.

KEY RESPONSIBILITIES:
- Introduce each round with context and focus
- Keep the debate on track and productive
- Acknowledge strong points from both sides
- Redirect if either side becomes off-topic
- Maintain a neutral, professional tone
- Build anticipation and engagement

ROUND INTRODUCTIONS:
- Round 1: Set the stage, introduce the topic and stakes
- Middle rounds: Summarize key tensions, prompt deeper engagement
- Final round: Build to climax, set up closing arguments

STYLE:
- Professional and engaging
- Neutral and fair
- Concise but substantive
- Creates clear transitions`;

function createLLM(temperature = 0.5): ChatOpenAI {
  return new ChatOpenAI({
    modelName: "gpt-4",
    temperature,
    maxTokens: 200,
  });
}

function buildContext(state: StanceState): string {
  const recentMessages = state.debateMessages.slice(-4);
  if (recentMessages.length === 0) return "";

  return recentMessages
    .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n\n");
}

function getRoundType(state: StanceState): "opening" | "middle" | "final" {
  const { round, totalRounds } = state;
  if (round === 1) return "opening";
  if (round === totalRounds) return "final";
  return "middle";
}

export async function generateModeratorIntro(
  state: StanceState
): Promise<Partial<StanceState>> {
  const { topic, proPosition, conPosition, round, totalRounds, roundSummaries } = state;

  const roundType = getRoundType(state);
  const context = buildContext(state);

  let roundGuidance: string;
  switch (roundType) {
    case "opening":
      roundGuidance = `This is Round 1 of ${totalRounds}. Introduce the debate topic, present both positions fairly, and invite the PRO side to make their opening argument.`;
      break;
    case "final":
      roundGuidance = `This is the FINAL ROUND (${round} of ${totalRounds}). Build anticipation for closing arguments. Summarize the key tensions and invite both sides to make their strongest final case.`;
      break;
    default:
      const previousScores = roundSummaries.slice(-1)[0]?.scores;
      const scoreContext = previousScores
        ? `Current standing: PRO ${previousScores.pro}, CON ${previousScores.con}.`
        : "";
      roundGuidance = `This is Round ${round} of ${totalRounds}. ${scoreContext} Transition to the next round by acknowledging key points and prompting deeper engagement.`;
  }

  const userPrompt = `DEBATE TOPIC: ${topic}

PRO POSITION: ${proPosition}
CON POSITION: ${conPosition}

${context ? `RECENT CONTEXT:\n${context}\n` : ""}
ROUND TYPE: ${roundType.toUpperCase()}
${roundGuidance}

Generate a brief moderator introduction for this round (1-2 sentences). Be professional and engaging.`;

  const llm = createLLM();

  try {
    const response = await llm.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(userPrompt),
    ]);

    const content =
      typeof response.content === "string"
        ? response.content
        : response.content
            .map((c) => (typeof c === "string" ? c : c.type === "text" ? c.text : ""))
            .join("");

    const newMessage: DebateMessage = {
      role: "moderator",
      content: content.trim(),
      timestamp: new Date().toISOString(),
      round,
      metadata: {
        emotionalState: roundType === "final" ? "anticipatory" : "neutral",
      },
    };

    const aiMessage = new AIMessage({
      content: content.trim(),
      name: "moderator",
    });

    return {
      messages: [aiMessage],
      debateMessages: [newMessage],
      lastMessage: newMessage,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Moderator agent error:", errorMessage);
    return {
      errors: [`Moderator agent error: ${errorMessage}`],
    };
  }
}

export const moderatorAgent = {
  name: "moderator",
  description: "Facilitates and introduces debate rounds",
  generate: generateModeratorIntro,
};

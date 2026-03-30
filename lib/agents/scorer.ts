/**
 * Debate Scorer Agent
 *
 * Evaluates each round and assigns scores based on argument quality.
 */

import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import type { StanceState, DebateMessage, RoundSummary, DebateScores } from "../graph/state.js";

const SYSTEM_PROMPT = `You are an expert debate judge. Your role is to evaluate arguments and assign fair scores.

SCORING CRITERIA (each 0-10):
1. Argument Strength: Logic, evidence, coherence
2. Rebuttal Quality: Effectiveness of counterarguments
3. Persuasiveness: Rhetorical skill, emotional resonance
4. Relevance: Focus on topic, avoidance of tangents

SCORING GUIDELINES:
- Be objective and fair to both sides
- Consider cumulative argument development
- Award points for specific, evidence-based claims
- Penalize logical fallacies, ad hominem attacks
- Recognize effective reframing of opponent's points

OUTPUT FORMAT:
Provide scores and brief reasoning. Be specific about what worked and what didn't.

IMPORTANT: Your evaluation should be constructive and educational, helping both sides improve.`;

function createLLM(temperature = 0.3): ChatOpenAI {
  return new ChatOpenAI({
    modelName: "gpt-4",
    temperature,
    maxTokens: 400,
  });
}

function getRoundMessages(state: StanceState): DebateMessage[] {
  const { round, debateMessages } = state;
  return debateMessages.filter((m) => m.round === round);
}

function parseScores(content: string): { proScore: number; conScore: number } {
  // Try to extract scores from various formats
  const proMatch = content.match(/pro[:\s]*(\d+(?:\.\d+)?)/i);
  const conMatch = content.match(/con[:\s]*(\d+(?:\.\d+)?)/i);

  let proScore = proMatch ? parseFloat(proMatch[1]) : 5;
  let conScore = conMatch ? parseFloat(conMatch[1]) : 5;

  // Normalize to 0-10 range
  proScore = Math.min(10, Math.max(0, proScore));
  conScore = Math.min(10, Math.max(0, conScore));

  return { proScore, conScore };
}

function determineWinner(proScore: number, conScore: number): "pro" | "con" | "tie" {
  const diff = proScore - conScore;
  if (Math.abs(diff) < 0.5) return "tie";
  return diff > 0 ? "pro" : "con";
}

export async function generateScorerEvaluation(
  state: StanceState
): Promise<Partial<StanceState>> {
  const { topic, proPosition, conPosition, round, totalRounds, scores } = state;

  const roundMessages = getRoundMessages(state);
  const proArgument = roundMessages.find((m) => m.role === "pro")?.content || "(No pro argument)";
  const conArgument = roundMessages.find((m) => m.role === "con")?.content || "(No con argument)";

  const userPrompt = `DEBATE TOPIC: ${topic}

PRO POSITION: ${proPosition}
CON POSITION: ${conPosition}

ROUND ${round} OF ${totalRounds}

PRO ARGUMENT:
"${proArgument}"

CON ARGUMENT:
"${conArgument}"

CURRENT CUMULATIVE SCORES:
PRO: ${scores.pro}
CON: ${scores.con}

Evaluate this round. Assign a score from 0-10 for each side based on their argument quality.
Format your response as:
PRO SCORE: [0-10]
CON SCORE: [0-10]
REASONING: [Brief explanation of scores and key observations]`;

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

    const { proScore, conScore } = parseScores(content);
    const winner = determineWinner(proScore, conScore);

    // Extract reasoning (everything after the scores)
    const reasoningMatch = content.match(/reason(?:ing)?[:\s]*([\s\S]*)/i);
    const reasoning = reasoningMatch
      ? reasoningMatch[1].trim()
      : `PRO scored ${proScore}, CON scored ${conScore}.`;

    const roundScores: DebateScores = {
      pro: proScore,
      con: conScore,
    };

    const roundSummary: RoundSummary = {
      round,
      scores: roundScores,
      winner,
      reasoning,
    };

    // Create a display message for the scorer
    const displayContent = `Round ${round} Score: PRO ${proScore} - CON ${conScore}${
      winner !== "tie" ? `. ${winner.toUpperCase()} takes the round.` : ". It's a tie."
    }`;

    const newMessage: DebateMessage = {
      role: "scorer",
      content: displayContent,
      timestamp: new Date().toISOString(),
      round,
      metadata: {
        emotionalState: "analytical",
      },
    };

    const aiMessage = new AIMessage({
      content: displayContent,
      name: "scorer",
    });

    return {
      messages: [aiMessage],
      debateMessages: [newMessage],
      scores: roundScores,
      roundSummaries: [roundSummary],
      lastMessage: newMessage,
      lastRoundSummary: roundSummary,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Scorer agent error:", errorMessage);
    return {
      errors: [`Scorer agent error: ${errorMessage}`],
    };
  }
}

export const scorerAgent = {
  name: "scorer",
  description: "Evaluates rounds and assigns scores",
  generate: generateScorerEvaluation,
};

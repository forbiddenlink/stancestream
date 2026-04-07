// Advanced AI Agent Intelligence - Contest Enhancement
// Showcases sophisticated Redis multi-model usage with intelligent behaviors

import "dotenv/config";
import { createClient } from "redis";
import OpenAI from "openai";
import { getCachedResponse, cacheNewResponse } from "./semanticCache.js";
import { trackOpenAICall } from "./metrics.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class IntelligentAgentSystem {
  constructor() {
    this.client = null;
    this.coalitions = new Map(); // Track dynamic alliances
    this.emotionalStates = new Map(); // Track agent emotions
    this.debateStrategies = new Map(); // Track evolving strategies
  }

  async connect() {
    if (!this.client) {
      this.client = createClient({ url: process.env.REDIS_URL });
      await this.client.connect();
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  // 📊 Generate context-aware agent responses with Redis-powered intelligence
  async generateIntelligentResponse(
    agentId,
    debateId,
    topic,
    conversationHistory = [],
  ) {
    await this.connect();

    try {
      // 1. Analyze agent's emotional trajectory (RedisTimeSeries)
      const emotionalState = await this.analyzeEmotionalTrajectory(
        agentId,
        debateId,
      );

      // 2. Check for coalition opportunities (RedisJSON)
      const coalitionStatus = await this.evaluateCoalitions(agentId, debateId);

      // 3. Get agent's strategic memory (Redis Streams)
      const strategicMemory = await this.getStrategicMemory(agentId, debateId);

      // 4. Adapt stance based on debate dynamics (RedisTimeSeries + RedisJSON)
      const stanceEvolution = await this.calculateStanceEvolution(
        agentId,
        debateId,
        topic,
      );

      // 5. Create enhanced prompt with Redis-powered context
      const enhancedPrompt = this.buildIntelligentPrompt(
        agentId,
        topic,
        emotionalState,
        coalitionStatus,
        strategicMemory,
        stanceEvolution,
        conversationHistory,
      );

      // 6. Check semantic cache first (Redis Vector)
      let response = await getCachedResponse(enhancedPrompt);
      let cacheHit = !!response;

      if (!response) {
        // Generate new response with GPT-4
        const completion = await trackOpenAICall("gpt-4o-mini", async () => {
          return await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: enhancedPrompt }],
            max_tokens: 300,
            temperature: 0.7 + emotionalState.intensity * 0.3, // Emotional variation
          });
        });

        response = completion.choices[0].message.content.trim();

        // Cache the response (Redis Vector + Hash)
        await cacheNewResponse(enhancedPrompt, response);
      }

      // 7. Update agent intelligence metrics (RedisJSON)
      await this.updateAgentIntelligence(agentId, debateId, {
        emotionalState,
        coalitionStatus,
        responseGenerated: true,
        cacheHit,
        stanceEvolution,
      });

      // 8. Store strategic memory (Redis Streams)
      await this.storeStrategicMemory(agentId, debateId, {
        type: "intelligent_response",
        topic,
        emotional_state: emotionalState.state,
        coalition_status: coalitionStatus.status,
        stance_shift: stanceEvolution.shift,
        response_preview: response.substring(0, 100),
      });

      return {
        response,
        metadata: {
          emotionalState: emotionalState.state,
          coalitionStatus: coalitionStatus.status,
          stanceShift: stanceEvolution.shift,
          cacheHit,
          intelligenceLevel: this.calculateIntelligenceLevel(
            emotionalState,
            coalitionStatus,
          ),
        },
      };
    } catch (error) {
      console.error("❌ Intelligent agent error:", error);
      // Fallback to basic response
      return {
        response:
          "I need to consider this topic more carefully before responding.",
        metadata: { error: true, fallback: true },
      };
    }
  }

  // 📊 Analyze agent emotional trajectory using RedisTimeSeries
  async analyzeEmotionalTrajectory(agentId, debateId) {
    try {
      const emotionalKey = `debate:${debateId}:agent:${agentId}:emotions`;

      // Try to get recent emotional data points
      const recentEmotions = await this.client.ts
        .range(emotionalKey, "-", "+", { COUNT: 10 })
        .catch(() => []);

      let state = "analytical";
      let intensity = 0.5;
      let trend = "stable";

      if (recentEmotions.length > 0) {
        const values = recentEmotions.map((point) => parseFloat(point.value));
        const avgIntensity = values.reduce((a, b) => a + b, 0) / values.length;

        intensity = Math.max(0.1, Math.min(0.9, avgIntensity));

        // Determine emotional state based on trajectory
        if (intensity > 0.7) state = "passionate";
        else if (intensity < 0.3) state = "reserved";
        else state = "analytical";

        // Determine trend
        if (values.length >= 2) {
          const recent = values[values.length - 1];
          const previous = values[values.length - 2];
          if (recent > previous + 0.1) trend = "escalating";
          else if (recent < previous - 0.1) trend = "de-escalating";
        }
      }

      // Store current emotional state
      const timestamp = Date.now();
      await this.client.ts.add(emotionalKey, timestamp, intensity).catch(() => {
        console.log("📊 TimeSeries not available, using JSON fallback");
      });

      return { state, intensity, trend, timestamp };
    } catch (error) {
      console.log("⚠️ Emotional analysis fallback mode");
      return {
        state: "analytical",
        intensity: 0.5,
        trend: "stable",
        timestamp: Date.now(),
      };
    }
  }

  // 🤝 Evaluate coalition opportunities using RedisJSON
  async evaluateCoalitions(agentId, debateId) {
    try {
      const coalitionKey = `debate:${debateId}:coalitions`;
      const existingCoalitions = await this.client.json
        .get(coalitionKey)
        .catch(() => ({}));

      // Analyze potential alliances based on stance similarity
      const agentProfile = await this.client.json
        .get(`agent:${agentId}:profile`)
        .catch(() => null);
      if (!agentProfile) {
        return { status: "independent", confidence: 0.5, potential_allies: [] };
      }

      // Simple coalition logic for demo - in production would be more sophisticated
      const currentStance = agentProfile.stance?.climate_policy || 0.5;
      let status = "independent";
      let confidence = 0.5;
      let potential_allies = [];

      // Check if stance aligns with other agents (within 0.3 range)
      if (currentStance > 0.6) {
        status = "progressive_coalition";
        confidence = 0.7;
        potential_allies = ["environmentalists", "progressives"];
      } else if (currentStance < 0.4) {
        status = "conservative_coalition";
        confidence = 0.7;
        potential_allies = ["traditionalists", "conservatives"];
      }

      // Store coalition analysis
      const coalitionUpdate = {
        ...existingCoalitions,
        [agentId]: {
          status,
          confidence,
          potential_allies,
          last_updated: new Date().toISOString(),
          stance_position: currentStance,
        },
      };

      await this.client.json
        .set(coalitionKey, ".", coalitionUpdate)
        .catch(() => {
          console.log("📊 JSON storage not available for coalitions");
        });

      return { status, confidence, potential_allies };
    } catch (error) {
      console.log("⚠️ Coalition analysis fallback mode");
      return { status: "independent", confidence: 0.5, potential_allies: [] };
    }
  }

  // 📊 Get strategic memory from Redis Streams
  async getStrategicMemory(agentId, debateId) {
    try {
      const memoryKey = `debate:${debateId}:agent:${agentId}:memory`;
      const recentMemories = await this.client
        .xRevRange(memoryKey, "+", "-", { COUNT: 5 })
        .catch(() => []);

      const strategicInsights = recentMemories
        .filter(
          (entry) =>
            entry.message.type === "strategic_insight" ||
            entry.message.type === "intelligent_response",
        )
        .map((entry) => ({
          type: entry.message.type,
          content: entry.message.content || entry.message.response_preview,
          timestamp: entry.id,
        }));

      return {
        insights: strategicInsights,
        memory_depth: recentMemories.length,
        strategic_patterns: this.analyzeStrategicPatterns(strategicInsights),
      };
    } catch (error) {
      console.log("⚠️ Strategic memory fallback mode");
      return { insights: [], memory_depth: 0, strategic_patterns: [] };
    }
  }

  // 📈 Calculate stance evolution using RedisTimeSeries + RedisJSON
  async calculateStanceEvolution(agentId, debateId, topic) {
    try {
      const topicKey = this.topicToStanceKey(topic);
      const stanceKey = `debate:${debateId}:agent:${agentId}:stance:${topicKey}`;

      // Get recent stance data points
      const stanceHistory = await this.client.ts
        .range(stanceKey, "-", "+", { COUNT: 10 })
        .catch(() => []);

      let shift = 0;
      let direction = "stable";
      let momentum = 0.1;

      if (stanceHistory.length >= 2) {
        const recent = parseFloat(
          stanceHistory[stanceHistory.length - 1].value,
        );
        const previous = parseFloat(stanceHistory[0].value);

        shift = recent - previous;
        momentum = Math.abs(shift);

        if (shift > 0.1) direction = "progressive";
        else if (shift < -0.1) direction = "conservative";
        else direction = "stable";
      }

      return {
        shift: Math.round(shift * 1000) / 1000,
        direction,
        momentum: Math.round(momentum * 1000) / 1000,
        data_points: stanceHistory.length,
      };
    } catch (error) {
      console.log("⚠️ Stance evolution fallback mode");
      return { shift: 0, direction: "stable", momentum: 0.1, data_points: 0 };
    }
  }

  // 📝 Build enhanced prompt with Redis-powered intelligence
  buildIntelligentPrompt(
    agentId,
    topic,
    emotionalState,
    coalitionStatus,
    strategicMemory,
    stanceEvolution,
    conversationHistory,
  ) {
    const agentProfiles = {
      senatorbot:
        "experienced politician focused on pragmatic policy solutions",
      reformerbot: "progressive advocate pushing for transformative change",
    };

    const profile =
      agentProfiles[agentId] || "thoughtful participant in political discourse";

    // Build contextual prompt with Redis intelligence
    const prompt = `You are ${agentId}, a ${profile}, participating in a debate about ${topic}.

CURRENT CONTEXT (powered by Redis intelligence):
- Emotional State: ${emotionalState.state} (intensity: ${emotionalState.intensity}, trend: ${emotionalState.trend})
- Coalition Status: ${coalitionStatus.status} (confidence: ${coalitionStatus.confidence})
- Stance Evolution: ${stanceEvolution.direction} shift of ${stanceEvolution.shift} with ${stanceEvolution.momentum} momentum
- Strategic Memory: ${strategicMemory.insights.length} insights from ${strategicMemory.memory_depth} total memories

BEHAVIORAL GUIDANCE:
- If emotional state is "passionate": Use stronger language and conviction
- If emotional state is "reserved": Be more measured and diplomatic
- If coalition status shows potential allies: Reference shared values
- If stance is evolving: Acknowledge changing perspective while maintaining core identity
- Use strategic memory to avoid repetition and build on previous points

CONVERSATION HISTORY:
${conversationHistory
  .slice(-3)
  .map((msg) => `${msg.agentId}: ${msg.message}`)
  .join("\n")}

Generate a thoughtful, contextually-aware response that reflects your current emotional state, coalition opportunities, and strategic position. Keep it under 250 words and stay true to your character while demonstrating the intelligence provided by Redis data.`;

    return prompt;
  }

  // 📊 Update agent intelligence metrics in RedisJSON
  async updateAgentIntelligence(agentId, debateId, metrics) {
    try {
      const intelligenceKey = `debate:${debateId}:agent:${agentId}:intelligence`;

      const update = {
        timestamp: new Date().toISOString(),
        emotional_state: metrics.emotionalState.state,
        emotional_intensity: metrics.emotionalState.intensity,
        coalition_status: metrics.coalitionStatus.status,
        response_generated: metrics.responseGenerated,
        cache_hit: metrics.cacheHit,
        stance_shift: metrics.stanceEvolution.shift,
        intelligence_score: this.calculateIntelligenceLevel(
          metrics.emotionalState,
          metrics.coalitionStatus,
        ),
      };

      await this.client.json.set(intelligenceKey, ".", update).catch(() => {
        console.log("📊 Intelligence metrics storage not available");
      });
    } catch (error) {
      console.log("⚠️ Intelligence update fallback mode");
    }
  }

  // 💾 Store strategic memory in Redis Streams
  async storeStrategicMemory(agentId, debateId, memoryData) {
    try {
      const memoryKey = `debate:${debateId}:agent:${agentId}:memory`;
      await this.client.xAdd(memoryKey, "*", memoryData).catch(() => {
        console.log("📊 Strategic memory storage not available");
      });
    } catch (error) {
      console.log("⚠️ Memory storage fallback mode");
    }
  }

  // 🧮 Calculate intelligence level based on Redis data
  calculateIntelligenceLevel(emotionalState, coalitionStatus) {
    let baseIntelligence = 0.7;

    // Emotional awareness bonus
    if (emotionalState.trend !== "stable") baseIntelligence += 0.1;

    // Coalition strategy bonus
    if (coalitionStatus.status !== "independent") baseIntelligence += 0.1;

    // Intensity modulation
    baseIntelligence += (emotionalState.intensity - 0.5) * 0.1;

    return Math.max(0.1, Math.min(0.95, baseIntelligence));
  }

  // 🔍 Analyze strategic patterns
  analyzeStrategicPatterns(insights) {
    const patterns = [];

    if (insights.length >= 2) {
      const types = insights.map((i) => i.type);
      if (types.every((t) => t === "strategic_insight")) {
        patterns.push("consistent_strategy");
      }
      if (
        insights.some(
          (i) =>
            i.content.includes("coalition") || i.content.includes("alliance"),
        )
      ) {
        patterns.push("coalition_building");
      }
    }

    return patterns;
  }

  // 🗝️ Convert topic to stance key - SYNCHRONIZED with messageGenerationCore.js
  topicToStanceKey(topic) {
    const mappings = {
      "environmental regulations and green energy": "climate_policy",
      "climate policy": "climate_policy",
      "climate change": "climate_policy",

      "artificial intelligence governance and ethics": "ai_policy",
      "ai regulation": "ai_policy",

      "universal healthcare and medical access": "healthcare_policy",
      "healthcare reform": "healthcare_policy",
      healthcare: "healthcare_policy",

      "border security and refugee assistance": "immigration_policy",
      "immigration policy": "immigration_policy",
      immigration: "immigration_policy",

      "public education and student debt": "education_policy",
      "education reform": "education_policy",
      education: "education_policy",

      "progressive taxation and wealth redistribution": "tax_policy",
      "tax policy": "tax_policy",
      taxation: "tax_policy",

      "data protection and surveillance": "privacy_policy",
      "digital privacy": "privacy_policy",
      privacy: "privacy_policy",

      "space colonization and research funding": "space_policy",
      "space exploration": "space_policy",
      "space exploration funding": "space_policy",
      space: "space_policy",
    };

    const lowerTopic = topic.toLowerCase();

    // Direct match
    if (mappings[lowerTopic]) {
      return mappings[lowerTopic];
    }

    // Partial match for key words
    if (lowerTopic.includes("climate") || lowerTopic.includes("environment")) {
      return "climate_policy";
    }
    if (lowerTopic.includes("healthcare") || lowerTopic.includes("medical")) {
      return "healthcare_policy";
    }
    if (lowerTopic.includes("education") || lowerTopic.includes("school")) {
      return "education_policy";
    }
    if (lowerTopic.includes("immigration") || lowerTopic.includes("border")) {
      return "immigration_policy";
    }
    if (lowerTopic.includes("tax") || lowerTopic.includes("wealth")) {
      return "tax_policy";
    }
    if (lowerTopic.includes("ai") || lowerTopic.includes("artificial")) {
      return "ai_policy";
    }
    if (lowerTopic.includes("privacy") || lowerTopic.includes("data")) {
      return "privacy_policy";
    }
    if (lowerTopic.includes("space")) {
      return "space_policy";
    }

    return "general_policy";
  }
}

// Export singleton instance
const intelligentAgentSystem = new IntelligentAgentSystem();
export default intelligentAgentSystem;

// Helper function for easy integration
export async function generateIntelligentMessage(
  agentId,
  debateId,
  topic,
  conversationHistory = [],
) {
  return await intelligentAgentSystem.generateIntelligentResponse(
    agentId,
    debateId,
    topic,
    conversationHistory,
  );
}

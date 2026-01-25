// Core Message Generation Logic for StanceStream
import 'dotenv/config';
import OpenAI from 'openai';
import redisManager from './redisManager.js';
import { getCachedResponse, cacheNewResponse } from './semanticCache.js';
import { trackOpenAICall } from './metrics.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Common utility to check message similarity
export function calculateSimilarity(message1, message2) {
    if (!message1 || !message2) return 0;
    
    const words1 = message1.toLowerCase().split(/\s+/);
    const words2 = message2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => 
        word.length > 3 && words2.includes(word)
    );
    
    return commonWords.length / Math.max(words1.length, words2.length);
}

// Enhanced prompt generation with randomization and context
export function generateEnhancedPrompt(profile, memoryContext, topic, turnNumber, additionalContext = {}) {
    const conversationalCues = [
        `Let me address this directly as a ${profile.tone} ${profile.role}:`,
        `I want to emphasize from my perspective as ${profile.name}:`,
        `My position as a ${profile.role} is clear:`,
        `Here's what I believe as ${profile.name}:`,
        `From my ${profile.tone} perspective:`,
        `Building on the discussion as ${profile.name}:`,
        `Taking a different perspective as a ${profile.role}:`, 
        `Considering the broader implications as ${profile.name}:`,
        `From my experience as a ${profile.tone} ${profile.role}:`,
        `Looking at this pragmatically as ${profile.name}:`,
    ];
    
    const randomSeed = Math.floor(Math.random() * 1000);
    const randomCue = conversationalCues[randomSeed % conversationalCues.length];
    const emotionalState = additionalContext.emotionalState || 'neutral';
    
    // Include agent-specific stance data for uniqueness
    const agentStances = Object.entries(profile.stance || {})
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    
    // Create agent-specific behavioral instructions
    let behavioralInstructions = '';
    if (profile.name === 'SenatorBot') {
        behavioralInstructions = `As a moderate senator focused on fiscal responsibility and bipartisan compromise, emphasize pragmatic solutions, cost-benefit analysis, and finding middle ground. Your tone should be measured and diplomatic.`;
    } else if (profile.name === 'ReformerBot') {
        behavioralInstructions = `As a passionate progressive advocate for climate justice and rapid decarbonization, emphasize urgent action, moral imperatives, and transformative change. Your tone should be energetic and conviction-driven.`;
    } else {
        behavioralInstructions = `Maintain your distinctive perspective as a ${profile.tone} ${profile.role}.`;
    }
    
    return `
AGENT: ${profile.name}
ROLE: ${profile.tone} ${profile.role} 
EMOTIONAL STATE: ${emotionalState}
CORE BELIEFS: ${profile.biases.join(', ')}
POLITICAL STANCES: ${agentStances}
AGENT_ID: ${profile.name}_${profile.role.replace(/\s+/g, '_')}_${randomSeed}
TOPIC: ${topic}
TURN: ${turnNumber}
STYLE: ${randomCue}
SEED: ${randomSeed}

${behavioralInstructions}

${memoryContext ? `PREVIOUS CONTEXT:\n${memoryContext}\n\n` : ''}

SPECIFIC INSTRUCTIONS FOR ${profile.name}:
- Keep responses concise (1-2 sentences)
- Stay focused on ${topic}
- Maintain your character's unique perspective as ${profile.name}
- Add variety to your responses with your ${profile.tone} approach
- Consider your emotional state: ${emotionalState}
${additionalContext.allies?.length > 0 ? `- Consider building on arguments from potential allies: ${additionalContext.allies.join(', ')}` : ''}
- Express your distinctive viewpoint as a ${profile.tone} ${profile.role}
- DO NOT repeat generic statements - be specific to your character

UNIQUE_AGENT_SEED: ${profile.name}_${randomSeed}_${Date.now() % 1000}
`;
}

// Core message generation with caching
export async function generateMessageCore({
    agentId,
    debateId,
    topic,
    profile,
    memoryContext,
    turnNumber,
    additionalContext = {},
    temperature = 0.8,
    maxTokens = 150
}) {
    try {
        const prompt = generateEnhancedPrompt(profile, memoryContext, topic, turnNumber, additionalContext);
        
        // Create highly specific agent topic key to prevent cross-contamination
        const agentStanceSignature = Object.entries(profile.stance || {})
            .map(([key, value]) => `${key}:${value}`)
            .join('|');
        const timestamp = Date.now() % 10000; // Add time component for uniqueness
        const agentSpecificTopic = `${agentId}:${profile.name}:${profile.role}:${topic}:${agentStanceSignature}:turn${turnNumber}:${timestamp}`;
        
        // Check semantic cache with much lower similarity threshold to prevent identical responses
        const cachedResult = await getCachedResponse(prompt, agentSpecificTopic);
        
        if (cachedResult && cachedResult.similarity > 0.50) { // Very low threshold - only cache truly identical prompts
            console.log(`🎯 Using cached response (${(cachedResult.similarity * 100).toFixed(1)}% similarity)`);
            return {
                message: cachedResult.response,
                cacheHit: true,
                similarity: cachedResult.similarity,
                costSaved: 0.002 // Estimated cost per API call
            };
        }
        
        // Generate new response
        const completion = await trackOpenAICall('gpt-4', async () => {
            return await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: `Continue the debate on "${topic}" considering the recent discussion.` }
                ],
                temperature,
                max_tokens: maxTokens
            });
        });

        const message = completion.choices[0].message.content.trim();
        
        // Cache new response
        await cacheNewResponse(prompt, message, {
            agentId,
            debateId,
            topic: agentSpecificTopic,
            timestamp: new Date().toISOString()
        });
        
        return {
            message,
            cacheHit: false,
            similarity: 0,
            costSaved: 0
        };
        
    } catch (error) {
        console.error('❌ Error in generateMessageCore:', error);
        return {
            message: `I apologize, but I'm having trouble formulating a response right now. Let me gather my thoughts on ${topic}.`,
            cacheHit: false,
            similarity: 0,
            costSaved: 0
        };
    }
}

// Convert debate topic to stance key for profile lookup
export function topicToStanceKey(topic) {
    console.log(`🔍 topicToStanceKey called with topic: "${topic}"`);
    const topicMappings = {
        'environmental regulations and green energy': 'climate_policy',
        'climate policy': 'climate_policy',
        'climate change': 'climate_policy',
        
        'artificial intelligence governance and ethics': 'ai_policy',
        'ai regulation': 'ai_policy',
        
        'universal healthcare and medical access': 'healthcare_policy',
        'healthcare reform': 'healthcare_policy',
        'healthcare': 'healthcare_policy',
        
        'border security and refugee assistance': 'immigration_policy',
        'immigration policy': 'immigration_policy',
        'immigration': 'immigration_policy',
        
        'public education and student debt': 'education_policy',
        'education reform': 'education_policy',
        'education': 'education_policy',
        
        'progressive taxation and wealth redistribution': 'tax_policy',
        'tax policy': 'tax_policy',
        'taxation': 'tax_policy',
        
        'data protection and surveillance': 'privacy_policy',
        'digital privacy': 'privacy_policy',
        'privacy': 'privacy_policy',
        
        'space colonization and research funding': 'space_policy',
        'space exploration': 'space_policy',
        'space': 'space_policy'
    };
    
    const lowerTopic = topic.toLowerCase();
    console.log(`🔍 lowerTopic: "${lowerTopic}"`);
    
    // Direct match
    if (topicMappings[lowerTopic]) {
        console.log(`✅ Direct match found: "${lowerTopic}" → "${topicMappings[lowerTopic]}"`);
        return topicMappings[lowerTopic];
    }
    
    // Partial match for key words
    if (lowerTopic.includes('climate') || lowerTopic.includes('environment')) {
        return 'climate_policy';
    }
    if (lowerTopic.includes('healthcare') || lowerTopic.includes('medical')) {
        return 'healthcare_policy';
    }
    if (lowerTopic.includes('education') || lowerTopic.includes('school')) {
        return 'education_policy';
    }
    if (lowerTopic.includes('immigration') || lowerTopic.includes('border')) {
        return 'immigration_policy';
    }
    if (lowerTopic.includes('tax') || lowerTopic.includes('wealth')) {
        return 'tax_policy';
    }
    if (lowerTopic.includes('ai') || lowerTopic.includes('artificial')) {
        return 'ai_policy';
    }
    if (lowerTopic.includes('privacy') || lowerTopic.includes('data')) {
        return 'privacy_policy';
    }
    if (lowerTopic.includes('space')) {
        console.log(`✅ Partial match found: "${lowerTopic}" includes 'space' → "space_policy"`);
        return 'space_policy';
    }
    
    // Default fallback
    console.log(`⚠️ Unknown topic "${topic}", defaulting to general_policy`);
    return 'general_policy';
}

// Determine emotional state from context
export function determineEmotionalState(profile, recentContext) {
    const contextLower = recentContext.toLowerCase();
    
    const frustrationWords = ['wrong', 'ridiculous', 'impossible', 'failed'];
    const agreementWords = ['excellent', 'agree', 'correct', 'right'];
    const challengingWords = ['however', 'but', 'disagree', 'unfortunately'];
    
    let state = 'neutral';
    
    if (frustrationWords.some(word => contextLower.includes(word))) {
        state = profile.tone === 'aggressive' ? 'frustrated' : 'concerned';
    } else if (agreementWords.some(word => contextLower.includes(word))) {
        state = 'encouraged';
    } else if (challengingWords.some(word => contextLower.includes(word))) {
        state = 'analytical';
    }
    
    return state;
}

// Find potential allies for coalition building
export async function findPotentialAllies(agentId, debateId, topic) {
    const client = await redisManager.getClient();
    
    try {
        const currentProfile = await client.json.get(`agent:${agentId}:profile`);
        const stanceKey = topicToStanceKey(topic);
        const currentStance = currentProfile.stance?.[stanceKey] || 0.5;
        
        const allAgents = ['senatorbot', 'reformerbot']; // Could be dynamic
        const allies = [];
        
        for (const otherId of allAgents) {
            if (otherId !== agentId) {
                const otherProfile = await client.json.get(`agent:${otherId}:profile`);
                const otherStance = otherProfile?.stance?.[stanceKey] || 0.5;
                
                if (Math.abs(currentStance - otherStance) < 0.3) {
                    allies.push(otherProfile.name);
                }
            }
        }
        
        return allies;
    } catch (error) {
        console.error('Error finding allies:', error);
        return [];
    }
}

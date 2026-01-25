import 'dotenv/config';
import redisManager from './redisManager.js';
import { generateMessageCore, topicToStanceKey } from './messageGenerationCore.js';
import { getCachedResponse, cacheNewResponse } from './semanticCache.js';
import OpenAI from 'openai';
import {
    trackOpenAICall,
    debateMessagesTotal
} from './metrics.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateMessage(agentId, debateId, topic = 'general policy') {
    try {
        console.log('📝 Starting message generation...', { agentId, debateId, topic });

        const profileKey = `agent:${agentId}:profile`;
        const memoryStreamKey = `debate:${debateId}:agent:${agentId}:memory`;

        // Get agent profile using Redis manager
        const profile = await redisManager.execute(async (client) => {
            return await client.json.get(profileKey);
        });

        if (!profile) {
            throw new Error(`Agent profile not found for ${agentId}`);
        }

        // Get last 3 entries from this agent's private memory
        const memories = await redisManager.execute(async (client) => {
            return await client.xRevRange(memoryStreamKey, '+', '-', { COUNT: 3 });
        });

        const memoryContext = memories
            .reverse()
            .map(entry => entry.message.content)
            .map((msg, i) => `Memory ${i + 1}: ${msg}`)
            .join('\n');

        // Get total message count for turn awareness
        const debateStreamKey = `debate:${debateId}:messages`;
        const messageStream = await redisManager.execute(async (client) => {
            return await client.xRevRange(debateStreamKey, '+', '-', { COUNT: 50 });
        });

        const totalMessages = messageStream.length;
        const turnNumber = Math.floor(totalMessages / 2) + 1;

        // Check semantic cache first for similar prompts (agent-specific)
        console.log(`🔍 Checking semantic cache for similar prompts (${agentId})...`);
        const agentSpecificTopic = `${agentId}:${topic}:${profile.name}:turn${turnNumber}`;
        
        // Construct prompt with memory + profile + dynamic topic + unique agent characteristics
        const agentUniqueStances = Object.entries(profile.stance || {})
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
            
        const prompt = `
You are ${profile.name}, a uniquely ${profile.tone} ${profile.role}.
Core beliefs: ${profile.biases.join(', ')}.
Current stances: ${agentUniqueStances}
Agent ID: ${agentId}
Debate topic: ${topic}.
Turn: ${turnNumber}
Unique perspective: ${profile.role} with ${profile.tone} approach

${memoryContext ? `Previously, you said:\n${memoryContext}\n\n` : ''}Reply with a short statement (1–2 sentences) to continue the debate on "${topic}".
Stay focused on this specific topic and maintain your character's unique perspective as ${profile.name}.
Avoid repeating previous arguments. Express your distinctive viewpoint as a ${profile.tone} ${profile.role}.`;

        const cachedResult = await getCachedResponse(prompt, agentSpecificTopic);

        let message;
        if (cachedResult) {
            message = cachedResult.response;
            console.log(`🎯 Using cached response (${(cachedResult.similarity * 100).toFixed(1)}% similarity)`);
        } else {
            // Generate message using core functionality  
            const result = await generateMessageCore({
                agentId,
                debateId,
                topic,
                profile,
                memoryContext,
                turnNumber,
                additionalContext: {}
            });
            
            message = result.message;
            
            // Cache the new response
            await cacheNewResponse(prompt, message, {
                agentId,
                debateId,
                topic: agentSpecificTopic,
                timestamp: new Date().toISOString(),
            });
        }

        console.log(`${agentId}: ${message}`);

        // Track metrics
        debateMessagesTotal.inc({ agent_id: agentId, debate_id: debateId });

        // Save to full debate stream and agent's memory stream
        await redisManager.execute(async (client) => {
            // Save to full debate stream
            await client.xAdd(debateStreamKey, '*', {
                agent_id: agentId,
                message,
                cached: (cachedResult ? 'true' : 'false'),
                similarity: (cachedResult ? cachedResult.similarity.toString() : '0')
            });

            // Save to agent's memory stream
            await client.xAdd(memoryStreamKey, '*', {
                type: 'statement',
                content: message,
            });
        });

        return {
            message,
            cacheHit: !!cachedResult,
            similarity: cachedResult ? cachedResult.similarity : 0,
            costSaved: cachedResult ? 0.002 : 0 // Estimate cost per API call
        };

    } catch (error) {
        console.error('❌ Error in generateMessage:', error);
        // Fallback response
        return {
            message: `I apologize, but I'm having trouble formulating a response right now. Let me gather my thoughts on ${topic}.`,
            cacheHit: false,
            similarity: 0,
            costSaved: 0
        };
    }
}

// Generate message without storing to streams (for server-controlled storage)
export async function generateMessageOnly(agentId, debateId, topic = 'general policy') {
    try {
        const profileKey = `agent:${agentId}:profile`;
        const memoryStreamKey = `debate:${debateId}:agent:${agentId}:memory`;

        // Get agent profile using Redis manager
        const profile = await redisManager.execute(async (client) => {
            return await client.json.get(profileKey);
        });

        if (!profile) {
            throw new Error(`Agent profile not found for ${agentId}`);
        }

        // Get last 3 entries from this agent's private memory
        const memories = await redisManager.execute(async (client) => {
            return await client.xRevRange(memoryStreamKey, '+', '-', { COUNT: 3 });
        });

        const memoryContext = memories
            .reverse()
            .map(entry => entry.message.content)
            .map((msg, i) => `Memory ${i + 1}: ${msg}`)
            .join('\n');

        // Get enhanced context for better variety
        const messageStream = await redisManager.execute(async (client) => {
            return await client.xRevRange(`debate:${debateId}:messages`, '+', '-', { COUNT: 50 });
        });

        const totalMessages = messageStream.length;
        const turnNumber = Math.floor(totalMessages / 2) + 1;

        // Add randomization elements for unique agent responses
        const randomSeed = Math.floor(Math.random() * 1000);
        const conversationalCues = [
            `Let me address this directly as a ${profile.tone} ${profile.role}:`,
            `I want to emphasize from my perspective as ${profile.name}:`,
            `My position as a ${profile.role} is clear:`,
            `Here's what I believe as ${profile.name}:`,
            `From my ${profile.tone} perspective:`,
        ];
        const randomCue = conversationalCues[randomSeed % conversationalCues.length];

        // Get agent's unique stance signature
        const agentStanceSignature = Object.entries(profile.stance || {})
            .map(([key, value]) => `${key}:${value}`)
            .join('|');

        // Construct prompt with memory + profile + dynamic topic + unique identifiers
        const prompt = `
You are ${profile.name}, a distinctively ${profile.tone} ${profile.role}.
Core beliefs: ${profile.biases.join(', ')}.
Stance signature: ${agentStanceSignature}
Agent identifier: ${agentId}
Debate topic: ${topic}.
Turn: ${turnNumber}
Conversational style: ${randomCue}
Unique seed: ${randomSeed}

${memoryContext
                ? `Previously, you said:\n${memoryContext}\n\n`
                : ''
            }Reply with a short statement (1–2 sentences) to continue the debate on "${topic}".
Stay focused on this specific topic and maintain your character's unique perspective as ${profile.name}.
Avoid repeating previous arguments. Express your distinctive ${profile.tone} viewpoint.
Seed: ${randomSeed}
`;

        // Check semantic cache for similar prompts (agent-specific with unique identifiers)
        console.log(`🔍 Checking semantic cache for similar prompts (${agentId})...`);
        const agentSpecificTopic = `${agentId}:${topic}:${profile.name}:${agentStanceSignature}:${randomSeed}`;
        const cachedResult = await getCachedResponse(prompt, agentSpecificTopic);

        let message;
        if (cachedResult) {
            message = cachedResult.response;
            console.log(`🎯 Using cached response (${(cachedResult.similarity * 100).toFixed(1)}% similarity)`);
        } else {
            // Generate AI message (cache miss)
            console.log('🤖 Generating new AI response...');
            const chatResponse = await trackOpenAICall('gpt-4', async () => {
                return await openai.chat.completions.create({
                    model: 'gpt-4',
                    messages: [
                        { role: 'system', content: prompt },
                        { role: 'user', content: `What's your perspective on "${topic}"? Keep it brief and in character. ${randomCue}` },
                    ],
                    temperature: 0.8,
                });
            });

            message = chatResponse.choices[0].message.content.trim();

            // Cache the new response
            await cacheNewResponse(prompt, message, {
                agentId,
                debateId,
                topic: agentSpecificTopic,
                timestamp: new Date().toISOString(),
            });
        }

        // Track metrics
        debateMessagesTotal.inc({ agent_id: agentId, debate_id: debateId });

        return {
            message,
            cacheHit: !!cachedResult,
            similarity: cachedResult ? cachedResult.similarity : 0,
            costSaved: cachedResult ? 0.002 : 0
        };

    } catch (error) {
        console.error('❌ Error in generateMessageOnly:', error);
        return {
            message: `I apologize, but I'm having trouble formulating a response right now. Let me gather my thoughts on ${topic}.`,
            cacheHit: false,
            similarity: 0,
            costSaved: 0
        };
    }
}

// Enhanced message generation with better AI context
export async function generateEnhancedMessage(agentId, debateId, topic = 'general policy', conversationHistory = []) {
    try {
        console.log('📝 Starting enhanced message generation...', { agentId, debateId, topic });

        // Check cache first
        const promptForCache = `Generate a political debate message for agent ${agentId} on topic: ${topic}`;
        const cachedResponse = await getCachedResponse(promptForCache);

        if (cachedResponse) {
            console.log('🎯 Cache hit! Using cached response');
            return cachedResponse;
        }

        console.log('💭 Cache miss - generating new response');

        const profileKey = `agent:${agentId}:profile`;
        const messagesKey = `debate:${debateId}:messages`;

        // Get agent profile and recent conversation
        const [profile, messages] = await Promise.all([
            redisManager.execute(async (client) => {
                return await client.json.get(profileKey);
            }),
            redisManager.execute(async (client) => {
                return await client.xRevRange(messagesKey, '+', '-', { COUNT: 10 });
            })
        ]);

        if (!profile) {
            throw new Error(`Agent profile not found for ${agentId}`);
        }

        // Build conversation context
        const recentMessages = messages.map(msg => {
            const data = msg.message;
            return `${data.agent_id}: ${data.message}`;
        }).reverse().join('\n');

        // Generate response
        const systemPrompt = `You are ${profile.name}, a ${profile.role}. Your political stance: ${profile.stance || 'moderate'}. 
Political positions: ${JSON.stringify(profile.positions || {}, null, 2)}
Your personality: ${profile.personality || 'analytical and thoughtful'}
Your speaking style: ${profile.speaking_style || 'formal and measured'}
Debate style: ${profile.debate_style || 'evidence-based and respectful'}

IMPORTANT: Keep responses under 200 words. Be engaging but concise. Reference your political positions when relevant.`;

        const userPrompt = `Topic: ${topic}

Recent conversation:
${recentMessages}

Respond as ${profile.name} with your unique perspective on this topic. Stay true to your political positions and personality.`;

        const completion = await trackOpenAICall('gpt-4', async () => {
            return await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 300,
                temperature: 0.8
            });
        });

        const response = completion.choices[0].message.content;
        console.log('✅ Generated new response');

        // Cache the new response
        await cacheNewResponse(promptForCache, response);

        return response;

    } catch (error) {
        console.error('❌ Error in generateEnhancedMessage:', error);
        // Fallback response
        return `I apologize, but I'm having trouble formulating a response right now. Let me gather my thoughts on ${topic}.`;
    }
}

export default generateMessage;

// Enhanced AI Features for StanceStream - Contest Improvements

import 'dotenv/config';
import redisManager from './redisManager.js';
import { generateMessageCore, determineEmotionalState, findPotentialAllies, topicToStanceKey } from './messageGenerationCore.js';
import { debateStanceShifts } from './metrics.js';

// Import fact-checking and sentiment analysis
async function findClosestFact(messageText) {
    try {
        const { findClosestFact } = await import('./factChecker.js');
        return await findClosestFact(messageText);
    } catch (error) {
        console.warn('⚠️ Fact checker not available:', error.message);
        return { content: null, score: 1.0 };
    }
}

async function analyzeSentiment(messageText) {
    try {
        const { analyzeSentiment } = await import('./sentimentAnalysis.js');
        return await analyzeSentiment(messageText);
    } catch (error) {
        console.warn('⚠️ Sentiment analyzer not available:', error.message);
        return { sentiment: 'neutral', confidence: 0.5, model: 'fallback' };
    }
}
export async function generateEnhancedMessage(agentId, debateId, topic = 'general policy') {
    try {
        const profile = await redisManager.execute(async (client) => {
            return await client.json.get(`agent:${agentId}:profile`);
        });
        
        // Get message count and context
        const debateMessages = await redisManager.execute(async (client) => {
            return await client.xRevRange(`debate:${debateId}:messages`, '+', '-', { COUNT: 10 });
        });
        
        const recentContext = debateMessages
            .reverse()
            .map(entry => `${entry.message.agent_id}: ${entry.message.message}`)
            .join('\n');

        // Get turn number
        const totalMessages = debateMessages.length;
        const turnNumber = Math.floor(totalMessages / 2) + 1;

        // Get emotional state and allies
        const emotionalState = determineEmotionalState(profile, recentContext);
        const allies = await findPotentialAllies(agentId, debateId, topic);

        // Use core generation with enhanced context
        const result = await generateMessageCore({
            agentId,
            debateId,
            topic,
            profile,
            memoryContext: recentContext,
            turnNumber,
            additionalContext: {
                emotionalState,
                allies
            },
            temperature: 0.9,
            maxTokens: 150
        });

        // Return consistent object format
        return {
            message: result.message,
            cacheHit: result.cacheHit || false,
            similarity: result.similarity || 0,
            costSaved: result.costSaved || 0,
            metadata: {
                emotionalState,
                allies: allies.join(', '),
                turnNumber,
                temperature: 0.9,
                agentId,
                debateId,
                topic,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        throw error;
    }
}

// Enhanced message generation without storing to streams (for server-controlled storage)
export async function generateEnhancedMessageOnly(agentId, debateId, topic = 'general policy') {
    try {
        // Get agent profile and debate context using Redis manager
        const profile = await redisManager.execute(async (client) => {
            return await client.json.get(`agent:${agentId}:profile`);
        });
        
        if (!profile) {
            throw new Error(`No profile found for agent: ${agentId}`);
        }

        // Get recent debate messages for context
        const debateMessages = await redisManager.execute(async (client) => {
            return await client.xRevRange(`debate:${debateId}:messages`, '+', '-', { COUNT: 10 });
        });
        const recentContext = debateMessages.reverse().map(entry => 
            `${entry.message.agent_id}: ${entry.message.message}`
        ).join('\n');

        // Get emotional state and allies
        const emotionalState = determineEmotionalState(profile, recentContext);
        const allies = await findPotentialAllies(agentId, debateId, topic);

        // Calculate turn number for variation
        const totalMessages = debateMessages.length;
        const turnNumber = Math.floor(totalMessages / 2) + 1;

        // Calculate base temperature with emotional state modifier
        const baseTemperature = 0.7 + (totalMessages * 0.05) + (Math.random() * 0.1);
        const adjustedTemperature = Math.min(baseTemperature + (emotionalState === 'passionate' ? 0.2 : 0), 1.0);

        // Use core generation with enhanced context
        const result = await generateMessageCore({
            agentId,
            debateId,
            topic,
            profile,
            memoryContext: recentContext,
            turnNumber,
            additionalContext: {
                emotionalState,
                allies
            },
            temperature: adjustedTemperature,
            maxTokens: 200
        });

        // Integrate fact-checking and sentiment analysis
        const [factCheck, sentiment] = await Promise.all([
            findClosestFact(result.message).catch(err => {
                console.warn('⚠️ Fact check failed:', err.message);
                return { content: null, score: 1.0 };
            }),
            analyzeSentiment(result.message).catch(err => {
                console.warn('⚠️ Sentiment analysis failed:', err.message);
                return { sentiment: 'neutral', confidence: 0.5, model: 'fallback' };
            })
        ]);

        // Calculate fact check confidence (inverse of distance score)
        const factCheckConfidence = factCheck.content ? (1 - factCheck.score) : 0;

        // Return consistent object format with all metadata
        return {
            message: result.message,
            cacheHit: result.cacheHit || false,
            similarity: result.similarity || 0,
            costSaved: result.costSaved || 0,
            factCheck: {
                fact: factCheck.content,
                score: factCheckConfidence,
                confidence: Math.round(factCheckConfidence * 100)
            },
            sentiment: {
                sentiment: sentiment.sentiment || 'neutral',
                confidence: sentiment.confidence || 0.5,
                model: sentiment.model || 'enhanced'
            },
            metadata: {
                emotionalState,
                allies: allies.join(', '),
                turnNumber,
                temperature: adjustedTemperature,
                agentId,
                debateId,
                topic,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        throw error;
    }
}

// Extract references from previous messages (utility function)
export function extractReferences(message, recentContext) {
    const references = [];
    const contextLines = recentContext.split('\n');
    
    // Simple reference detection
    for (const line of contextLines) {
        if (line.includes('senatorbot:') || line.includes('reformerbot:')) {
            const agentName = line.split(':')[0];
            if (message.toLowerCase().includes(agentName.toLowerCase())) {
                references.push(agentName);
            }
        }
    }
    
    return references.join(', ');
}

// Advanced stance evolution based on debate dynamics
export async function updateStanceBasedOnDebate(agentId, debateId, topic) {
    try {
        const [profile, debateMessages] = await Promise.all([
            redisManager.execute(async (client) => {
                return await client.json.get(`agent:${agentId}:profile`);
            }),
            redisManager.execute(async (client) => {
                return await client.xRevRange(`debate:${debateId}:messages`, '+', '-', { COUNT: 20 });
            })
        ]);
        
        const stanceKey = topicToStanceKey(topic);
        const currentStance = profile.stance?.[stanceKey] || 0.5;
        
        // Analyze recent messages
        let stanceShift = await analyzeMessagesForStanceShift(agentId, debateMessages);
        
        // Apply agent-specific patterns and personality factors
        stanceShift = applyAgentPersonalityModifiers(agentId, profile, stanceShift);
        
        const newStance = Math.max(0, Math.min(1, currentStance + stanceShift));
        
        // Update profile
        profile.stance[stanceKey] = newStance;
        await redisManager.execute(async (client) => {
            await client.json.set(`agent:${agentId}:profile`, '$', profile);
        });
        
        // Store in TimeSeries for tracking
        const tsKey = `debate:${debateId}:agent:${agentId}:stance:${stanceKey}`;
        try {
            await redisManager.execute(async (client) => {
                await client.ts.add(tsKey, '*', parseFloat(newStance).toString());
            });
        } catch (tsError) {
            console.log(`⚠️ TimeSeries add failed: ${tsError.message}`);
        }

        // Track stance shift metrics (only count meaningful shifts > 0.05)
        if (Math.abs(stanceShift) > 0.05) {
            debateStanceShifts.inc({ agent_id: agentId, topic: stanceKey });
        }

        return { oldStance: currentStance, newStance, shift: stanceShift };
        
    } catch (error) {
        throw error;
    }
}

// Helper function to analyze messages and calculate initial stance shift
async function analyzeMessagesForStanceShift(agentId, messages) {
    let strongArgumentsFor = 0;
    let strongArgumentsAgainst = 0;
    
    for (const entry of messages) {
        if (entry.message.agent_id !== agentId) {
            const message = entry.message.message.toLowerCase();
            
            // Check for strong evidence-based arguments
            const strongIndicators = ['evidence', 'data', 'research', 'study', 'proven'];
            const isStrong = strongIndicators.some(word => message.includes(word));
            
            if (isStrong) {
                if (message.includes('benefit') || message.includes('improve')) {
                    strongArgumentsFor++;
                } else if (message.includes('harmful') || message.includes('dangerous')) {
                    strongArgumentsAgainst++;
                }
            }
        }
    }
    
    // Calculate base shift
    if (strongArgumentsFor > strongArgumentsAgainst) {
        return 0.15; // Noticeable positive shift
    } else if (strongArgumentsAgainst > strongArgumentsFor) {
        return -0.15; // Noticeable negative shift
    }
    return (Math.random() - 0.5) * 0.1; // Small random variation
}

// Helper function to apply agent-specific modifiers
function applyAgentPersonalityModifiers(agentId, profile, baseShift) {
    let agentModifier = 1.0;
    
    // Apply agent-specific behavior patterns
    if (agentId === 'senatorbot') {
        // More conservative change pattern
        agentModifier = 0.7 + (Math.sin(Date.now() / 10000) * 0.3);
    } else if (agentId === 'reformerbot') {
        // More dynamic change pattern
        agentModifier = 1.3 + (Math.cos(Date.now() / 8000) * 0.4);
    }
    
    // Apply personality resistance
    const personalityFactor = profile.tone === 'stubborn' ? 0.5 : 1.0;
    
    return baseShift * agentModifier * personalityFactor;
}

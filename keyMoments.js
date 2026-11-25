// Key Moments Detection & Storage System
// Stores debate summaries in RedisJSON only on major events: stance flip >0.3 or fact-check <0.7
// Demonstrates intelligent Redis JSON usage tied to actual app logic

import { createClient } from 'redis';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

import redisManager from './redisManager.js';
import { OPENAI_MODEL, chatParams } from './openaiModel.js';

class KeyMomentsDetector {
    constructor() {
        this.previousStances = new Map(); // Track stance history for flip detection
        this.debateMemoryThresholds = new Map(); // Track memory significance per debate
        this.isConnected = false;
    }

    async connect() {
        const client = await redisManager.getClient();
        this.isConnected = true;
        return client;
    }

    async cleanup() {
        try {
            if (this.isConnected) {
                this.previousStances.clear();
                this.debateMemoryThresholds.clear();
                this.isConnected = false;
                console.log('🔌 KeyMomentsDetector cleanup complete');
            }
        } catch (error) {
            console.error('Error during KeyMomentsDetector cleanup:', error);
        }
    }

    // Detect if a stance change represents a significant flip (>0.3 change)
    async detectStanceFlip(agentId, debateId, topic, newStance) {
        try {
            const client = await this.connect();
            
            const stanceKey = `${debateId}:${agentId}:${topic}`;
            const previousStance = this.previousStances.get(stanceKey) || newStance;
            const stanceChange = Math.abs(newStance - previousStance);
            
            // Update our tracking
            this.previousStances.set(stanceKey, newStance);
            
            // Significant stance flip threshold: >0.3 change
            const isSignificantFlip = stanceChange > 0.3;
            
            if (isSignificantFlip) {
                console.log(`🔄 SIGNIFICANT STANCE FLIP detected for ${agentId}: ${previousStance.toFixed(3)} → ${newStance.toFixed(3)} (Δ${stanceChange.toFixed(3)})`);
                
                return {
                    type: 'stance_flip',
                    agentId,
                    debateId,
                    topic,
                    previousStance,
                    newStance,
                    change: stanceChange,
                    significance: 'major',
                    timestamp: new Date().toISOString()
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error detecting stance flip:', error);
            return null;
        }
    }

    // Detect if a fact-check score indicates questionable claims (<0.7)
    detectQuestionableClaim(message, factCheckScore, debateId, agentId) {
        // Low confidence fact-check threshold: <0.7
        const isQuestionable = factCheckScore < 0.7;
        
        if (isQuestionable) {
            console.log(`⚠️ QUESTIONABLE CLAIM detected from ${agentId}: Score ${factCheckScore.toFixed(3)}`);
            
            return {
                type: 'questionable_claim',
                agentId,
                debateId,
                message: message.substring(0, 200) + (message.length > 200 ? '...' : ''),
                factCheckScore,
                significance: factCheckScore < 0.5 ? 'critical' : 'moderate',
                timestamp: new Date().toISOString()
            };
        }
        
        return null;
    }

    // Check if debate has reached memory significance threshold
    async checkMemorySignificance(debateId, messageCount) {
        try {
            const client = await this.connect();
            
            // Dynamic thresholds based on debate activity
            const baseThreshold = 10; // Base memory threshold
            const currentThreshold = this.debateMemoryThresholds.get(debateId) || baseThreshold;
            
            // Memory becomes significant at exponential intervals: 10, 25, 50, 100...
            const nextThreshold = Math.floor(currentThreshold * (currentThreshold < 25 ? 2.5 : 2));
            
            if (messageCount >= currentThreshold) {
                this.debateMemoryThresholds.set(debateId, nextThreshold);
                
                console.log(`📊 MEMORY THRESHOLD reached for debate ${debateId}: ${messageCount} messages (next: ${nextThreshold})`);
                
                return {
                    type: 'memory_milestone',
                    debateId,
                    messageCount,
                    threshold: currentThreshold,
                    nextThreshold,
                    significance: messageCount >= 50 ? 'major' : 'moderate',
                    timestamp: new Date().toISOString()
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error checking memory significance:', error);
            return null;
        }
    }

    // Generate AI-powered summary for a key moment
    async generateKeyMomentSummary(momentData, recentMessages = []) {
        try {
            let summaryPrompt = '';
            
            switch (momentData.type) {
                case 'stance_flip':
                    summaryPrompt = `A significant stance change occurred in the debate. Agent ${momentData.agentId} shifted their position on ${momentData.topic} from ${momentData.previousStance.toFixed(2)} to ${momentData.newStance.toFixed(2)} (change of ${momentData.change.toFixed(2)}). Based on recent context, provide a brief explanation of what likely caused this major shift in position.`;
                    break;
                    
                case 'questionable_claim':
                    summaryPrompt = `Agent ${momentData.agentId} made a statement with low fact-check confidence (${(momentData.factCheckScore * 100).toFixed(1)}%): "${momentData.message}". Analyze why this claim might be questionable and what it reveals about the debate dynamics.`;
                    break;
                    
                case 'memory_milestone':
                    summaryPrompt = `Debate ${momentData.debateId} has reached ${momentData.messageCount} messages, representing a significant memory milestone. Summarize the key developments and turning points that have emerged so far in this extended discussion.`;
                    break;
                    
                default:
                    summaryPrompt = `Analyze this significant debate moment and explain its importance: ${JSON.stringify(momentData)}`;
            }
            
            // Include recent context if available
            if (recentMessages.length > 0) {
                const context = recentMessages.slice(-3).map(msg => 
                    `${msg.agentId}: ${msg.message.substring(0, 100)}...`
                ).join('\n');
                summaryPrompt += `\n\nRecent context:\n${context}`;
            }
            
            const response = await openai.chat.completions.create({
                model: OPENAI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert political debate analyst. Provide concise, insightful summaries of key debate moments in 2-3 sentences. Focus on the significance and implications of the event.'
                    },
                    {
                        role: 'user',
                        content: summaryPrompt
                    }
                ],
                ...chatParams({ maxTokens: 150, temperature: 0.7 })
            });
            
            return response.choices[0].message.content.trim();
            
        } catch (error) {
            console.error('Error generating AI summary:', error);
            // Fallback to template-based summary
            return this.generateFallbackSummary(momentData);
        }
    }

    // Fallback summary generation without AI
    generateFallbackSummary(momentData) {
        switch (momentData.type) {
            case 'stance_flip':
                return `${momentData.agentId} dramatically shifted their stance on ${momentData.topic} by ${(momentData.change * 100).toFixed(1)}%, indicating a major change in perspective during the debate.`;
                
            case 'questionable_claim':
                return `${momentData.agentId} made a claim with only ${(momentData.factCheckScore * 100).toFixed(1)}% confidence, suggesting the statement may be disputed or require further verification.`;
                
            case 'memory_milestone':
                return `The debate has reached ${momentData.messageCount} messages, representing an extended and substantive discussion with multiple key exchanges between the participants.`;
                
            default:
                return `A significant moment occurred in the debate requiring attention and analysis.`;
        }
    }

    // Store key moment in RedisJSON with intelligent data structure
    async storeKeyMoment(debateId, momentData, summary, recentMessages = []) {
        try {
            const client = await this.connect();
            
            const momentId = `moment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const keyMomentKey = `debate:${debateId}:key_moments`;
            
            const keyMoment = {
                id: momentId,
                type: momentData.type,
                significance: momentData.significance,
                summary,
                timestamp: momentData.timestamp,
                metadata: {
                    ...momentData,
                    messageContext: recentMessages.slice(-2).map(msg => ({
                        agentId: msg.agentId,
                        message: msg.message.substring(0, 100),
                        timestamp: msg.timestamp
                    }))
                },
                analysis: {
                    generated_at: new Date().toISOString(),
                    context_messages: recentMessages.length,
                    ai_generated: summary.length > 50 // Distinguish AI vs fallback
                }
            };
            
            // Get existing key moments or initialize
            let existingMoments = await client.json.get(keyMomentKey);
            if (!existingMoments) {
                existingMoments = {
                    debateId,
                    created_at: new Date().toISOString(),
                    moments: [],
                    stats: {
                        total_moments: 0,
                        stance_flips: 0,
                        questionable_claims: 0,
                        memory_milestones: 0
                    }
                };
            }
            
            // Add new moment and update stats
            existingMoments.moments.push(keyMoment);
            existingMoments.stats.total_moments++;
            existingMoments.stats[`${momentData.type}s`] = (existingMoments.stats[`${momentData.type}s`] || 0) + 1;
            existingMoments.updated_at = new Date().toISOString();
            
            // Keep only last 20 moments to prevent excessive growth
            if (existingMoments.moments.length > 20) {
                existingMoments.moments = existingMoments.moments.slice(-20);
            }
            
            // Store in RedisJSON
            await client.json.set(keyMomentKey, '$', existingMoments);
            
            console.log(`💾 Key moment stored: ${momentData.type} for debate ${debateId}`);
            
            return {
                momentId,
                keyMoment,
                totalMoments: existingMoments.moments.length
            };
            
        } catch (error) {
            console.error('Error storing key moment:', error);
            throw error;
        }
    }

    // Get key moments for a debate
    async getKeyMoments(debateId, limit = 10) {
        try {
            const client = await this.connect();
            
            const keyMomentKey = `debate:${debateId}:key_moments`;
            const keyMomentsData = await client.json.get(keyMomentKey);
            
            if (!keyMomentsData) {
                return {
                    debateId,
                    moments: [],
                    stats: { total_moments: 0 }
                };
            }
            
            // Return most recent moments first
            const recentMoments = keyMomentsData.moments.slice(-limit).reverse();
            
            return {
                debateId,
                moments: recentMoments,
                stats: keyMomentsData.stats,
                created_at: keyMomentsData.created_at,
                updated_at: keyMomentsData.updated_at
            };
            
        } catch (error) {
            console.error('Error getting key moments:', error);
            return { debateId, moments: [], stats: { total_moments: 0 } };
        }
    }

    // Process a debate event and potentially create a key moment
    async processDebateEvent(eventData) {
        try {
            const { type, debateId, agentId, message, factCheckScore, stance, recentMessages = [] } = eventData;
            
            let detectedMoment = null;
            
            // Check for stance flip
            if (stance && stance.value !== undefined) {
                detectedMoment = await this.detectStanceFlip(agentId, debateId, stance.topic || 'general', stance.value);
            }
            
            // Check for questionable claim
            if (!detectedMoment && factCheckScore !== undefined) {
                detectedMoment = this.detectQuestionableClaim(message, factCheckScore, debateId, agentId);
            }
            
            // Check for memory milestone
            if (!detectedMoment && recentMessages.length > 0) {
                const messageCount = recentMessages.length;
                detectedMoment = await this.checkMemorySignificance(debateId, messageCount);
            }
            
            // If we detected a significant moment, process it
            if (detectedMoment) {
                const summary = await this.generateKeyMomentSummary(detectedMoment, recentMessages);
                const result = await this.storeKeyMoment(debateId, detectedMoment, summary, recentMessages);
                
                console.log(`🔍 KEY MOMENT CREATED: ${detectedMoment.type} in debate ${debateId}`);
                
                return {
                    created: true,
                    moment: result.keyMoment,
                    momentId: result.momentId,
                    totalMoments: result.totalMoments
                };
            }
            
            return { created: false };
            
        } catch (error) {
            console.error('Error processing debate event:', error);
            return { created: false, error: error.message };
        }
    }

    // Add disconnect method for proper cleanup
    async disconnect() {
        try {
            const client = await this.connect();
            // Clear in-memory data
            this.previousStances.clear();
            this.debateMemoryThresholds.clear();
            console.log('🔌 KeyMomentsDetector cleanup complete');
        } catch (error) {
            console.error('Error during KeyMomentsDetector cleanup:', error);
        }
    }

    // Get aggregated key moments across all debates
    async getAllKeyMoments(limit = 20) {
        try {
            const client = await this.connect();
            
            // Find all debate key moment keys
            const keys = await client.keys('debate:*:key_moments');
            const allMoments = [];
            
            for (const key of keys) {
                const keyMomentsData = await client.json.get(key);
                if (keyMomentsData && keyMomentsData.moments) {
                    allMoments.push(...keyMomentsData.moments.map(moment => ({
                        ...moment,
                        debateId: keyMomentsData.debateId
                    })));
                }
            }
            
            // Sort by timestamp and return most recent
            allMoments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            return allMoments.slice(0, limit);
            
        } catch (error) {
            console.error('Error getting all key moments:', error);
            return [];
        }
    }
}

// Export singleton instance
const keyMomentsDetector = new KeyMomentsDetector();

// Helper functions for easy integration
export async function processDebateEvent(eventData) {
    return await keyMomentsDetector.processDebateEvent(eventData);
}

export async function getKeyMoments(debateId, limit = 10) {
    return await keyMomentsDetector.getKeyMoments(debateId, limit);
}

export async function getAllKeyMoments(limit = 20) {
    return await keyMomentsDetector.getAllKeyMoments(limit);
}

export async function disconnect() {
    return await keyMomentsDetector.cleanup();
}

export default keyMomentsDetector;

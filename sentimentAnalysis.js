import { createClient } from 'redis';
import redisManager from './redisManager.js';
// Use TensorFlow.js browser version for now due to Node.js binding issues
// import tf from '@tensorflow/tfjs-node';

/**
 * Lightweight Sentiment Analysis for StanceStream
 * Uses rule-based analysis with Redis TimeSeries storage
 * Ready for TensorFlow.js upgrade when Node.js bindings are fixed
 */
class SentimentAnalyzer {
    constructor() {
        this.client = null;
        this.model = null;
        this.modelLoaded = false;
    }

    async initialize() {
        try {
            this.client = createClient({ url: process.env.REDIS_URL });
            this.client.on('error', (err) => console.error('🔴 Redis client error:', err.message));
            await this.client.connect();
            console.log('📊 Redis client connected for sentiment analysis');

            // Initialize rule-based sentiment for now
            this.modelLoaded = true;
            console.log('✅ Sentiment analyzer initialized with rule-based analysis');
            return true;
        } catch (error) {
            console.log('⚠️ Redis not available for sentiment analysis, using offline mode:', error.message);
            this.client = null;
            this.modelLoaded = true; // Rule-based works offline
            console.log('✅ Sentiment analyzer initialized in offline mode');
            return true;
        }
    }

    async analyzeSentiment(message, debateId = 'general', agentId = 'unknown') {
        console.log(`📊 SENTIMENT: Analyzing message from ${agentId}: "${message.substring(0, 50)}..."`);
        
        try {
            // Use advanced rule-based sentiment analysis for now
            const result = this.advancedSentimentAnalysis(message);
            const { confidence, sentiment } = result;
            
            console.log(`🤖 Advanced rule-based analysis: ${sentiment} (${confidence.toFixed(3)})`);

            // Store confidence in Redis for sparkline history (fallback to JSON since TimeSeries might not be available)
            const timestamp = Date.now();
            
            try {
                // Use centralized Redis manager for storage
                const fallbackKey = `sentiment_history:${debateId}:${agentId}`;
                await redisManager.execute(async (client) => {
                    const history = await client.get(fallbackKey).then(data => 
                        data ? JSON.parse(data) : []
                    ).catch(() => []);
                    
                    history.push({ timestamp, confidence });
                    // Keep only last 20 data points for sparklines
                    if (history.length > 20) history.shift();
                    
                    await client.set(fallbackKey, JSON.stringify(history));
                    console.log(`💾 Stored confidence ${confidence.toFixed(3)} in JSON storage: ${fallbackKey}`);
                });
            } catch (storageError) {
                console.log('⚠️ Storage failed, continuing without persistence:', storageError.message);
            }

            return {
                confidence: Math.round(confidence * 1000) / 1000, // Round to 3 decimal places
                sentiment,
                timestamp,
                agentId,
                debateId
            };
        } catch (error) {
            console.error('❌ Error in sentiment analysis:', error);
            return {
                confidence: 0.5,
                sentiment: 'neutral',
                timestamp: Date.now(),
                agentId,
                debateId
            };
        }
    }

    advancedSentimentAnalysis(message) {
        // Advanced rule-based sentiment analysis with multiple techniques
        const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'amazing', 'support', 'agree', 'beneficial', 'strong', 'effective', 'positive', 'outstanding', 'fantastic', 'approve'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disagree', 'oppose', 'harmful', 'wrong', 'weak', 'ineffective', 'negative', 'disappointing', 'reject', 'condemn'];
        const intensifiers = ['very', 'extremely', 'highly', 'incredibly', 'absolutely', 'completely', 'totally', 'utterly'];
        const negations = ['not', "don't", "won't", "can't", "shouldn't", "wouldn't", "couldn't", 'never', 'nothing', 'nobody', 'nowhere'];
        
        const words = message.toLowerCase().split(/\s+/);
        let score = 0.5; // Start neutral
        let intensifierMultiplier = 1;
        let negationFlag = false;
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            
            // Check for intensifiers
            if (intensifiers.includes(word)) {
                intensifierMultiplier = 1.5;
                continue;
            }
            
            // Check for negations
            if (negations.includes(word)) {
                negationFlag = true;
                continue;
            }
            
            // Sentiment scoring
            let wordScore = 0;
            if (positiveWords.includes(word)) {
                wordScore = 0.1 * intensifierMultiplier;
            } else if (negativeWords.includes(word)) {
                wordScore = -0.1 * intensifierMultiplier;
            }
            
            // Apply negation
            if (negationFlag && wordScore !== 0) {
                wordScore = -wordScore;
                negationFlag = false; // Reset after one word
            }
            
            score += wordScore;
            intensifierMultiplier = 1; // Reset multiplier
        }
        
        // Check for punctuation emphasis
        const exclamationCount = (message.match(/!/g) || []).length;
        const questionCount = (message.match(/\?/g) || []).length;
        
        if (exclamationCount > 0) {
            score += (score > 0.5 ? 0.05 : -0.05) * exclamationCount;
        }
        
        // Caps intensity
        const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
        if (capsRatio > 0.3) { // High caps ratio
            score += (score > 0.5 ? 0.1 : -0.1);
        }
        
        // Clamp score between 0 and 1
        score = Math.max(0.1, Math.min(0.9, score));
        
        // Add some randomness for variety
        score += (Math.random() - 0.5) * 0.1;
        score = Math.max(0.1, Math.min(0.9, score));
        
        let sentiment = 'neutral';
        if (score > 0.6) sentiment = 'positive';
        else if (score < 0.4) sentiment = 'negative';
        
        return { confidence: score, sentiment };
    }

    ruleBasedSentiment(message) {
        const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'amazing', 'support', 'agree', 'beneficial', 'strong', 'effective'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disagree', 'oppose', 'harmful', 'wrong', 'weak', 'ineffective'];
        
        const words = message.toLowerCase().split(/\s+/);
        let positiveCount = 0;
        let negativeCount = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveCount++;
            if (negativeWords.includes(word)) negativeCount++;
        });
        
        const total = positiveCount + negativeCount;
        if (total === 0) {
            return { confidence: 0.5, sentiment: 'neutral' };
        }
        
        const confidence = (positiveCount / total * 0.7) + 0.3; // Scale to 0.3-1.0 range
        let sentiment = 'neutral';
        if (confidence > 0.6) sentiment = 'positive';
        else if (confidence < 0.4) sentiment = 'negative';
        
        return { confidence, sentiment };
    }

    async getConfidenceHistory(debateId, agentId, limit = 20) {
        try {
            // Use centralized Redis manager
            const fallbackKey = `sentiment_history:${debateId}:${agentId}`;
            const data = await redisManager.execute(async (client) => {
                return await client.get(fallbackKey);
            });
            
            if (data) {
                const history = JSON.parse(data);
                return history.slice(-limit); // Get last N entries
            }
        } catch (error) {
            console.log('⚠️ History retrieval failed:', error.message);
        }
        
        return [];
    }

    async cleanup() {
        if (this.client) {
            await this.client.quit();
            console.log('🔌 Redis client disconnected');
        }
    }
}

// Export singleton instance
const sentimentAnalyzer = new SentimentAnalyzer();
export default sentimentAnalyzer;

// Initialize on module load
sentimentAnalyzer.initialize().catch(error => {
    console.error('Failed to initialize sentiment analyzer:', error);
});

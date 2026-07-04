// Advanced Multi-Source Fact Checking System - Contest Enhancement
// Demonstrates sophisticated Redis Vector Search with multiple knowledge bases

import 'dotenv/config';
import { createClient } from 'redis';
import { OpenAIEmbeddings } from '@langchain/openai';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const embeddings = new OpenAIEmbeddings();

class AdvancedFactChecker {
    constructor() {
        this.client = null;
        this.knowledgeBases = {
            'scientific': 'scientific-facts-index',
            'political': 'political-facts-index', 
            'economic': 'economic-facts-index',
            'general': 'facts-index' // Your existing index
        };
        this.confidenceThresholds = {
            'high': 0.9,
            'medium': 0.7,
            'low': 0.5
        };
    }

    async connect() {
        if (!this.client) {
            this.client = createClient({ url: process.env.REDIS_URL });
            this.client.on('error', (err) => console.error('🔴 Redis client error:', err.message));
            await this.client.connect();
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
        }
    }

    // 🔍 Enhanced fact checking with multiple sources and cross-verification
    async checkFactAdvanced(statement, context = {}) {
        await this.connect();
        
        try {
            console.log(`🔍 ADVANCED FACT CHECK: "${statement.substring(0, 100)}..."`);
            
            // 1. Generate embedding for the statement
            const statementEmbedding = await this.generateEmbedding(statement);
            
            // 2. Determine best knowledge bases to search based on context
            const relevantBases = await this.selectRelevantKnowledgeBases(statement, context);
            
            // 3. Search multiple knowledge bases concurrently
            const searchResults = await this.searchMultipleBases(statementEmbedding, relevantBases);
            
            // 4. Cross-verify results across sources
            const verification = await this.crossVerifyResults(searchResults, statement);
            
            // 5. Generate AI-powered analysis
            const aiAnalysis = await this.generateAIAnalysis(statement, searchResults, verification);
            
            // 6. Calculate composite confidence score
            const compositeScore = this.calculateCompositeConfidence(verification, aiAnalysis);
            
            // 7. Store fact check result with enhanced metadata
            await this.storeEnhancedFactCheck(statement, compositeScore, searchResults, verification, aiAnalysis);
            
            const result = {
                confidence: compositeScore.overall,
                level: this.getConfidenceLevel(compositeScore.overall),
                sources: searchResults.length,
                crossVerified: verification.verified,
                details: {
                    searchResults,
                    verification,
                    aiAnalysis: aiAnalysis.summary,
                    breakdown: compositeScore.breakdown
                },
                metadata: {
                    knowledgeBasesUsed: relevantBases,
                    totalSources: searchResults.length,
                    verificationMethod: 'multi-source-cross-verification',
                    confidenceFactors: compositeScore.factors
                }
            };
            
            console.log(`✅ Advanced fact check complete: ${result.level} confidence (${result.confidence.toFixed(3)})`);
            return result;
            
        } catch (error) {
            console.error('❌ Advanced fact checking error:', error);
            return this.getFallbackResult(statement);
        }
    }

    // 🧠 Select relevant knowledge bases based on statement analysis
    async selectRelevantKnowledgeBases(statement, context) {
        const relevantBases = ['general']; // Always include general
        
        // Keyword-based knowledge base selection
        const lowerStatement = statement.toLowerCase();
        
        if (this.containsScientificTerms(lowerStatement)) {
            relevantBases.push('scientific');
        }
        
        if (this.containsPoliticalTerms(lowerStatement)) {
            relevantBases.push('political');
        }
        
        if (this.containsEconomicTerms(lowerStatement)) {
            relevantBases.push('economic');
        }
        
        // Context-based selection
        if (context.topic) {
            const topicLower = context.topic.toLowerCase();
            if (topicLower.includes('climate') || topicLower.includes('environment')) {
                if (!relevantBases.includes('scientific')) relevantBases.push('scientific');
            }
            if (topicLower.includes('policy') || topicLower.includes('politics')) {
                if (!relevantBases.includes('political')) relevantBases.push('political');
            }
            if (topicLower.includes('economy') || topicLower.includes('finance')) {
                if (!relevantBases.includes('economic')) relevantBases.push('economic');
            }
        }
        
        console.log(`📚 Selected knowledge bases: ${relevantBases.join(', ')}`);
        return relevantBases;
    }

    // 🔍 Search multiple knowledge bases concurrently
    async searchMultipleBases(embedding, knowledgeBases) {
        const searchPromises = knowledgeBases.map(async (baseName) => {
            try {
                const indexName = this.knowledgeBases[baseName];
                
                // Check if index exists
                const indexExists = await this.checkIndexExists(indexName);
                if (!indexExists) {
                    console.log(`⚠️ Index ${indexName} not found, skipping`);
                    return { baseName, results: [], error: 'Index not found' };
                }
                
                // Perform vector search
                const vectorBuffer = Buffer.from(new Float32Array(embedding).buffer);
                const searchResults = await this.client.ft.search(
                    indexName,
                    "*=>[KNN 3 @embedding $vec]",
                    {
                        PARAMS: { vec: vectorBuffer },
                        RETURN: ['content', '__score'],
                        DIALECT: 2
                    }
                );
                
                const results = searchResults.documents.map(doc => ({
                    content: doc.value.content,
                    score: parseFloat(doc.value.__score),
                    confidence: 1 - parseFloat(doc.value.__score), // Convert distance to confidence
                    source: baseName,
                    id: doc.id
                }));
                
                return { baseName, results, success: true };
                
            } catch (error) {
                console.log(`⚠️ Search failed for ${baseName}: ${error.message}`);
                return { baseName, results: [], error: error.message };
            }
        });
        
        const allResults = await Promise.all(searchPromises);
        
        // Flatten and sort results by confidence
        const flatResults = allResults
            .filter(result => result.success && result.results.length > 0)
            .flatMap(result => result.results)
            .sort((a, b) => b.confidence - a.confidence);
        
        console.log(`🔍 Found ${flatResults.length} total results across ${allResults.length} knowledge bases`);
        return flatResults;
    }

    // ✅ Cross-verify results across multiple sources
    async crossVerifyResults(searchResults, originalStatement) {
        if (searchResults.length === 0) {
            return { verified: false, confidence: 0, agreement: 0, sources: 0 };
        }
        
        // Group results by source
        const sourceGroups = {};
        searchResults.forEach(result => {
            if (!sourceGroups[result.source]) {
                sourceGroups[result.source] = [];
            }
            sourceGroups[result.source].push(result);
        });
        
        // Calculate cross-source agreement
        const sourceCount = Object.keys(sourceGroups).length;
        const avgConfidenceBySource = {};
        
        Object.entries(sourceGroups).forEach(([source, results]) => {
            avgConfidenceBySource[source] = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
        });
        
        // Agreement calculation: how similar are the confidence scores across sources?
        const confidenceValues = Object.values(avgConfidenceBySource);
        const avgConfidence = confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length;
        
        // Calculate standard deviation to measure agreement
        const variance = confidenceValues.reduce((sum, conf) => sum + Math.pow(conf - avgConfidence, 2), 0) / confidenceValues.length;
        const stdDev = Math.sqrt(variance);
        
        // Agreement score (lower std dev = higher agreement)
        const agreementScore = Math.max(0, 1 - (stdDev * 2)); // Scale to 0-1
        
        const verification = {
            verified: avgConfidence > this.confidenceThresholds.medium && agreementScore > 0.5,
            confidence: avgConfidence,
            agreement: agreementScore,
            sources: sourceCount,
            sourceBreakdown: avgConfidenceBySource,
            topResult: searchResults[0],
            consensusStrength: agreementScore * avgConfidence
        };
        
        console.log(`🔄 Cross-verification: ${verification.sources} sources, ${verification.agreement.toFixed(3)} agreement, ${verification.confidence.toFixed(3)} avg confidence`);
        return verification;
    }

    // 🤖 Generate AI-powered analysis of fact check results
    async generateAIAnalysis(statement, searchResults, verification) {
        try {
            const topResults = searchResults.slice(0, 3);
            const resultsText = topResults.map(r => `[${r.source}] ${r.content} (confidence: ${r.confidence.toFixed(3)})`).join('\n');
            
            const prompt = `As an expert fact-checker, analyze this statement and evidence:

STATEMENT TO VERIFY: "${statement}"

EVIDENCE FROM KNOWLEDGE BASES:
${resultsText}

CROSS-VERIFICATION RESULTS:
- Sources checked: ${verification.sources}
- Agreement score: ${verification.agreement.toFixed(3)}
- Average confidence: ${verification.confidence.toFixed(3)}

Provide a brief analysis (max 150 words) covering:
1. Whether the statement is supported by evidence
2. Any nuances or caveats
3. Overall reliability assessment
4. Key supporting or contradicting facts

Be precise, objective, and indicate uncertainty where appropriate.`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 200,
                temperature: 0.3
            });
            
            const analysis = completion.choices[0].message.content.trim();
            
            return {
                summary: analysis,
                hasAIAnalysis: true,
                modelUsed: 'gpt-4o-mini',
                analysisConfidence: this.extractAnalysisConfidence(analysis)
            };
            
        } catch (error) {
            console.log('⚠️ AI analysis failed, using fallback');
            return {
                summary: 'AI analysis unavailable. Relying on vector search similarity scores.',
                hasAIAnalysis: false,
                error: error.message,
                analysisConfidence: 0.5
            };
        }
    }

    // 📊 Calculate composite confidence score
    calculateCompositeConfidence(verification, aiAnalysis) {
        const factors = {
            vectorSimilarity: verification.confidence || 0,
            crossSourceAgreement: verification.agreement || 0,
            numberOfSources: Math.min(verification.sources / 3, 1), // Cap at 3 sources
            aiAnalysisConfidence: aiAnalysis.analysisConfidence || 0.5,
            consensusStrength: verification.consensusStrength || 0
        };
        
        // Weighted combination of factors
        const weights = {
            vectorSimilarity: 0.3,
            crossSourceAgreement: 0.25,
            numberOfSources: 0.15,
            aiAnalysisConfidence: 0.2,
            consensusStrength: 0.1
        };
        
        const overall = Object.entries(factors).reduce((sum, [factor, value]) => {
            return sum + (value * weights[factor]);
        }, 0);
        
        return {
            overall: Math.max(0.1, Math.min(0.95, overall)),
            breakdown: factors,
            weights,
            factors: Object.entries(factors).map(([name, value]) => ({
                name: name.replace(/([A-Z])/g, ' $1').toLowerCase(),
                value: value.toFixed(3),
                weight: weights[name]
            }))
        };
    }

    // 💾 Store enhanced fact check with detailed metadata
    async storeEnhancedFactCheck(statement, compositeScore, searchResults, verification, aiAnalysis) {
        try {
            const factCheckId = `fact_check_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const factCheckKey = `enhanced_fact_check:${factCheckId}`;
            
            const factCheckRecord = {
                id: factCheckId,
                statement: statement.substring(0, 500), // Limit length
                timestamp: new Date().toISOString(),
                confidence: compositeScore.overall,
                level: this.getConfidenceLevel(compositeScore.overall),
                method: 'advanced_multi_source',
                details: {
                    composite_score: compositeScore,
                    verification: {
                        sources: verification.sources,
                        agreement: verification.agreement,
                        verified: verification.verified
                    },
                    ai_analysis: {
                        has_analysis: aiAnalysis.hasAIAnalysis,
                        summary: aiAnalysis.summary?.substring(0, 300),
                        confidence: aiAnalysis.analysisConfidence
                    },
                    search_results: searchResults.slice(0, 5).map(r => ({
                        source: r.source,
                        confidence: r.confidence,
                        content_preview: r.content?.substring(0, 100)
                    }))
                },
                metadata: {
                    total_sources_searched: searchResults.length,
                    knowledge_bases_used: [...new Set(searchResults.map(r => r.source))],
                    processing_method: 'multi_modal_redis_vector_search'
                }
            };
            
            await this.client.json.set(factCheckKey, '.', factCheckRecord);
            
            // Also store in a summary list for analytics
            const summaryKey = 'fact_check_summary';
            try {
                const existing = await this.client.json.get(summaryKey) || [];
                const updated = [...existing, {
                    id: factCheckId,
                    confidence: compositeScore.overall,
                    level: this.getConfidenceLevel(compositeScore.overall),
                    timestamp: factCheckRecord.timestamp,
                    sources: verification.sources
                }].slice(-100); // Keep last 100
                
                await this.client.json.set(summaryKey, '.', updated);
            } catch (summaryError) {
                console.log('⚠️ Failed to update fact check summary');
            }
            
        } catch (error) {
            console.error('❌ Failed to store enhanced fact check:', error);
        }
    }

    // 🔧 Helper methods
    async generateEmbedding(text) {
        const result = await embeddings.embedQuery(text.substring(0, 8000));
        return result;
    }

    async checkIndexExists(indexName) {
        try {
            await this.client.ft.info(indexName);
            return true;
        } catch (error) {
            return false;
        }
    }

    containsScientificTerms(text) {
        const scientificTerms = [
            'study', 'research', 'data', 'evidence', 'experiment', 'analysis', 'peer-reviewed',
            'climate', 'temperature', 'co2', 'carbon', 'emission', 'greenhouse', 'science',
            'statistics', 'percent', '%', 'degree', 'celsius', 'fahrenheit', 'metric'
        ];
        return scientificTerms.some(term => text.includes(term));
    }

    containsPoliticalTerms(text) {
        const politicalTerms = [
            'policy', 'government', 'congress', 'senate', 'bill', 'law', 'legislation', 'vote',
            'election', 'democrat', 'republican', 'partisan', 'political', 'administration',
            'president', 'governor', 'mayor', 'senator', 'representative', 'reform'
        ];
        return politicalTerms.some(term => text.includes(term));
    }

    containsEconomicTerms(text) {
        const economicTerms = [
            'economy', 'economic', 'gdp', 'inflation', 'unemployment', 'market', 'trade',
            'tax', 'budget', 'deficit', 'surplus', 'investment', 'profit', 'revenue',
            'cost', 'price', 'dollar', 'million', 'billion', 'trillion', 'financial'
        ];
        return economicTerms.some(term => text.includes(term));
    }

    extractAnalysisConfidence(analysisText) {
        const text = analysisText.toLowerCase();
        
        if (text.includes('strongly supported') || text.includes('highly reliable')) return 0.9;
        if (text.includes('well supported') || text.includes('reliable')) return 0.8;
        if (text.includes('supported') || text.includes('likely accurate')) return 0.7;
        if (text.includes('partially supported') || text.includes('mixed evidence')) return 0.6;
        if (text.includes('unclear') || text.includes('insufficient evidence')) return 0.4;
        if (text.includes('not supported') || text.includes('contradicted')) return 0.2;
        
        return 0.5; // Default neutral confidence
    }

    getConfidenceLevel(confidence) {
        if (confidence >= this.confidenceThresholds.high) return 'high';
        if (confidence >= this.confidenceThresholds.medium) return 'medium';
        if (confidence >= this.confidenceThresholds.low) return 'low';
        return 'very_low';
    }

    getFallbackResult(statement) {
        return {
            confidence: 0.3,
            level: 'low',
            sources: 0,
            crossVerified: false,
            details: {
                error: 'Advanced fact checking system unavailable',
                fallback: true
            },
            metadata: {
                knowledgeBasesUsed: [],
                totalSources: 0,
                verificationMethod: 'fallback',
                confidenceFactors: []
            }
        };
    }

    // 📊 Get enhanced fact checking analytics
    async getFactCheckAnalytics() {
        try {
            await this.connect();
            
            const summary = await this.client.json.get('fact_check_summary') || [];
            
            if (summary.length === 0) {
                return { total: 0, avgConfidence: 0, levelDistribution: {} };
            }
            
            const analytics = {
                total: summary.length,
                avgConfidence: summary.reduce((sum, item) => sum + item.confidence, 0) / summary.length,
                levelDistribution: summary.reduce((dist, item) => {
                    dist[item.level] = (dist[item.level] || 0) + 1;
                    return dist;
                }, {}),
                recentActivity: summary.slice(-10),
                sourceUtilization: summary.reduce((sources, item) => {
                    sources.total += item.sources || 0;
                    sources.checks += 1;
                    return sources;
                }, { total: 0, checks: 0 })
            };
            
            analytics.avgSourcesPerCheck = analytics.sourceUtilization.checks > 0 ? 
                analytics.sourceUtilization.total / analytics.sourceUtilization.checks : 0;
            
            return analytics;
            
        } catch (error) {
            console.error('❌ Failed to get fact check analytics:', error);
            return { total: 0, avgConfidence: 0, levelDistribution: {}, error: error.message };
        }
    }
}

// Export singleton instance
const advancedFactChecker = new AdvancedFactChecker();
export default advancedFactChecker;

// Helper function for easy integration
export async function checkFactAdvanced(statement, context = {}) {
    return await advancedFactChecker.checkFactAdvanced(statement, context);
}

export async function getFactCheckAnalytics() {
    return await advancedFactChecker.getFactCheckAnalytics();
}

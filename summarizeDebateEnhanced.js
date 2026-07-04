import 'dotenv/config';
import { createClient } from 'redis';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function summarizeDebate(debateId, maxMessages = 20) {
    const client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => console.error('🔴 Redis client error:', err.message));

    try {
        await client.connect();
        console.log(`📊 Generating summary for debate: ${debateId}`);

        // Get recent debate messages
        const messages = await client.xRevRange(`debate:${debateId}:messages`, '+', '-', { COUNT: maxMessages });

        if (messages.length === 0) {
            return {
                success: false,
                error: 'No messages found for this debate'
            };
        }

        // Format messages for analysis
        const formattedMessages = messages.reverse().map(entry => {
            const agentId = entry.message.agent_id;
            const message = entry.message.message;
            const timestamp = new Date(parseInt(entry.id.split('-')[0]));

            return `[${timestamp.toLocaleTimeString()}] ${agentId}: ${message}`;
        }).join('\n');

        // Get agent profiles for context
        const agentProfiles = new Map();
        const uniqueAgents = [...new Set(messages.map(m => m.message.agent_id))];

        for (const agentId of uniqueAgents) {
            try {
                const profile = await client.json.get(`agent:${agentId}:profile`);
                if (profile) {
                    agentProfiles.set(agentId, profile);
                }
            } catch (error) {
                console.log(`⚠️ Could not fetch profile for ${agentId}`);
            }
        }

        // Create agent context for the summary
        const agentContext = Array.from(agentProfiles.entries())
            .map(([id, profile]) => `${id} (${profile.name}): ${profile.role}, stance on climate policy: ${(profile.stance?.climate_policy * 100 || 50).toFixed(0)}%`)
            .join('\n');

        // Generate summary using OpenAI
        const summaryPrompt = `
You are analyzing a political debate between AI agents. Please provide a concise summary of the key points, arguments, and any notable shifts in positions.

AGENT CONTEXT:
${agentContext}

DEBATE TRANSCRIPT:
${formattedMessages}

Please provide a structured summary including:
1. Key Arguments from each side
2. Main topics of disagreement
3. Any notable rhetorical strategies
4. Overall debate quality and progression

Keep the summary concise but informative (200-400 words).
`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are an expert political analyst specializing in debate analysis and summarization.' },
                { role: 'user', content: summaryPrompt }
            ],
            max_tokens: 600,
            temperature: 0.3
        });

        const summary = completion.choices[0].message.content;

        // Store summary in Redis for future reference
        const summaryKey = `debate:${debateId}:summary:${Date.now()}`;
        await client.json.set(summaryKey, '$', {
            debateId,
            summary,
            messageCount: messages.length,
            agents: uniqueAgents,
            generatedAt: new Date().toISOString(),
            model: 'gpt-4'
        });

        console.log(`✅ Summary generated and stored at: ${summaryKey}`);

        return {
            success: true,
            summary,
            metadata: {
                debateId,
                messageCount: messages.length,
                agents: uniqueAgents,
                summaryKey,
                generatedAt: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('❌ Error generating debate summary:', error);
        return {
            success: false,
            error: error.message
        };
    } finally {
        await client.quit();
    }
}

// Helper function to get all summaries for a debate
export async function getDebateSummaries(debateId) {
    const client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => console.error('🔴 Redis client error:', err.message));

    try {
        await client.connect();

        // Find all summary keys for this debate
        const summaryKeys = await client.keys(`debate:${debateId}:summary:*`);
        const summaries = [];

        for (const key of summaryKeys) {
            try {
                const summary = await client.json.get(key);
                if (summary) {
                    summaries.push(summary);
                }
            } catch (error) {
                console.log(`⚠️ Could not fetch summary from ${key}`);
            }
        }

        // Sort by generation time (newest first)
        summaries.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

        return {
            success: true,
            summaries,
            count: summaries.length
        };

    } catch (error) {
        console.error('❌ Error fetching debate summaries:', error);
        return {
            success: false,
            error: error.message
        };
    } finally {
        await client.quit();
    }
}

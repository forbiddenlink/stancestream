import 'dotenv/config';
import { createClient } from 'redis';
import { OpenAIEmbeddings } from '@langchain/openai';

const client = createClient({ url: process.env.REDIS_URL });
client.on('error', (err) => console.error('🔴 Redis client error:', err.message));
const embeddings = new OpenAIEmbeddings();

async function findClosestFact(messageText) { // ✅ Renamed for clarity
    await client.connect();

    const embedding = await embeddings.embedQuery(messageText);
    const vector = Buffer.from(Float32Array.from(embedding).buffer);

    const result = await client.ft.search('facts-index', '*=>[KNN 1 @embedding $vector AS score]', {
        PARAMS: { vector },
        RETURN: ['content', 'score'],
        DIALECT: 2,
    });

    await client.quit();

    if (result.total === 0) {
        return { content: null, score: 1.0 };
    }

    const match = result.documents[0];
    return {
        content: match.value.content,
        score: parseFloat(match.value.score),
    };
}

// Optional CLI test
if (process.argv[2]) {
    const query = process.argv.slice(2).join(' ');
    findClosestFact(query).then((result) => {
        if (result.content) {
            console.log(`📊 Closest fact: "${result.content}"`);
            console.log(`📊 Score: ${result.score}`);
        } else {
            console.log(`⚠️ No fact match found.`);
        }
    });
}

// ✅ Use named export for cleaner imports
export { findClosestFact };

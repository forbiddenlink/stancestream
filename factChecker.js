import 'dotenv/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import redisManager from './redisManager.js';
import { disableIfUnsupported, isFeatureDisabled } from './src/utils/unsupportedFeatures.js';

const embeddings = new OpenAIEmbeddings();
const NO_MATCH = { content: null, score: 1.0 };

async function findClosestFact(messageText) { // ✅ Renamed for clarity
    if (isFeatureDisabled('RediSearch (FT.*)')) return NO_MATCH;

    const embedding = await embeddings.embedQuery(messageText);
    const vector = Buffer.from(Float32Array.from(embedding).buffer);

    // Use the shared, already-connected client. Calling connect()/quit() on a
    // module-level client per call threw "Socket already opened" when two bots
    // fact-checked concurrently.
    let result;
    try {
        const client = await redisManager.getClient();
        result = await client.ft.search('facts-index', '*=>[KNN 1 @embedding $vector AS score]', {
            PARAMS: { vector },
            RETURN: ['content', 'score'],
            DIALECT: 2,
        });
    } catch (error) {
        if (disableIfUnsupported('RediSearch (FT.*)', error)) return NO_MATCH;
        throw error;
    }

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

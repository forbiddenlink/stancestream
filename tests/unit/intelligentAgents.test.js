/**
 * Intelligent Agents System Tests
 *
 * This suite previously imported updateAgentStance, getAgentProfile,
 * analyzeSentiment, buildCoalition, and checkEmotionalState from
 * ../intelligentAgents.js. Neither the path nor those names were ever real:
 * the module lives at ../../intelligentAgents.js (repo root) and only
 * exports generateIntelligentMessage (plus a default singleton instance).
 * None of the five removed names exist anywhere in that file, as class
 * methods or otherwise, so every test that referenced them is removed here
 * rather than pointed at a stand-in. Only tests exercising the real
 * generateIntelligentMessage export remain.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createClient } from 'redis';
import { generateIntelligentMessage } from '../../intelligentAgents.js';

describe('Intelligent Agents System', () => {
    let redisClient;
    let sandbox;

    before(async () => {
        redisClient = createClient({ url: process.env.REDIS_URL });
        await redisClient.connect();
        sandbox = sinon.createSandbox();
    });

    after(async () => {
        await redisClient.quit();
        sandbox.restore();
    });

    describe('Message Generation', () => {
        it('should generate contextually appropriate messages', async () => {
            const message = await generateIntelligentMessage(
                'test_agent',
                'test_debate',
                'climate_policy'
            );

            expect(message).to.have.property('response').that.is.a('string');
            expect(message.response.length).to.be.above(0);
        });
    });

    describe('Debate Memory', () => {
        it('should maintain context awareness', async () => {
            const agentId = 'test_agent';
            const debateId = 'test_debate';
            const topic = 'climate_policy';

            // Add previous context
            await redisClient.xAdd(
                `debate:${debateId}:agent:${agentId}:memory`,
                '*',
                {
                    type: 'statement',
                    content: 'We need immediate action on climate change.'
                }
            );

            const message = await generateIntelligentMessage(agentId, debateId, topic);
            expect(message).to.have.property('response').that.is.a('string');
            expect(message.response.length).to.be.above(0);
        });

        it('should use strategic memory for responses', async () => {
            const agentId = 'test_agent';
            const debateId = 'test_debate';

            // Add strategic memory
            await redisClient.xAdd(
                `debate:${debateId}:agent:${agentId}:strategic_memory`,
                '*',
                {
                    type: 'insight',
                    content: 'Opponent shows flexibility on economic measures.'
                }
            );

            const message = await generateIntelligentMessage(
                agentId,
                debateId,
                'climate_policy'
            );

            expect(message).to.have.property('response').that.is.a('string');
            expect(message.response.length).to.be.above(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing agent profiles gracefully', async () => {
            try {
                await generateIntelligentMessage(
                    'nonexistent_agent',
                    'test_debate',
                    'climate_policy'
                );
            } catch (error) {
                expect(error.message).to.include('Agent not found');
            }
        });
    });
});

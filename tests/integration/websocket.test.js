/**
 * WebSocket Integration Tests
 */

import { expect } from 'chai';
import WebSocket from 'ws';
import { createServer } from 'http';
import express from 'express';
import sinon from 'sinon';
import { WebSocketServer } from 'ws';
import logger from '../../src/utils/logger.js';

describe('WebSocket Integration', () => {
    let app;
    let server;
    let wss;
    let wsClient;
    let sandbox;
    const PORT = 3002;
    const WS_URL = `ws://localhost:${PORT}`;

    before(async () => {
        sandbox = sinon.createSandbox();
        
        // Create Express app and HTTP server
        app = express();
        server = createServer(app);
        
        // Create WebSocket server
        wss = new WebSocketServer({ server });
        
        // Start server
        await new Promise(resolve => {
            server.listen(PORT, resolve);
        });
        
        // Setup basic WebSocket message handling
        wss.on('connection', (ws) => {
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    // Echo message back for testing
                    ws.send(JSON.stringify({
                        type: 'echo',
                        data
                    }));
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });
        });
    });

    after(async () => {
        // Cleanup
        if (wsClient && wsClient.readyState === WebSocket.OPEN) {
            wsClient.close();
        }
        
        await new Promise(resolve => {
            server.close(resolve);
        });
        
        sandbox.restore();
    });

    beforeEach((done) => {
        wsClient = new WebSocket(WS_URL);
        wsClient.on('open', done);
    });

    afterEach(() => {
        if (wsClient && wsClient.readyState === WebSocket.OPEN) {
            wsClient.close();
        }
    });

    describe('Connection Management', () => {
        it('should establish WebSocket connection', (done) => {
            expect(wsClient.readyState).to.equal(WebSocket.OPEN);
            done();
        });

        it('should handle connection close gracefully', (done) => {
            wsClient.on('close', () => {
                expect(wsClient.readyState).to.equal(WebSocket.CLOSED);
                done();
            });
            
            wsClient.close();
        });

        it('should handle multiple connections', async () => {
            const clients = await Promise.all([
                new Promise(resolve => {
                    const ws = new WebSocket(WS_URL);
                    ws.on('open', () => resolve(ws));
                }),
                new Promise(resolve => {
                    const ws = new WebSocket(WS_URL);
                    ws.on('open', () => resolve(ws));
                })
            ]);

            expect(clients[0].readyState).to.equal(WebSocket.OPEN);
            expect(clients[1].readyState).to.equal(WebSocket.OPEN);

            // Cleanup
            clients.forEach(ws => ws.close());
        });
    });

    describe('Message Handling', () => {
        it('should receive debate messages', (done) => {
            const testMessage = {
                type: 'new_message',
                agentId: 'senatorbot',
                message: 'Test message',
                debateId: 'test_debate'
            };

            wsClient.on('message', (data) => {
                const message = JSON.parse(data);
                expect(message.type).to.equal('echo');
                expect(message.data).to.deep.equal(testMessage);
                done();
            });

            wsClient.send(JSON.stringify(testMessage));
        });

        it('should handle binary messages', (done) => {
            const binaryData = Buffer.from('Test binary message');

            wsClient.on('message', (data) => {
                expect(Buffer.isBuffer(data)).to.be.true;
                expect(data.toString()).to.equal(binaryData.toString());
                done();
            });

            wsClient.send(binaryData);
        });

        it('should handle invalid JSON gracefully', (done) => {
            wsClient.on('message', (data) => {
                const message = JSON.parse(data);
                expect(message.type).to.equal('error');
                done();
            });

            wsClient.send('invalid json');
        });
    });

    describe('Broadcast Functionality', () => {
        let clients;

        beforeEach(async () => {
            // Create multiple clients
            clients = await Promise.all([
                new Promise(resolve => {
                    const ws = new WebSocket(WS_URL);
                    ws.on('open', () => resolve(ws));
                }),
                new Promise(resolve => {
                    const ws = new WebSocket(WS_URL);
                    ws.on('open', () => resolve(ws));
                }),
                new Promise(resolve => {
                    const ws = new WebSocket(WS_URL);
                    ws.on('open', () => resolve(ws));
                })
            ]);
        });

        afterEach(() => {
            clients.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            });
        });

        it('should broadcast messages to all clients', async () => {
            const messagePromises = clients.map(ws => 
                new Promise(resolve => {
                    ws.on('message', (data) => {
                        const message = JSON.parse(data);
                        resolve(message);
                    });
                })
            );

            const broadcastMessage = {
                type: 'broadcast_test',
                message: 'Test broadcast'
            };

            // Send message from first client
            clients[0].send(JSON.stringify(broadcastMessage));

            const receivedMessages = await Promise.all(messagePromises);
            receivedMessages.forEach(message => {
                expect(message.data).to.deep.equal(broadcastMessage);
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle client errors gracefully', (done) => {
            const errorSpy = sandbox.spy(logger, 'error');
            
            wsClient.on('error', () => {
                expect(errorSpy.called).to.be.true;
                done();
            });

            // Trigger an error by sending malformed data
            wsClient._sender._socket.write('malformed data');
        });

        it('should handle server errors gracefully', (done) => {
            const errorSpy = sandbox.spy(logger, 'error');
            
            // Simulate server error
            wss.emit('error', new Error('Test server error'));
            
            expect(errorSpy.called).to.be.true;
            done();
        });
    });

    describe('Performance', () => {
        it('should handle rapid message sending', async () => {
            const messageCount = 100;
            const receivedMessages = [];

            const messagePromise = new Promise(resolve => {
                let count = 0;
                wsClient.on('message', () => {
                    count++;
                    if (count === messageCount) {
                        resolve();
                    }
                });
            });

            // Send messages rapidly
            for (let i = 0; i < messageCount; i++) {
                wsClient.send(JSON.stringify({
                    type: 'test',
                    sequence: i
                }));
            }

            await messagePromise;
            expect(receivedMessages.length).to.equal(messageCount);
        });

        it('should maintain message order', async () => {
            const messageCount = 50;
            const receivedSequence = [];

            const messagePromise = new Promise(resolve => {
                let count = 0;
                wsClient.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.data && message.data.sequence !== undefined) {
                        receivedSequence.push(message.data.sequence);
                    }
                    count++;
                    if (count === messageCount) {
                        resolve();
                    }
                });
            });

            // Send numbered messages
            for (let i = 0; i < messageCount; i++) {
                wsClient.send(JSON.stringify({
                    type: 'test',
                    sequence: i
                }));
            }

            await messagePromise;

            // Verify sequence
            receivedSequence.forEach((num, index) => {
                expect(num).to.equal(index);
            });
        });
    });
});

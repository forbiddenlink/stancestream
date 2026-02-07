import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocketManager } from '../src/services/websocketManager.js';

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances = [];

  static reset() {
    FakeWebSocket.instances = [];
  }

  constructor(url) {
    this.url = url;
    this.readyState = FakeWebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
    this.sent = [];
    FakeWebSocket.instances.push(this);
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  close(code = 1000, reason = 'closed') {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({
      code,
      reason,
      wasClean: code === 1000
    });
  }

  emitMessage(payload) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  send(payload) {
    this.sent.push(payload);
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test.beforeEach(() => {
  FakeWebSocket.reset();
  globalThis.WebSocket = FakeWebSocket;
});

test('keeps listeners across reconnect when clearListeners is false', async () => {
  const manager = new WebSocketManager();
  let connectedEvents = 0;
  manager.addEventListener('connected', () => {
    connectedEvents += 1;
  });

  const firstConnect = manager.connect('ws://localhost:3001');
  FakeWebSocket.instances[0].open();
  await firstConnect;

  manager.disconnect({ clearListeners: false });

  const secondConnect = manager.connect('ws://localhost:3001');
  FakeWebSocket.instances[1].open();
  await secondConnect;

  assert.equal(connectedEvents, 2);
  assert.equal(manager.getStats().listenersCount, 1);
});

test('returns the same promise for duplicate connect calls while connecting', async () => {
  const manager = new WebSocketManager();

  const p1 = manager.connect('ws://localhost:3001');
  const p2 = manager.connect('ws://localhost:3001');

  assert.equal(p1, p2);

  FakeWebSocket.instances[0].open();
  await p1;
});

test('schedules reconnect after unclean close', async () => {
  const manager = new WebSocketManager();
  manager.reconnectDelay = 5;
  manager.maxReconnectAttempts = 2;

  const firstConnect = manager.connect('ws://localhost:3001');
  FakeWebSocket.instances[0].open();
  await firstConnect;

  FakeWebSocket.instances[0].close(1006, 'network interruption');

  await delay(15);
  assert.equal(FakeWebSocket.instances.length, 2);

  FakeWebSocket.instances[1].open();
  await delay(0);

  assert.equal(manager.isConnected(), true);
});

test('does not reconnect after intentional disconnect', async () => {
  const manager = new WebSocketManager();
  manager.reconnectDelay = 5;

  const connected = manager.connect('ws://localhost:3001');
  FakeWebSocket.instances[0].open();
  await connected;

  manager.disconnect({ clearListeners: false });
  await delay(20);

  assert.equal(FakeWebSocket.instances.length, 1);
  assert.equal(Boolean(manager.isConnected()), false);
});

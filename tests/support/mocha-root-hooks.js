/**
 * Mocha root hook plugin - process-wide teardown.
 *
 * Root cause of the CI hang on PR #112 (run 35469771994, cancelled after
 * 40+ minutes): tests/unit/intelligentAgents.test.js and
 * tests/unit/semanticCache.test.js import intelligentAgents.js and
 * semanticCache.js, both of which open real Redis client sockets at module
 * scope (semanticCache.js through the shared redisManager.js singleton;
 * intelligentAgents.js through its own IntelligentAgentSystem instance's
 * internal client) and never close them. Mocha's tests all pass and print
 * their results, but the Node process never drains its event loop
 * afterward, so `mocha` hangs indefinitely waiting on those two open
 * sockets. Confirmed locally: process._getActiveHandles() after a full
 * unit run showed exactly 2 open Socket handles, both connected to the
 * Redis Stack test instance.
 *
 * Both modules already export the teardown methods needed to close these
 * connections (disconnect() on redisManager's default export and on
 * intelligentAgents.js's default export) - they were just never called
 * from anywhere in the test suite. This file wires them into a single
 * process-wide afterAll via Mocha's root hook plugin API
 * (https://mochajs.org/#root-hook-plugins), loaded once via `--require`
 * for the whole run, rather than duplicating teardown in every test file.
 *
 * Do NOT reach for `mocha --exit` (the forceExit equivalent) instead of
 * this - that hides new leaks the same way `|| true` hid the crash this
 * branch already fixed once.
 */
export const mochaHooks = {
  async afterAll() {
    const [{ default: redisManager }, { default: intelligentAgentSystem }] =
      await Promise.all([
        import("../../redisManager.js"),
        import("../../intelligentAgents.js"),
      ]);

    await Promise.all([
      redisManager.disconnect().catch((error) => {
        console.error(
          "Root hook teardown: redisManager.disconnect() failed:",
          error.message,
        );
      }),
      intelligentAgentSystem.disconnect().catch((error) => {
        console.error(
          "Root hook teardown: intelligentAgentSystem.disconnect() failed:",
          error.message,
        );
      }),
    ]);
  },
};

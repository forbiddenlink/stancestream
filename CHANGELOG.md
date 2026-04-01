# Changelog

## 1.0.0 (2026-04-01)


### Features

* Add advanced Redis demo features for contest submission ([0bf237d](https://github.com/forbiddenlink/stancestream/commit/0bf237d18391ea86eb1296f08a54fe880f256f07))
* add Langfuse observability for LangGraph debate orchestration ([c32e027](https://github.com/forbiddenlink/stancestream/commit/c32e02740c90065fa0b737c6a031dd412e914cec))
* Add Live Performance Metrics Overlay - Mission Control Dashboard ([d7f2cb7](https://github.com/forbiddenlink/stancestream/commit/d7f2cb73770282f3ff78a460bd8dcb6a91e4dbec))
* add semantic caching with topic-aware Redis Vector search ([0e212d7](https://github.com/forbiddenlink/stancestream/commit/0e212d76741b3ddda25426fce9838a8932ef9588))
* added key moments detection system ([c106d96](https://github.com/forbiddenlink/stancestream/commit/c106d962230606ba319d5f9a4e5c6066f56ec68f))
* added stance elovution chart and sparkline ([fe78e74](https://github.com/forbiddenlink/stancestream/commit/fe78e74d8fc5f5eca595c84a2f6471fd8e90b82f))
* Complete documentation consolidation & system validation ([6054525](https://github.com/forbiddenlink/stancestream/commit/60545252bad7366c3e4cd289bdbeecc22e5c487e))
* Complete professional icon system and comprehensive documentation updates ([51a400b](https://github.com/forbiddenlink/stancestream/commit/51a400b625442160aee53cfbf238317830a16c5a))
* Complete technical improvements and final polish ([ace3fed](https://github.com/forbiddenlink/stancestream/commit/ace3fed186308d6b9b0bfe3516b2469a010b087f))
* Complete technical improvements and final polish ([26b65bd](https://github.com/forbiddenlink/stancestream/commit/26b65bd39ec28f1ba984281facaae8e2152a5ea2))
* enhance test suite with improved rate limit handling and edge cases [RED-63] ([4c57ba0](https://github.com/forbiddenlink/stancestream/commit/4c57ba072cceacc6bc8201a96d7bd633406d0299))
* Enhanced mode selector with colorful compact buttons ([782fd21](https://github.com/forbiddenlink/stancestream/commit/782fd210575bef0be0de9d155212400023da9125))
* enhanced value demo ([f1f2e3e](https://github.com/forbiddenlink/stancestream/commit/f1f2e3efb741f855edc79f984a0ecf3f21847049))
* **frontend:** add same-origin HTTP option + Vercel serverless proxy for API in previews ([d9cd6be](https://github.com/forbiddenlink/stancestream/commit/d9cd6be3592c27872689b754f93e2443a990bbff))
* implement unified design system with Matrix terminal aesthetic ([baabdcb](https://github.com/forbiddenlink/stancestream/commit/baabdcb99f553a233493bb3db27a39ab1c107a0c))
* Professional UI component library with enhanced design system ([9a41fc4](https://github.com/forbiddenlink/stancestream/commit/9a41fc4dfe6091d1d823f3dda5bf98954d5108fa))
* sematic cache engine , doc update ([d68574a](https://github.com/forbiddenlink/stancestream/commit/d68574a685ee739165a9634671867dcb33297468))
* Updated branding assets with new favicon and OG image ([034c154](https://github.com/forbiddenlink/stancestream/commit/034c1540bb2b1cfef604a46d323aa972f606592b))


### Bug Fixes

* add pnpm.overrides for critical/high CVEs (form-data, braces, cross-spawn, picomatch, flatted, minimatch, seroval) ([4fc2e1e](https://github.com/forbiddenlink/stancestream/commit/4fc2e1e1961befaf7f124a705137ae4c819a5d75))
* add production API URL fallback for Vercel builds ([3d6bb28](https://github.com/forbiddenlink/stancestream/commit/3d6bb28822e2510574f45a85743bcde5728e2340))
* add Redis service to render.yaml with proper environment configuration ([4d33b46](https://github.com/forbiddenlink/stancestream/commit/4d33b465e4ea68db45f0faac0de58624968ac8bc))
* add required maxDuration to TriggerConfig ([63af3aa](https://github.com/forbiddenlink/stancestream/commit/63af3aab53c46d3cc77713ab33f8a58ed69220b2))
* **api:** allow Vercel preview domains via CORS; remove stray token in /api/stats/redis\n\n- Allow https *.vercel.app in CORS and optional CORS_ALLOWLIST env\n- Keep localhost dev ports\n- Clean up logging typo in stats endpoint\n\nCo-Authored-By: Warp &lt;agent@warp.dev&gt; ([9373191](https://github.com/forbiddenlink/stancestream/commit/937319191dbdbcb1a2bc5a3bdcb6ab21ecfc16aa))
* configure Vercel build and relax CSP for fonts/scripts ([73cde42](https://github.com/forbiddenlink/stancestream/commit/73cde42d3f690638e64aceb01453d9ca788e1bf8))
* control button responsiveness ([cbd7326](https://github.com/forbiddenlink/stancestream/commit/cbd7326f9e26e28dbc4a53b6b614b0bb76f7e129))
* eliminate flashing popup on page load ([276618d](https://github.com/forbiddenlink/stancestream/commit/276618dd2a26638a2bf50763f831998222d58792))
* graceful cache initialization and redis docker config ([b92ee77](https://github.com/forbiddenlink/stancestream/commit/b92ee7747dc2c9e9f640397917d9fdd54cfb2037))
* harden security and replace blocking Redis KEYS with SCAN ([4182610](https://github.com/forbiddenlink/stancestream/commit/418261030b74e99662600424fb9499e0b36c83fd))
* header responsiveness ([7957c67](https://github.com/forbiddenlink/stancestream/commit/7957c675dd9ebfea29b9aa2590d78ba995137496))
* increase rate limit to 200/min and fix intro modal visibility ([b593fac](https://github.com/forbiddenlink/stancestream/commit/b593face37513b6f3fa463988650f77474cf866d))
* layout ([e37c938](https://github.com/forbiddenlink/stancestream/commit/e37c938d0d46d51775e877303a43c49fa0322469))
* loading states ([1c7cee2](https://github.com/forbiddenlink/stancestream/commit/1c7cee2d7d7d30330e5ec8e1978d2fa6e2913780))
* Redis client management and API endpoint routing - Replaced direct Redis client usage with redisManager in enhancedAI.js - Fixed /api/contest/live-metrics endpoint routing - Corrected error handler middleware placement ([a5112a7](https://github.com/forbiddenlink/stancestream/commit/a5112a75d50071a5d5a8b54417b6c0dda0e5dc78))
* relax CSP to allow Vercel live framing ([f37d76e](https://github.com/forbiddenlink/stancestream/commit/f37d76e88009d2d5fc9ae595cf88faf735575c85))
* resolve all ESLint errors for clean build ([774988c](https://github.com/forbiddenlink/stancestream/commit/774988cf4c196ec5953e6115118567af520d1ef8))
* resolve CI security scan failure and patch axios vulnerability ([1dd9968](https://github.com/forbiddenlink/stancestream/commit/1dd9968c29af4f8b92d90dbc694079f2267601bb))
* resolve race condition causing false "Backend ERROR" status ([ace8fac](https://github.com/forbiddenlink/stancestream/commit/ace8fac027e777df18ece94a837fd186d715964b))
* update render.yaml to resolve build issues ([a9fffa6](https://github.com/forbiddenlink/stancestream/commit/a9fffa649882b3e966ab0a8015dab903970fd562))

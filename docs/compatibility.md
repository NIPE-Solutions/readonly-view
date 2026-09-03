# Compatibility

| Environment          | Support statement                          | Verification                                              |
| -------------------- | ------------------------------------------ | --------------------------------------------------------- |
| Node.js 22           | Supported runtime                          | CI build, runtime, and packed-consumer job                |
| Node.js 24           | Supported runtime and development baseline | Full CI and release quality gates                         |
| Chromium             | Current Playwright engine                  | Browser semantic and documentation tests                  |
| Firefox              | Current Playwright engine                  | Browser semantic and documentation tests                  |
| WebKit               | Current Playwright engine                  | Linux CI browser job                                      |
| ESM                  | Supported                                  | Packed Node and browser-bundler fixtures                  |
| CommonJS             | Supported                                  | Packed Node `require` fixture                             |
| TypeScript 6.0       | Supported                                  | Strict packed-consumer fixture with `skipLibCheck: false` |
| TypeScript below 6.0 | Not currently claimed                      | No compatibility job yet                                  |
| Bun                  | Not currently claimed                      | Not verified in CI                                        |
| Deno                 | Not currently claimed                      | Not verified in CI                                        |

The emitted JavaScript targets ES2022. “Current browser” means the versions installed by the lockfile's Playwright release, not every historical browser with Proxy support.

On macOS 14, the current Playwright WebKit bundle has an upstream launch-protocol incompatibility. Local configuration omits that one project on that OS; the Linux CI matrix remains authoritative for WebKit support.

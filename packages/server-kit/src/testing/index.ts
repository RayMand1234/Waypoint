// Test-only utilities, kept out of the package's main entry (`.`) so production
// code can never import them. Every service's route tests use these to stand up
// a real JWKS over HTTP and sign tokens against it, instead of each duplicating
// that ~40 lines of jose setup.
export { startTestServer } from './httpServer.ts'
export type { TestServer } from './httpServer.ts'
export { startTestAuth } from './testAuth.ts'
export type { SignTestTokenOptions, TestAuth, TestAuthKey } from './testAuth.ts'

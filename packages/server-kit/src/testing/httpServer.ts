import { createServer, type RequestListener, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

export type TestServer = {
  readonly url: string
  readonly close: () => Promise<void>
}

/** Starts a throwaway HTTP server on a free port, for tests that need a real one. */
export const startTestServer = async (listener: RequestListener): Promise<TestServer> => {
  const server: Server = createServer(listener)
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('test server did not get a TCP address')
  }
  const { port } = address satisfies AddressInfo
  return {
    url: `http://127.0.0.1:${String(port)}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      }),
  }
}

// Root `npm run dev`: check the local Supabase stack is up, then run every
// service's own dev script side by side through concurrently.
//
// The service list is read from the workspace folders rather than hard-coded,
// because the services land one track at a time (docs/build-plan.md) and a
// missing workspace must not break `npm run dev` for the ones that exist.

import { spawn } from 'node:child_process'
import { connect } from 'node:net'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const SERVICES_DIR = new URL('../services/', import.meta.url).pathname
const SUPABASE_HOST = '127.0.0.1'
const SUPABASE_PORT = 54321
const SUPABASE_PROBE_TIMEOUT_MS = 1_000

const COLORS = ['cyan', 'magenta', 'yellow', 'green', 'blue']

const isPortOpen = (host, port, timeoutMs) =>
  new Promise((resolve) => {
    const socket = connect({ host, port })
    const settle = (open) => {
      socket.destroy()
      resolve(open)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => settle(true))
    socket.once('timeout', () => settle(false))
    socket.once('error', () => settle(false))
  })

const hasDevScript = async (dir) => {
  try {
    const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
    return typeof pkg.scripts?.dev === 'string'
  } catch {
    return false
  }
}

const findRunnableServices = async () => {
  let entries
  try {
    entries = await readdir(SERVICES_DIR, { withFileTypes: true })
  } catch {
    return []
  }
  const names = entries.filter((e) => e.isDirectory()).map((e) => e.name)
  const runnable = await Promise.all(
    names.map(async (name) => ((await hasDevScript(join(SERVICES_DIR, name))) ? name : null)),
  )
  return runnable.filter((name) => name !== null).sort()
}

const main = async () => {
  if (!(await isPortOpen(SUPABASE_HOST, SUPABASE_PORT, SUPABASE_PROBE_TIMEOUT_MS))) {
    console.warn(
      `Local Supabase is not answering on ${SUPABASE_HOST}:${SUPABASE_PORT}.\n` +
        'Start it with `npx supabase start` (Docker must be running), then run `npm run dev` again.',
    )
    process.exitCode = 1
    return
  }

  const services = await findRunnableServices()
  if (services.length === 0) {
    console.warn('No service in services/* has a dev script yet — nothing to run.')
    return
  }

  const args = [
    '--kill-others-on-fail',
    '--names',
    services.join(','),
    '--prefix-colors',
    services.map((_, i) => COLORS[i % COLORS.length]).join(','),
    ...services.map((name) => `npm run dev -w services/${name}`),
  ]

  const child = spawn('npx', ['concurrently', ...args], { stdio: 'inherit' })
  child.on('exit', (code) => {
    process.exitCode = code ?? 1
  })
}

await main()

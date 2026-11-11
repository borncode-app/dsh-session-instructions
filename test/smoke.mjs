#!/usr/bin/env node
// Smoke test for the session-instructions plugin.
//
// It exercises the live Host route end to end — read, write, validation, and
// the file the Host stores the instructions in — and restores the instructions
// it found, so running it never changes what the user has written.
//
// Usage: node test/smoke.mjs [--host http://127.0.0.1:53577]
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const hostFlag = args.indexOf('--host')
const host = hostFlag === -1
  ? (process.env.DSH_WEB_URL ?? 'http://127.0.0.1:53577')
  : args[hostFlag + 1]
const endpoint = `${host.replace(/\/+$/, '')}/plugins/session-instructions`
const stateFile = fileURLToPath(new URL('../state.json', import.meta.url))

/** Marker only this run writes. */
const marker = `SMOKE-CHECK-42 smoke marker ${String(Date.now())}`

let failures = 0

/**
 * Record one check.
 *
 * @param {string} name - what the check proves.
 * @param {boolean} ok - whether it held.
 * @param {string} detail - extra reading for a failed check.
 */
function check(name, ok, detail = '') {
  if (ok) {
    console.log(`PASS  ${name}`)
    return
  }
  failures += 1
  console.log(`FAIL  ${name}${detail === '' ? '' : ` — ${detail}`}`)
}

/**
 * Read the whole route answer.
 *
 * @param {RequestInit} [init] - the request to send.
 * @returns {Promise<{ status: number, body: any }>} the status and the parsed body.
 */
async function call(init) {
  const response = await fetch(endpoint, {
    headers: { accept: 'application/json', ...(init?.body === undefined ? {} : { 'content-type': 'application/json' }) },
    ...init,
  })
  let body
  try {
    body = await response.json()
  } catch {
    body = undefined
  }
  return { status: response.status, body }
}

const before = await call({ method: 'GET' })
check('the Host answers the route', before.status === 200, `status ${String(before.status)}`)
check('the answer carries the instructions', typeof before.body?.instructions === 'string', JSON.stringify(before.body))
const original = typeof before.body?.instructions === 'string' ? before.body.instructions : ''

const saved = await call({ method: 'POST', body: JSON.stringify({ action: 'save', instructions: marker }) })
check('a save is accepted', saved.status === 200, `status ${String(saved.status)}`)
check('the save echoes the text', saved.body?.instructions === marker, JSON.stringify(saved.body?.instructions))

const readBack = await call({ method: 'GET' })
check('the Host serves the new text', readBack.body?.instructions === marker, JSON.stringify(readBack.body?.instructions))

let stored = ''
try {
  stored = JSON.parse(await readFile(stateFile, 'utf8')).instructions
} catch (error) {
  stored = `unreadable: ${error instanceof Error ? error.message : String(error)}`
}
check('the text is stored on disk', stored === marker, stored)

const badAction = await call({ method: 'POST', body: JSON.stringify({ action: 'nonsense' }) })
check('an unknown action is refused', badAction.status === 400, `status ${String(badAction.status)}`)

const tooLong = await call({ method: 'POST', body: JSON.stringify({ action: 'save', instructions: 'x'.repeat(30000) }) })
check('an oversized text is refused', tooLong.status === 413, `status ${String(tooLong.status)}`)

const wrongMethod = await call({ method: 'DELETE' })
check('a wrong method is refused', wrongMethod.status === 405, `status ${String(wrongMethod.status)}`)

const restored = await call({ method: 'POST', body: JSON.stringify({ action: 'save', instructions: original }) })
check('the original text is restored', restored.status === 200 && restored.body?.instructions === original, JSON.stringify(restored.body?.instructions))

const finalRead = await call({ method: 'GET' })
check('the Host serves the restored text', finalRead.body?.instructions === original, JSON.stringify(finalRead.body?.instructions))

console.log(failures === 0 ? '\nsmoke test passed' : `\nsmoke test failed: ${String(failures)} check(s)`)
process.exit(failures === 0 ? 0 : 1)

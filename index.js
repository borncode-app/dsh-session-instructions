import z from '@deepseek-ai/schemastery'
import { readFile, rename, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

/** File that keeps the user's instructions across restarts. */
const STATE_FILE = fileURLToPath(new URL('./state.json', import.meta.url))
/** Name of the prompt section this plugin owns. */
const SECTION_NAME = 'user:instructions'
/** Largest instruction text the plugin stores when the row does not say otherwise. */
const MAX_LENGTH = 20000
/** Which generation of this file a running Host loaded; lives in every state answer. */
const REVISION = '2026-11-12.1'

export const Config = z.object({
  /** Path the Web GUI reads and writes the instructions at. */
  endpoint: z.string().default('/plugins/session-instructions'),
  /** Largest instruction text accepted, in characters. */
  maxLength: z.number().default(MAX_LENGTH),
})

/** Hard services: the prompt registry and the HTTP carrier that serves the row. */
export const inject = ['systemPrompt', 'webServer']

/**
 * Read one setting, tolerating both a plain value and a live config getter.
 *
 * @param {object | undefined} config - the row's resolved configuration.
 * @param {string} field - the setting to read.
 * @param {unknown} fallback - the value to use when the setting is absent.
 * @returns {unknown} the resolved setting.
 */
function setting(config, field, fallback) {
  const value = config?.[field]
  if (value === undefined) return fallback
  const resolved = typeof value?.get === 'function' ? value.get() : value
  return resolved === undefined ? fallback : resolved
}

/**
 * Keep the user's standing instructions, and read them before any work starts.
 *
 * The user writes the instructions in Settings → General → Instructions. The
 * Host stores them next to this plugin and contributes them as the first
 * section of every system prompt, so the deliverables the user must not forget
 * are read before the model begins work, in every session of this profile.
 */
export async function apply(ctx, config) {
  const logger = ctx.logger
  const endpoint = String(setting(config, 'endpoint', '/plugins/session-instructions'))
  const maxLength = Math.max(0, Math.floor(Number(setting(config, 'maxLength', MAX_LENGTH)) || 0))

  /** The user's instructions, as the Host currently holds them. */
  let instructions = ''
  /** When the stored instructions were last written. */
  let updatedAt = 0

  /**
   * Store the instructions next to the plugin.
   *
   * The write is atomic, so a crash never leaves a half-written file behind.
   *
   * @param {string} text - the instructions to store.
   * @param {number} stamp - the timestamp to record with them.
   * @returns {Promise<boolean>} whether the file was written.
   */
  const persist = async (text, stamp) => {
    const body = `${JSON.stringify({ instructions: text, updatedAt: stamp }, null, 2)}\n`
    const temporary = `${STATE_FILE}.tmp`
    try {
      await writeFile(temporary, body, 'utf8')
      await rename(temporary, STATE_FILE)
      return true
    } catch (error) {
      logger.warn(`session-instructions: could not save the instructions: ${error instanceof Error ? error.message : String(error)}`)
      return false
    }
  }

  /**
   * The prompt section the user's instructions ride in.
   *
   * An empty instruction set contributes nothing at all: the section renders as
   * empty text and the prompt assembler drops it.
   *
   * @returns {string} the section text, or an empty string when nothing is set.
   */
  const sectionText = () => {
    const text = instructions.trim()
    if (text.length === 0) return ''
    return [
      '## User instructions (read first)',
      "These are the user's standing requirements for this session, written in Settings → General → Instructions. Read them before starting any work. Every item is a deliverable the user expects: do not forget one of them, and confirm each one is done before reporting the work as finished.",
      '',
      text,
    ].join('\n')
  }

  /** Read one JSON request body, bounded. */
  const readBody = (req) => new Promise((resolve) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 256_000) {
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })

  /** The current reading of the stored instructions. */
  const snapshot = () => ({ revision: REVISION, instructions, updatedAt, maxLength })

  try {
    const saved = JSON.parse(await readFile(STATE_FILE, 'utf8'))
    if (typeof saved?.instructions === 'string') instructions = saved.instructions.trim()
    if (typeof saved?.updatedAt === 'number') updatedAt = saved.updatedAt
  } catch {
    /* no stored instructions yet: the General row starts empty */
  }

  ctx.effect(() => ctx.systemPrompt.section({
    name: SECTION_NAME,
    // Right behind the harness identity: the instructions are read first.
    order: ctx.systemPrompt.getSectionOrder('HARNESS_IDENTITY') + 1,
    text: sectionText,
    // The user's text is data, never a `{{variable}}` reference.
    interpolate: false,
  }), 'session-instructions: prompt section')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: endpoint,
    handler: (req, res) => {
      const reply = (status, body) => {
        res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end(JSON.stringify(body))
      }
      if (req.method === 'GET' || req.method === 'HEAD') {
        reply(200, snapshot())
        return
      }
      if (req.method !== 'POST') {
        reply(405, { error: 'method-not-allowed' })
        return
      }
      void (async () => {
        const request = await readBody(req)
        if (request?.action !== 'save' && request?.action !== 'clear') {
          reply(400, { error: 'unknown-action' })
          return
        }
        const text = request.action === 'clear' ? '' : request.instructions
        if (typeof text !== 'string') {
          reply(400, { error: 'invalid-instructions' })
          return
        }
        if (text.length > maxLength) {
          reply(413, { error: 'too-long', maxLength })
          return
        }
        const trimmed = text.trim()
        const stamp = Date.now()
        const saved = await persist(trimmed, stamp)
        if (!saved) {
          reply(500, { error: 'not-saved' })
          return
        }
        instructions = trimmed
        updatedAt = stamp
        logger.info(`session-instructions: instructions updated (${String(trimmed.length)} characters)`)
        reply(200, snapshot())
      })().catch((error) => {
        logger.warn(`session-instructions: control route failed: ${error instanceof Error ? error.message : String(error)}`)
        try {
          reply(500, { error: 'failed' })
        } catch {
          /* the reply already began */
        }
      })
    },
  }), 'session-instructions: control route')
}

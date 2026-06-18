/**
 * generate-practice-tts.ts
 *
 * Pre-generates Trinity's narration audio for the Monday Earth practice
 * using OpenAI TTS. Reads canonical text from
 * app/practice/earth/script.ts, writes MP3s to public/practice/earth/.
 *
 * Usage:
 *   npx tsx scripts/generate-practice-tts.ts
 *   npx tsx scripts/generate-practice-tts.ts --force         # overwrite existing files
 *   npx tsx scripts/generate-practice-tts.ts --voice=nova    # swap voice (default: shimmer)
 *   npx tsx scripts/generate-practice-tts.ts --model=tts-1   # swap model (default: tts-1-hd)
 *
 * Idempotency:
 *   By default, any segment whose MP3 already exists is skipped. To regenerate
 *   after editing script.ts, pass --force. This is intentional so you don't
 *   burn TTS credits on incidental re-runs.
 *
 * Requires OPENAI_API_KEY in the environment (same key used by the app).
 * The OpenAI account needs TTS access enabled.
 */

import { writeFile, mkdir, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import OpenAI from 'openai'
import { OPENING, SEGMENTS, type Segment } from '../app/practice/earth/script'

// ── CLI flags ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const VOICE = (args.find(a => a.startsWith('--voice='))?.split('=')[1] ?? 'shimmer') as
  'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'fable' | 'nova' | 'onyx' | 'sage' | 'shimmer'
const MODEL = args.find(a => a.startsWith('--model='))?.split('=')[1] ?? 'tts-1-hd'

// ── Paths ────────────────────────────────────────────────────────────────────

const OUT_DIR = join(process.cwd(), 'public', 'practice', 'earth')

// ── OpenAI client (don't import lib/openai.ts — it's server-only) ────────────

if (!process.env.OPENAI_API_KEY) {
  console.error('✗ OPENAI_API_KEY is not set. Add it to .env.local or export it.')
  process.exit(1)
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Helpers ──────────────────────────────────────────────────────────────────

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true } catch { return false }
}

function outPathFor(segment: Segment): string {
  // audioFile is '/practice/earth/xx.mp3' — strip leading slash so we land in public/
  const rel = segment.audioFile.replace(/^\//, '')
  return join(process.cwd(), 'public', rel)
}

async function generateOne(segment: Segment): Promise<'generated' | 'skipped'> {
  const outPath = outPathFor(segment)
  if (!FORCE && (await exists(outPath))) {
    console.log(`  ⤷ skip   ${segment.id.padEnd(20)} (already exists — pass --force to overwrite)`)
    return 'skipped'
  }

  const res = await openai.audio.speech.create({
    model:           MODEL,
    voice:           VOICE,
    input:           segment.trinityText,
    response_format: 'mp3',
  })

  const buf = Buffer.from(await res.arrayBuffer())
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, buf)
  const kb = (buf.byteLength / 1024).toFixed(1)
  console.log(`  ✓ write  ${segment.id.padEnd(20)} ${kb} KB → ${outPath.replace(process.cwd() + '/', '')}`)
  return 'generated'
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n─ Monday Earth · TTS generation ─`)
  console.log(`  voice=${VOICE}  model=${MODEL}  force=${FORCE}\n`)

  await mkdir(OUT_DIR, { recursive: true })

  const all: Segment[] = [OPENING, ...SEGMENTS]
  let generated = 0
  let skipped = 0

  for (const segment of all) {
    try {
      const result = await generateOne(segment)
      if (result === 'generated') generated++
      else skipped++
    } catch (err) {
      console.error(`  ✗ error  ${segment.id}:`, err instanceof Error ? err.message : err)
      process.exit(1)
    }
  }

  console.log(`\n─ done · generated=${generated} skipped=${skipped} ─\n`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

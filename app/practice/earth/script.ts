/**
 * Monday Earth — canonical practice script.
 *
 * This file is the single source of truth for what Trinity says.
 * The TTS generator at scripts/generate-practice-tts.ts reads `trinityText`
 * from each segment and produces the corresponding MP3 in public/practice/earth/.
 *
 * If you edit any trinityText field, re-run the generator with `--force` to
 * regenerate the affected audio files so they stay in sync with this script.
 *
 *   npx tsx scripts/generate-practice-tts.ts --force
 *
 * The player at app/practice/earth/page.tsx reads `durationSeconds`,
 * `audioFile`, and the on-screen fields from this same module.
 */

export type SegmentId =
  | 'opening'
  | 'meditation'
  | 'movement'
  | 'contemplation'
  | 'reflection-prompt'
  | 'reflection-close'
  | 'integration'

/**
 * A single narrated unit of the practice.
 *
 *  - `durationSeconds` governs the on-screen timer.
 *  - `audioFile` is a path relative to /public.
 *  - `trinityText` is what gets fed to OpenAI TTS. Canonical.
 *  - On-screen text is kept intentionally minimal — a headline + a caption.
 *    We don't want the user reading along word-for-word; the voice carries it.
 */
export interface Segment {
  id:               SegmentId
  label:            string
  displayIndex:     number | null     // 1..5 for numbered segments, null otherwise
  durationSeconds:  number
  audioFile:        string
  onScreenHeadline: string            // large Fraunces, 1 short sentence
  onScreenCaption:  string            // small mono, supporting line
  trinityText:      string            // fed to TTS — canonical
}

// Reflection recording is a STATE, not a Segment — it doesn't have an audio file
// and its duration is user-driven (Finish button from 20s, auto-stop at 120s).
// The two reflection segments below wrap it.
export const REFLECTION_RECORDING = {
  minSecondsBeforeFinish: 20,
  maxSeconds:             120,
} as const

export const OPENING: Segment = {
  id:               'opening',
  label:            'Opening',
  displayIndex:     null,
  durationSeconds:  30,
  audioFile:        '/practice/earth/00-opening.mp3',
  onScreenHeadline: 'Welcome to Earth.',
  onScreenCaption:  'First practice · 10 minutes · Together',
  trinityText:
    'Welcome to Earth. Your first step into the practice. ' +
    'This is the realm of your body, your action, your ground. ' +
    'For the next ten minutes, we\'re here together. ' +
    'Let\'s help you feel what it means to be here, now, fully embodied. ' +
    'Let\'s begin.',
}

export const SEGMENTS: Segment[] = [
  {
    id:               'meditation',
    label:            'Meditation',
    displayIndex:     1,
    durationSeconds:  120,
    audioFile:        '/practice/earth/01-meditation.mp3',
    onScreenHeadline: 'Feel your feet. Feel your weight.',
    onScreenCaption:  'Where your body meets the earth.',
    trinityText:
      'Feel your feet. Where do they touch the ground? ' +
      'The surface beneath you. Notice the weight of your body pressing down. ' +
      'Not thinking about it. Just feeling it. ' +
      'The heaviness. The solidity. ' +
      'Where does your body meet the earth? ' +
      'Your feet. Your legs. The chair beneath you, or the floor. ' +
      'Feel that contact. That\'s your ground. ' +
      'Notice it without changing it. Just noticing. ' +
      'The weight of being here. The realness of your body in space. ' +
      'You are here. You are solid. ' +
      '… … … ' +
      'When you\'re ready, take a breath. Feel that too. ' +
      'The air moving through you. Grounding you further. ' +
      'You are present.',
  },
  {
    id:               'movement',
    label:            'Movement',
    displayIndex:     2,
    durationSeconds:  120,
    audioFile:        '/practice/earth/02-movement.mp3',
    onScreenHeadline: 'Press down. Grow roots.',
    onScreenCaption:  'Feel the ground push back.',
    trinityText:
      'If you can, stand. Or sit taller in your chair. ' +
      'Feet hip-width apart if standing. Feel your connection to the ground. ' +
      'Now slowly — not fast — press your feet down. ' +
      'Like you\'re growing roots. Deep into the earth beneath you. ' +
      'Press down. Feel the ground push back. Release. ' +
      'And again. Press. Feel your strength in that simple act. ' +
      'The ground supporting you. You supporting yourself. ' +
      'Press. Release. Press. Release. ' +
      'Slow. Intentional. Feel your power here. ' +
      'Again. Notice what shifts in your body as you do this. ' +
      'Where do you feel strong? Your legs? Your core? Your feet? ' +
      'Press one more time. Hold it. Feel it. ' +
      'Now release. Stay standing. Feel your roots.',
  },
  {
    id:               'contemplation',
    label:            'Contemplation',
    displayIndex:     3,
    durationSeconds:  90,
    audioFile:        '/practice/earth/03-contemplation.mp3',
    onScreenHeadline: 'What action have you been avoiding?',
    onScreenCaption:  'Don\'t answer. Feel where it lives.',
    trinityText:
      'Now stay with that activation. Don\'t move. ' +
      'Just stand or sit with what you\'re feeling. ' +
      'Here\'s your question: ' +
      'What\'s one action you\'ve been avoiding? ' +
      'One thing your body knows needs to happen, but your mind keeps delaying? ' +
      'A conversation. A boundary. A yes. A no. A change. ' +
      'Don\'t answer. Don\'t think too hard. ' +
      'Just feel it in your body. ' +
      'Where does that avoidance live? Your chest? Your throat? Your belly? ' +
      'Notice it. Let the energy you just activated move toward that question. ' +
      'You don\'t have to fix it now. Just notice it\'s there. Feel it.',
  },
  {
    id:               'reflection-prompt',
    label:            'Reflection',
    displayIndex:     4,
    durationSeconds:  20, // prompt audio runtime; advances when audio ends
    audioFile:        '/practice/earth/04-reflection-prompt.mp3',
    onScreenHeadline: 'Now speak.',
    onScreenCaption:  'From the place you just touched.',
    trinityText:
      'Now speak. From that place you just touched. ' +
      'Tell me: Where in your body do you feel grounded? ' +
      'And what\'s the action you\'ve been avoiding? ' +
      'Speak it out loud. Let it be heard. ' +
      'Not perfectly. Not polished. Real.',
  },
  {
    id:               'reflection-close',
    label:            'Reflection',
    displayIndex:     4,
    durationSeconds:  10, // short thank-you after recording
    audioFile:        '/practice/earth/04-reflection-close.mp3',
    onScreenHeadline: 'Thank you for speaking that.',
    onScreenCaption:  'That\'s you, meeting yourself.',
    trinityText:
      'Thank you for speaking that. That matters. ' +
      'That\'s you, meeting yourself.',
  },
  {
    id:               'integration',
    label:            'Integration',
    displayIndex:     5,
    durationSeconds:  90,
    audioFile:        '/practice/earth/05-integration.mp3',
    onScreenHeadline: 'Hand on heart. You\'re here.',
    onScreenCaption:  'You showed up. You\'re ready.',
    trinityText:
      'Before you go, place your hand on your heart. ' +
      'Feel your heartbeat. Feel yourself alive. ' +
      'You showed up today. You felt your ground. ' +
      'You moved with intention. You asked the hard question. ' +
      'You spoke truth. You\'re here. You\'re solid. You\'re ready. ' +
      'Thank you for showing up. Earth is acknowledged. ' +
      'You are grounded. Now go forward with that solidity. ' +
      'You\'re ready.',
  },
]

/**
 * All narrated units, in the order the player should run them.
 * The reflection recording state sits between `reflection-prompt` and
 * `reflection-close` in the player's state machine — it is not a Segment.
 */
export const PRACTICE_SEQUENCE: Segment[] = [OPENING, ...SEGMENTS]

export const CLOSING_SCREEN = {
  headline:  'Earth acknowledged.',
  caption:   'See you Tuesday.',
} as const

// ── Practice-level metadata ──────────────────────────────────────────────────

export const PRACTICE_META = {
  id:         'monday-earth',
  dimension:  'earth',
  dayLabel:   'Monday',
  accent:     '#2db885',
  bg:         '#0f0b1a',
  ink:        '#f5efe4',
} as const

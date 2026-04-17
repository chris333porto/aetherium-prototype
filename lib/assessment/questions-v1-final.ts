/**
 * questions-v1-final.ts
 *
 * AETHERIUM QUESTION BANK v1.0 — FINAL
 *
 * 50 questions, 10 per dimension.
 * Audited for: clarity, emotional realism, fakeability, dimensional accuracy,
 * redundancy, bias, engagement quality.
 *
 * Scale: Never (1) — Rarely (2) — Sometimes (3) — Often (4) — Always (5)
 *
 * Changes from prior bank:
 *   - 7 critical replacements (ae09, ae07, ae04, fi07, fi02, wa10, ea07)
 *   - 6 moderate rewrites (fi09, fi10, fi04, ai07, ai06, ai09, ea09, ea08)
 *   - Reverse-scored items distributed across all sub-categories
 *   - Interleaved sequencing within each dimension
 *
 * DO NOT reorder dimensions. Earth → Water → Air → Fire → Aether is intentional.
 */

import type { Question, Dimension, QuestionCategory } from './questions'

export const QUESTIONS_V1: Question[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // EARTH — Physicality / Execution / Grounding
  // Start with concrete, behavioral. Warm the user up.
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. execution — warm-up (positive, behavioral)
  { id: 'ea01', dimension: 'earth', category: 'execution',   reverseScored: false,
    text: 'I follow through with concrete actions on my plans.' },

  // 2. grounding — reverse early
  { id: 'ea03', dimension: 'earth', category: 'grounding',   reverseScored: true,
    text: 'I feel disconnected from my body or my physical surroundings.' },

  // 3. consistency — behavioral positive
  { id: 'ea02', dimension: 'earth', category: 'consistency',  reverseScored: false,
    text: 'I take care of my body with consistent habits.' },

  // 4. execution — concrete positive
  { id: 'ea04', dimension: 'earth', category: 'execution',   reverseScored: false,
    text: 'When I set out to make something happen, it gets done.' },

  // 5. consistency — reverse
  { id: 'ea05', dimension: 'earth', category: 'consistency',  reverseScored: true,
    text: 'I struggle to maintain routines or physical discipline.' },

  // 6. grounding — positive
  { id: 'ea06', dimension: 'earth', category: 'grounding',   reverseScored: false,
    text: 'I feel at home and settled in my physical environment.' },

  // 7. execution — [NEW] replaces "I build things that last and endure"
  { id: 'ea07', dimension: 'earth', category: 'execution',   reverseScored: false,
    text: 'I have at least one physical space, system, or routine that I have maintained for months.' },

  // 8. grounding — [NEW] replaces "I stay in my head" (was Air cross-load)
  { id: 'ea08', dimension: 'earth', category: 'grounding',   reverseScored: false,
    text: 'I notice physical signals — tension, fatigue, unease — before I understand why.' },

  // 9. consistency — [REWRITTEN] replaces "practical wisdom"
  { id: 'ea09', dimension: 'earth', category: 'consistency',  reverseScored: false,
    text: 'I have a realistic sense of how long things take and what I can handle.' },

  // 10. grounding — anchoring close
  { id: 'ea10', dimension: 'earth', category: 'grounding',   reverseScored: false,
    text: 'I feel physically vital and fully present in my body.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // WATER — Emotion / Connection / Feeling
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. awareness — warm-up
  { id: 'wa01', dimension: 'water', category: 'awareness',   reverseScored: false,
    text: 'I am in touch with my emotional states and what drives them.' },

  // 2. connection — reverse early
  { id: 'wa05', dimension: 'water', category: 'connection',  reverseScored: true,
    text: 'I struggle to express what I feel to others.' },

  // 3. awareness — reverse
  { id: 'wa03', dimension: 'water', category: 'awareness',   reverseScored: true,
    text: 'I suppress or avoid difficult emotions rather than feeling them.' },

  // 4. connection — positive
  { id: 'wa04', dimension: 'water', category: 'connection',  reverseScored: false,
    text: 'I feel genuinely connected to the people in my life.' },

  // 5. awareness — positive
  { id: 'wa06', dimension: 'water', category: 'awareness',   reverseScored: false,
    text: 'I trust my emotional intuition and use it as guidance.' },

  // 6. regulation — positive
  { id: 'wa07', dimension: 'water', category: 'regulation',  reverseScored: false,
    text: 'I can move through difficult seasons without shutting down.' },

  // 7. connection — reverse
  { id: 'wa08', dimension: 'water', category: 'connection',  reverseScored: true,
    text: 'I feel emotionally isolated or misunderstood by others.' },

  // 8. connection — positive
  { id: 'wa02', dimension: 'water', category: 'connection',  reverseScored: false,
    text: 'I can empathize deeply with the experiences of others.' },

  // 9. regulation — positive (unique signal: openness to positive emotion)
  { id: 'wa09', dimension: 'water', category: 'regulation',  reverseScored: false,
    text: 'I allow myself to feel joy, beauty, and wonder regularly.' },

  // 10. awareness — [NEW] replaces "rich, nuanced, and integrated"
  { id: 'wa10', dimension: 'water', category: 'awareness',   reverseScored: false,
    text: 'I know the difference between what I think I feel and what I actually feel.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // AIR — Cognition / Thinking / Clarity
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. analysis — warm-up
  { id: 'ai01', dimension: 'air', category: 'analysis',      reverseScored: false,
    text: 'I can see multiple perspectives before forming an opinion.' },

  // 2. clarity — reverse early
  { id: 'ai03', dimension: 'air', category: 'clarity',       reverseScored: true,
    text: 'I tend to overthink and struggle to reach clear decisions.' },

  // 3. clarity — positive
  { id: 'ai02', dimension: 'air', category: 'clarity',       reverseScored: false,
    text: 'I think clearly under pressure.' },

  // 4. communication — positive
  { id: 'ai04', dimension: 'air', category: 'communication', reverseScored: false,
    text: 'I can communicate complex ideas in simple, clear ways.' },

  // 5. clarity — reverse
  { id: 'ai05', dimension: 'air', category: 'clarity',       reverseScored: true,
    text: 'My mind often feels cluttered or overwhelmed with thoughts.' },

  // 6. analysis — [NEW] replaces "learn and adapt quickly" (cross-loaded)
  { id: 'ai06', dimension: 'air', category: 'analysis',      reverseScored: false,
    text: 'I can sit with uncertainty or contradiction without needing to resolve it immediately.' },

  // 7. clarity — [REWRITTEN] replaces "trust my intellectual judgment"
  { id: 'ai07', dimension: 'air', category: 'clarity',       reverseScored: false,
    text: 'Once I have thought something through, I trust my conclusion.' },

  // 8. clarity — reverse
  { id: 'ai08', dimension: 'air', category: 'clarity',       reverseScored: true,
    text: 'I get confused or paralyzed when situations are ambiguous.' },

  // 9. analysis — [NEW] replaces "seek to understand deeply" (inflatable)
  { id: 'ai09', dimension: 'air', category: 'analysis',      reverseScored: true,
    text: 'I catch myself making quick judgments without fully understanding the situation.' },

  // 10. analysis — anchoring close (best analysis item — retained)
  { id: 'ai10', dimension: 'air', category: 'analysis',      reverseScored: false,
    text: 'I can set my emotions aside when I need to think something through clearly.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // FIRE — Volition / Action / Drive
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. initiative — warm-up
  { id: 'fi01', dimension: 'fire', category: 'initiative',   reverseScored: false,
    text: 'I take decisive action even when conditions are uncertain.' },

  // 2. commitment — reverse early
  { id: 'fi05', dimension: 'fire', category: 'commitment',   reverseScored: true,
    text: 'I struggle to maintain momentum on long-term projects.' },

  // 3. initiative — [NEW] replaces "follow through on commitments" (Earth cross-load)
  { id: 'fi02', dimension: 'fire', category: 'initiative',   reverseScored: false,
    text: 'I have made a difficult decision in the last month that I am proud of.' },

  // 4. initiative — reverse
  { id: 'fi03', dimension: 'fire', category: 'initiative',   reverseScored: true,
    text: 'I often procrastinate or avoid starting important tasks.' },

  // 5. drive — [NEW] replaces "feel energized and motivated" (inflatable)
  { id: 'fi04', dimension: 'fire', category: 'drive',        reverseScored: true,
    text: 'I frequently feel unmotivated despite knowing what I should do.' },

  // 6. initiative — positive
  { id: 'fi06', dimension: 'fire', category: 'initiative',   reverseScored: false,
    text: 'I initiate things rather than waiting for others to lead.' },

  // 7. drive — [NEW] replaces "inner force to create and achieve" (vague)
  { id: 'fi07', dimension: 'fire', category: 'drive',        reverseScored: false,
    text: 'When something matters to me, I will push through discomfort to make it happen.' },

  // 8. commitment — reverse
  { id: 'fi08', dimension: 'fire', category: 'commitment',   reverseScored: true,
    text: 'When things get hard, I tend to pull back instead of pushing through.' },

  // 9. drive — [REWRITTEN] replaces "full responsibility for outcomes"
  { id: 'fi09', dimension: 'fire', category: 'drive',        reverseScored: false,
    text: 'When something goes wrong, my first instinct is to look at what I did — not what happened to me.' },

  // 10. commitment — [REWRITTEN] replaces "complete what I start" (Earth cross-load)
  { id: 'fi10', dimension: 'fire', category: 'commitment',   reverseScored: false,
    text: 'I can keep showing up for something that matters, even when it stops being exciting.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // AETHER — Intention / Purpose / Alignment
  // End with the deepest, most reflective questions when user is warmed up.
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. purpose — warm-up
  { id: 'ae01', dimension: 'aether', category: 'purpose',    reverseScored: false,
    text: 'I have a clear sense of what I am here to do.' },

  // 2. alignment — reverse early
  { id: 'ae06', dimension: 'aether', category: 'alignment',  reverseScored: true,
    text: 'I feel scattered between competing priorities and values.' },

  // 3. alignment — positive
  { id: 'ae02', dimension: 'aether', category: 'alignment',  reverseScored: false,
    text: 'My daily actions feel aligned with my deeper values.' },

  // 4. meaning — reverse
  { id: 'ae03', dimension: 'aether', category: 'meaning',    reverseScored: true,
    text: 'I often feel like my life is missing a clear direction.' },

  // 5. purpose — [NEW] replaces redundant "sense of purpose guides decisions"
  { id: 'ae09', dimension: 'aether', category: 'purpose',    reverseScored: false,
    text: 'I can articulate what I am building toward in one clear sentence.' },

  // 6. purpose — positive
  { id: 'ae05', dimension: 'aether', category: 'purpose',    reverseScored: false,
    text: 'I know what I truly want, beyond what others expect of me.' },

  // 7. alignment — [NEW] replaces "living in accordance with principles" (redundant)
  { id: 'ae07', dimension: 'aether', category: 'alignment',  reverseScored: true,
    text: 'There are parts of my life I am living for someone else\'s reasons, not my own.' },

  // 8. meaning — reverse
  { id: 'ae08', dimension: 'aether', category: 'meaning',    reverseScored: true,
    text: 'I frequently question whether what I am doing matters.' },

  // 9. meaning — [NEW] replaces "connected to something larger" (vague/biased)
  { id: 'ae04', dimension: 'aether', category: 'meaning',    reverseScored: false,
    text: 'When I imagine the next five years, I feel drawn toward a clear direction.' },

  // 10. alignment — anchoring close
  { id: 'ae10', dimension: 'aether', category: 'alignment',  reverseScored: false,
    text: 'I feel at peace with the direction my life is taking.' },
]

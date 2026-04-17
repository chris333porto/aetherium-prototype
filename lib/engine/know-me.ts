/**
 * know-me.ts — Structured self-discovery question bank
 *
 * Progressive interview system that helps Trinity truly know the user.
 * One question at a time. Answers saved to memory vault.
 */

export type KnowMeCategory =
  | 'identity' | 'childhood' | 'family' | 'love' | 'heartbreak'
  | 'career' | 'money' | 'spirituality' | 'failures' | 'strengths'
  | 'travel' | 'regrets' | 'turning-points' | 'values' | 'philosophy'
  | 'dreams' | 'health' | 'legacy' | 'joy' | 'shadow' | 'teachings'

export interface KnowMeQuestion {
  id:       string
  category: KnowMeCategory
  question: string
  depth:    1 | 2 | 3  // 1=surface, 2=middle, 3=deep
}

export const KNOW_ME_QUESTIONS: KnowMeQuestion[] = [
  // ── IDENTITY ───────────────────────────────────────────────────────────
  { id: 'id-01', category: 'identity', depth: 1, question: 'How would you describe yourself in one sentence?' },
  { id: 'id-02', category: 'identity', depth: 1, question: 'What do people usually get wrong about you?' },
  { id: 'id-03', category: 'identity', depth: 2, question: 'When do you feel most like yourself?' },
  { id: 'id-04', category: 'identity', depth: 2, question: 'What role do you play most often — in work, in relationships, in life?' },
  { id: 'id-05', category: 'identity', depth: 3, question: 'Who were you before the world told you who to be?' },
  { id: 'id-06', category: 'identity', depth: 3, question: 'What part of yourself have you hidden to be accepted?' },

  // ── CHILDHOOD ──────────────────────────────────────────────────────────
  { id: 'ch-01', category: 'childhood', depth: 1, question: 'What is your earliest memory?' },
  { id: 'ch-02', category: 'childhood', depth: 1, question: 'What did you love doing as a child that you no longer do?' },
  { id: 'ch-03', category: 'childhood', depth: 2, question: 'What did you learn about love from your parents?' },
  { id: 'ch-04', category: 'childhood', depth: 2, question: 'What was the emotional climate of your home growing up?' },
  { id: 'ch-05', category: 'childhood', depth: 3, question: 'What wound from childhood are you still carrying?' },
  { id: 'ch-06', category: 'childhood', depth: 3, question: 'What did you need as a child that you never received?' },

  // ── FAMILY ─────────────────────────────────────────────────────────────
  { id: 'fa-01', category: 'family', depth: 1, question: 'Who in your family do you most take after?' },
  { id: 'fa-02', category: 'family', depth: 2, question: 'What pattern in your family are you determined to break?' },
  { id: 'fa-03', category: 'family', depth: 2, question: 'What is the most important thing your father taught you?' },
  { id: 'fa-04', category: 'family', depth: 2, question: 'What is the most important thing your mother taught you?' },
  { id: 'fa-05', category: 'family', depth: 3, question: 'What have you forgiven your family for — and what haven\'t you?' },

  // ── LOVE ───────────────────────────────────────────────────────────────
  { id: 'lo-01', category: 'love', depth: 1, question: 'What does love feel like when it\'s real?' },
  { id: 'lo-02', category: 'love', depth: 2, question: 'What is the most important thing you\'ve learned about relationships?' },
  { id: 'lo-03', category: 'love', depth: 2, question: 'When have you felt most loved in your life?' },
  { id: 'lo-04', category: 'love', depth: 3, question: 'What are you afraid to need from another person?' },
  { id: 'lo-05', category: 'love', depth: 3, question: 'What do you give too much of in relationships? What do you withhold?' },

  // ── HEARTBREAK ─────────────────────────────────────────────────────────
  { id: 'hb-01', category: 'heartbreak', depth: 1, question: 'What is the hardest thing you\'ve ever been through?' },
  { id: 'hb-02', category: 'heartbreak', depth: 2, question: 'What loss changed you the most?' },
  { id: 'hb-03', category: 'heartbreak', depth: 3, question: 'What grief are you still carrying that you haven\'t fully processed?' },
  { id: 'hb-04', category: 'heartbreak', depth: 3, question: 'What did your worst heartbreak teach you about yourself?' },

  // ── CAREER ─────────────────────────────────────────────────────────────
  { id: 'ca-01', category: 'career', depth: 1, question: 'What work are you most proud of?' },
  { id: 'ca-02', category: 'career', depth: 2, question: 'When have you felt most alive in your work?' },
  { id: 'ca-03', category: 'career', depth: 2, question: 'What would you do if money were not a factor?' },
  { id: 'ca-04', category: 'career', depth: 3, question: 'Are you building something that is truly yours — or someone else\'s vision?' },
  { id: 'ca-05', category: 'career', depth: 3, question: 'What is the difference between your job and your calling?' },

  // ── MONEY ──────────────────────────────────────────────────────────────
  { id: 'mo-01', category: 'money', depth: 1, question: 'What is your relationship with money right now?' },
  { id: 'mo-02', category: 'money', depth: 2, question: 'What did your family teach you about money — spoken and unspoken?' },
  { id: 'mo-03', category: 'money', depth: 3, question: 'What would financial freedom actually change about how you live?' },

  // ── SPIRITUALITY ───────────────────────────────────────────────────────
  { id: 'sp-01', category: 'spirituality', depth: 1, question: 'Do you believe in something larger than yourself? What?' },
  { id: 'sp-02', category: 'spirituality', depth: 2, question: 'When have you felt the most connected to something beyond the ordinary?' },
  { id: 'sp-03', category: 'spirituality', depth: 2, question: 'What spiritual practice actually changes how you feel?' },
  { id: 'sp-04', category: 'spirituality', depth: 3, question: 'What do you think happens after death?' },
  { id: 'sp-05', category: 'spirituality', depth: 3, question: 'What is the deepest truth you\'ve ever encountered?' },

  // ── FAILURES ───────────────────────────────────────────────────────────
  { id: 'fl-01', category: 'failures', depth: 1, question: 'What is the biggest mistake you\'ve made?' },
  { id: 'fl-02', category: 'failures', depth: 2, question: 'What failure taught you the most?' },
  { id: 'fl-03', category: 'failures', depth: 3, question: 'What are you most ashamed of — and what would it take to release it?' },

  // ── STRENGTHS ──────────────────────────────────────────────────────────
  { id: 'st-01', category: 'strengths', depth: 1, question: 'What are you genuinely great at?' },
  { id: 'st-02', category: 'strengths', depth: 2, question: 'What do people come to you for?' },
  { id: 'st-03', category: 'strengths', depth: 2, question: 'What talent do you have that you\'re not fully using?' },
  { id: 'st-04', category: 'strengths', depth: 3, question: 'What is the gift that only you can give the world?' },

  // ── TURNING POINTS ─────────────────────────────────────────────────────
  { id: 'tp-01', category: 'turning-points', depth: 1, question: 'What moment changed the direction of your life?' },
  { id: 'tp-02', category: 'turning-points', depth: 2, question: 'What decision are you most grateful you made?' },
  { id: 'tp-03', category: 'turning-points', depth: 2, question: 'What is the bravest thing you\'ve ever done?' },
  { id: 'tp-04', category: 'turning-points', depth: 3, question: 'When did you stop being who you were and start becoming who you are?' },

  // ── VALUES ─────────────────────────────────────────────────────────────
  { id: 'va-01', category: 'values', depth: 1, question: 'What matters most to you in life right now?' },
  { id: 'va-02', category: 'values', depth: 2, question: 'What would you never compromise on?' },
  { id: 'va-03', category: 'values', depth: 2, question: 'What value do you hold that most people around you don\'t share?' },
  { id: 'va-04', category: 'values', depth: 3, question: 'Are you living by your own values — or by values you inherited?' },

  // ── PHILOSOPHY ─────────────────────────────────────────────────────────
  { id: 'ph-01', category: 'philosophy', depth: 1, question: 'What is your personal philosophy of life in one sentence?' },
  { id: 'ph-02', category: 'philosophy', depth: 2, question: 'What book, idea, or teacher changed how you see the world?' },
  { id: 'ph-03', category: 'philosophy', depth: 3, question: 'What do you believe is the purpose of suffering?' },
  { id: 'ph-04', category: 'philosophy', depth: 3, question: 'What would you tell the world if everyone would listen for one minute?' },

  // ── DREAMS ─────────────────────────────────────────────────────────────
  { id: 'dr-01', category: 'dreams', depth: 1, question: 'What is the life you dream about but haven\'t built yet?' },
  { id: 'dr-02', category: 'dreams', depth: 2, question: 'What would you attempt if you knew you couldn\'t fail?' },
  { id: 'dr-03', category: 'dreams', depth: 3, question: 'What dream did you give up on — and does it still call to you?' },

  // ── HEALTH ─────────────────────────────────────────────────────────────
  { id: 'he-01', category: 'health', depth: 1, question: 'How is your body right now — honestly?' },
  { id: 'he-02', category: 'health', depth: 2, question: 'What does your body need that you\'re not giving it?' },
  { id: 'he-03', category: 'health', depth: 3, question: 'What is the relationship between your physical health and your emotional state?' },

  // ── LEGACY ─────────────────────────────────────────────────────────────
  { id: 'le-01', category: 'legacy', depth: 1, question: 'How do you want to be remembered?' },
  { id: 'le-02', category: 'legacy', depth: 2, question: 'What would you want your children to know about you?' },
  { id: 'le-03', category: 'legacy', depth: 2, question: 'What wisdom would you pass to your 20-year-old self?' },
  { id: 'le-04', category: 'legacy', depth: 3, question: 'If you died tomorrow, what would remain unfinished — and what would remain unsaid?' },

  // ── JOY ────────────────────────────────────────────────────────────────
  { id: 'jo-01', category: 'joy', depth: 1, question: 'What makes you genuinely happy?' },
  { id: 'jo-02', category: 'joy', depth: 2, question: 'When was the last time you felt pure, uncomplicated joy?' },
  { id: 'jo-03', category: 'joy', depth: 3, question: 'Do you allow yourself to be happy — or does something always pull you back?' },

  // ── SHADOW ─────────────────────────────────────────────────────────────
  { id: 'sh-01', category: 'shadow', depth: 2, question: 'What part of yourself do you show to no one?' },
  { id: 'sh-02', category: 'shadow', depth: 2, question: 'What triggers you most — and why does it have that power?' },
  { id: 'sh-03', category: 'shadow', depth: 3, question: 'What are you running from?' },
  { id: 'sh-04', category: 'shadow', depth: 3, question: 'What would it cost you to be completely honest with yourself right now?' },

  // ── TEACHINGS ──────────────────────────────────────────────────────────
  { id: 'te-01', category: 'teachings', depth: 1, question: 'What is the most important lesson life has taught you?' },
  { id: 'te-02', category: 'teachings', depth: 2, question: 'What advice do you give others that you don\'t follow yourself?' },
  { id: 'te-03', category: 'teachings', depth: 2, question: 'What truth took you the longest to accept?' },
  { id: 'te-04', category: 'teachings', depth: 3, question: 'What do you know now that you wish you knew ten years ago?' },

  // ── TRAVEL ─────────────────────────────────────────────────────────────
  { id: 'tr-01', category: 'travel', depth: 1, question: 'What place changed you the most?' },
  { id: 'tr-02', category: 'travel', depth: 2, question: 'Where in the world did you feel most alive?' },

  // ── REGRETS ────────────────────────────────────────────────────────────
  { id: 're-01', category: 'regrets', depth: 2, question: 'What do you regret not doing?' },
  { id: 're-02', category: 'regrets', depth: 3, question: 'What conversation do you wish you\'d had before it was too late?' },
  { id: 're-03', category: 'regrets', depth: 3, question: 'What would you do differently if you could live your life again?' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getQuestionsByCategory(category: KnowMeCategory): KnowMeQuestion[] {
  return KNOW_ME_QUESTIONS.filter(q => q.category === category)
}

export function getRandomQuestion(opts?: { depth?: 1 | 2 | 3; exclude?: string[] }): KnowMeQuestion {
  let pool = KNOW_ME_QUESTIONS
  if (opts?.depth) pool = pool.filter(q => q.depth === opts.depth)
  if (opts?.exclude?.length) pool = pool.filter(q => !opts.exclude!.includes(q.id))
  if (pool.length === 0) pool = KNOW_ME_QUESTIONS
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getNextQuestion(answeredIds: string[]): KnowMeQuestion {
  // Start with depth 1, progress to 2, then 3
  const answered = new Set(answeredIds)
  const unanswered = KNOW_ME_QUESTIONS.filter(q => !answered.has(q.id))

  if (unanswered.length === 0) return getRandomQuestion()

  // Prefer depth 1 first, then 2, then 3
  const d1 = unanswered.filter(q => q.depth === 1)
  if (d1.length > 0) return d1[Math.floor(Math.random() * d1.length)]

  const d2 = unanswered.filter(q => q.depth === 2)
  if (d2.length > 0) return d2[Math.floor(Math.random() * d2.length)]

  return unanswered[Math.floor(Math.random() * unanswered.length)]
}

export const KNOW_ME_CATEGORIES: { id: KnowMeCategory; label: string }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'childhood', label: 'Childhood' },
  { id: 'family', label: 'Family' },
  { id: 'love', label: 'Love' },
  { id: 'heartbreak', label: 'Heartbreak' },
  { id: 'career', label: 'Career' },
  { id: 'money', label: 'Money' },
  { id: 'spirituality', label: 'Spirituality' },
  { id: 'failures', label: 'Failures' },
  { id: 'strengths', label: 'Strengths' },
  { id: 'turning-points', label: 'Turning Points' },
  { id: 'values', label: 'Values' },
  { id: 'philosophy', label: 'Philosophy' },
  { id: 'dreams', label: 'Dreams' },
  { id: 'health', label: 'Health' },
  { id: 'legacy', label: 'Legacy' },
  { id: 'joy', label: 'Joy' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'teachings', label: 'Teachings' },
  { id: 'travel', label: 'Travel' },
  { id: 'regrets', label: 'Regrets' },
]

// Voice capture categories for Speak to Trinity
export const VOICE_CATEGORIES = [
  'Life Story', 'Childhood', 'Relationship', 'Business', 'Philosophy',
  'Pain / Healing', 'Insight', 'Lesson Learned', 'Dream / Vision',
  'Creativity', 'Parenting', 'Spirituality', 'Daily Reflection',
  'Current Chapter', 'Free Speak',
] as const

// ============================================================
// DreamBound — Mock AI Service
// Returns realistic placeholder interpretations for development
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import type { Dream, Interpretation, DreamSymbol } from '../types';

// ---------------------------------------------------------------------------
// Symbol Database for Mock Interpretations
// ---------------------------------------------------------------------------

const COMMON_SYMBOLS: Array<{
  name: string;
  meanings: string[];
  themes: string[];
}> = [
  {
    name: 'falling',
    meanings: [
      'A sense of loss of control in waking life',
      'Anxiety about failing or letting go',
      'Feeling unsupported or ungrounded',
    ],
    themes: ['anxiety', 'control', 'vulnerability'],
  },
  {
    name: 'water',
    meanings: [
      'Emotional landscape and unconscious processing',
      'Purification and transformation',
      'The depths of the psyche',
    ],
    themes: ['emotions', 'subconscious', 'change'],
  },
  {
    name: 'flying',
    meanings: [
      'Desire for freedom or escape from constraints',
      'Ambition and aspiration',
      'A sense of transcendence or perspective',
    ],
    themes: ['freedom', 'ambition', 'perspective'],
  },
  {
    name: 'chase',
    meanings: [
      'Avoidance of an issue in waking life',
      'Feeling pressured or threatened',
      'Pursuing a goal that feels just out of reach',
    ],
    themes: ['anxiety', 'pursuit', 'avoidance'],
  },
  {
    name: 'house',
    meanings: [
      'The self and different aspects of personality',
      'Family dynamics and roots',
      'Physical body as a dwelling place',
    ],
    themes: ['self', 'family', 'identity'],
  },
  {
    name: 'snake',
    meanings: [
      'Transformation and rebirth (shedding skin)',
      'Hidden fears or threats',
      'Kundalini energy and primal forces',
    ],
    themes: ['transformation', 'fear', 'energy'],
  },
  {
    name: 'dog',
    meanings: [
      'Loyalty, friendship, and unconditional love',
      'Your shadow self or instincts',
      'Protection and guidance',
    ],
    themes: ['relationships', 'loyalty', 'instinct'],
  },
  {
    name: 'car',
    meanings: [
      'The direction of your life and sense of agency',
      'Control over your path and choices',
      'Energy and motivation driving you forward',
    ],
    themes: ['direction', 'control', 'motivation'],
  },
  {
    name: 'forest',
    meanings: [
      'The unconscious mind and unexplored territory',
      'Feeling lost or needing direction',
      'Growth and natural development',
    ],
    themes: ['subconscious', 'unknown', 'growth'],
  },
  {
    name: 'beach',
    meanings: [
      'The threshold between conscious and unconscious',
      'Transitional periods in life',
      'Relaxation and emotional processing',
    ],
    themes: ['transition', 'boundary', 'peace'],
  },
  {
    name: 'mountain',
    meanings: [
      'Obstacles, challenges, and ambitions',
      'Spiritual growth and perspective',
      'Achievement and the journey upward',
    ],
    themes: ['challenge', 'growth', 'achievement'],
  },
  {
    name: 'child',
    meanings: [
      'Your inner child and innocent aspects',
      'New beginnings and potential',
      'Unfulfilled aspects of childhood',
    ],
    themes: ['innocence', 'potential', 'past'],
  },
];

const EMOTION_ANALYSES: Record<string, string[]> = {
  joy: [
    'The positive emotional tone suggests a sense of fulfillment or hope.',
    'Joy in dreams often indicates integration of a challenging life experience.',
    'This dream may reflect recent life satisfaction or anticipation of something meaningful.',
  ],
  sadness: [
    'Grief appearing in dreams often processes unacknowledged feelings.',
    'The sadness may represent something being released or mourned in your life.',
    'Dreams of sadness can signal emotional healing and integration.',
  ],
  fear: [
    'Fear in dreams highlights what the conscious mind may be avoiding.',
    'This dream likely points to an area of life where you feel vulnerable.',
    'Fears in dreams often reveal what we most care about protecting.',
  ],
  anger: [
    'Anger in dreams is often about feeling powerless or violated in some way.',
    'This may reflect frustration with a situation you cannot control.',
    'Dreams of anger can reveal boundary issues or unmet needs.',
  ],
  surprise: [
    'Surprise in dreams marks unexpected developments in your psyche.',
    'The unexpected elements suggest something new emerging from the unconscious.',
    'Surprise dreams often precede or follow significant life changes.',
  ],
  confusion: [
    'Confusion reflects the mind processing complex or contradictory information.',
    'This dream may be reconciling opposing forces in your life.',
    'Feeling lost in dreams often precedes clarity upon waking.',
  ],
  calm: [
    'A calm emotional landscape suggests good integration and peace of mind.',
    'This may reflect a settled period or successful navigation of a challenge.',
    'Serenity in dreams can indicate alignment between conscious and unconscious.',
  ],
  anxiety: [
    'Anxiety dreams often process daily worries and未 (not) expressed concerns.',
    'This dream may reflect uncertainty about an important decision or change.',
    'Anxiety appearing in dreams is the mind preparing us to face challenges.',
  ],
};

const THEMES_BY_KEYWORD: Record<string, string[]> = {
  falling: ['control', 'vulnerability', 'surrender'],
  water: ['emotions', 'purification', 'unconscious'],
  flying: ['freedom', 'ambition', 'transcendence'],
  chase: ['pursuit', 'avoidance', 'motivation'],
  house: ['self', 'identity', 'family'],
  snake: ['transformation', 'fear', 'primal'],
  dog: ['loyalty', 'instinct', 'friendship'],
  cat: ['independence', 'intuition', 'mystery'],
  car: ['direction', 'agency', 'motivation'],
  forest: ['unknown', 'growth', 'subconscious'],
  beach: ['transition', 'boundary', 'peace'],
  mountain: ['challenge', 'achievement', 'perspective'],
  child: ['innocence', 'potential', 'past'],
  school: ['learning', 'evaluation', 'preparation'],
  work: ['responsibility', 'performance', 'purpose'],
  family: ['roots', 'dynamics', ' belonging'],
  death: ['endings', 'transformation', 'fear'],
  wedding: ['union', 'commitment', 'transition'],
};

// ---------------------------------------------------------------------------
// Main Mock Generator
// ---------------------------------------------------------------------------

export function generateMockInterpretation(dream: Dream): Interpretation {
  const content = dream.content.toLowerCase();

  // Find matching symbols
  const matchedSymbols = COMMON_SYMBOLS.filter((s) =>
    content.includes(s.name),
  );

  // Pick 2-4 additional random symbols for variety
  const otherSymbols = COMMON_SYMBOLS
    .filter((s) => !content.includes(s.name))
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 3) + 2);

  const allSymbols: DreamSymbol[] = [
    ...matchedSymbols.map((s) => pickRandom(s.meanings)),
    ...otherSymbols.map((s) => pickRandom(s.meanings)),
  ].slice(0, 5);

  // Build symbol list
  const symbols: DreamSymbol[] = allSymbols.map((meaning) => ({
    name: meaning.symbol,
    meaning: meaning.meaning,
    personalContext: `This symbol has appeared in your recent dreams and may relate to ${
      meaning.themes[0]
    } in your life.`,
    occurrences: Math.floor(Math.random() * 10) + 1,
  }));

  // Extract themes from content
  const detectedThemes = new Set<string>();
  Object.entries(THEMES_BY_KEYWORD).forEach(([keyword, themes]) => {
    if (content.includes(keyword)) {
      themes.forEach((t) => detectedThemes.add(t));
    }
  });
  const themes = Array.from(detectedThemes).slice(0, 4);
  if (themes.length < 2) {
    themes.push('self-reflection', 'subconscious processing');
  }

  // Emotional analysis
  const primaryEmotion = dream.emotions[0] ?? 'calm';
  const emotionOptions = EMOTION_ANALYSES[primaryEmotion] ?? EMOTION_ANALYSES.calm;
  const emotionalAnalysis = emotionOptions[Math.floor(Math.random() * emotionOptions.length)];

  // Summary
  const summaries = generateSummaries(dream, themes, symbols);
  const summary = summaries[Math.floor(Math.random() * summaries.length)];

  // Lucidity analysis
  let lucidityAnalysis = '';
  if (dream.isLucid) {
    const lucidOptions = [
      'Your awareness within the dream suggests strong meta-cognitive abilities. Lucid dreams can be powerful spaces for rehearsal, problem-solving, and emotional healing.',
      'Being conscious in your dream indicates a healthy relationship between your waking awareness and your inner world.',
      'Lucid dreaming is a skill that grows with practice. The fact that it occurred naturally suggests your dream life is rich and accessible.',
    ];
    lucidityAnalysis = lucidOptions[Math.floor(Math.random() * lucidOptions.length)];
  }

  // Advice
  const advice = generateAdvice(dream, themes, primaryEmotion);

  return {
    generatedAt: new Date().toISOString(),
    model: 'mock',
    summary,
    themes,
    symbols,
    emotionalAnalysis,
    lucidityAnalysis,
    advice,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SymbolMeaning {
  symbol: string;
  meaning: string;
  themes: string[];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSummaries(
  dream: Dream,
  themes: string[],
  symbols: DreamSymbol[],
): string[] {
  const title = dream.title.toLowerCase();

  if (dream.isNightmare) {
    return [
      `This nightmare appears to be processing intense emotions, likely related to feelings of ${themes[0] ?? 'threat'} that feel overwhelming in your waking life. Nightmares often serve as emotional release valves.`,
      `The frightening imagery in this dream likely represents unprocessed fears. The ${symbols[0]?.name ?? 'central symbol'} may be pointing to something you need to address or acknowledge.`,
    ];
  }

  if (dream.isLucid) {
    return [
      `This lucid dream reveals a strong connection between your conscious and unconscious minds. The ${themes[0] ?? 'main theme'} suggests you're processing important life decisions.`,
    ];
  }

  if (symbols.length > 0) {
    return [
      `This dream centers around ${symbols[0]?.name}, a symbol often associated with ${symbols[0]?.meaning.toLowerCase()}. The imagery suggests you're working through themes of ${themes.join(', ')}.`,
      `The ${symbols[0]?.name ?? 'central imagery'} in this dream points to a need for ${themes[0] ?? 'self-reflection'}. Your subconscious may be urging you to pay attention to ${themes[1] ?? 'an unspoken concern'}.`,
    ];
  }

  return [
    `This dream reflects your unconscious processing of recent experiences. The ${themes[0] ?? 'underlying theme'} suggests you're working through something meaningful, even if the connection isn't immediately clear.`,
    `A classic ${themes[0] ?? 'dream theme'} appears here, suggesting your mind is integrating new information or working through a transitional period.`,
  ];
}

function generateAdvice(dream: Dream, themes: string[], emotion: string): string {
  const adviceOptions = [
    `What would it feel like to ${
      dream.isLucid ? 'explore this dream space with more intention' : 'let this dream be, without forcing meaning'
    }?`,
    `If the ${themes[0] ?? 'theme'} were trying to tell you something, what might it be?`,
    `Is there an area of your life where you've been avoiding thinking about ${themes[0] ?? 'something'}?`,
    `Try keeping a notepad by your bed — if this theme continues, patterns may emerge.`,
    `Consider: what in your waking life feels connected to the emotion of ${emotion}?`,
    `This might be a good week to pause before making big decisions. Your unconscious may still be processing.`,
  ];
  return adviceOptions[Math.floor(Math.random() * adviceOptions.length)];
}

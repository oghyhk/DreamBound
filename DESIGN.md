# DreamBound — Design & Architecture Document

> **Status:** Phase 1 — MVP development. All features marked `[PLACEHOLDER]` are scaffolded but not yet functional. See [Section 12 — Future Phases](#12-future-phases).

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [File Structure](#3-file-structure)
4. [Data Models](#4-data-models)
5. [Core Services](#5-core-services)
6. [Navigation & Routing](#6-navigation--routing)
7. [UI Components](#7-ui-components)
8. [State Management](#8-state-management)
9. [Screen Specifications](#9-screen-specifications)
10. [AI Integration](#10-ai-integration)
11. [Native Modules & Permissions](#11-native-modules--permissions)
12. [Future Phases](#12-future-phases)
13. [Implementation Notes](#13-implementation-notes)
14. [Known Issues & Open Questions](#14-known-issues--open-questions)

---

## 1. Overview

**DreamBound** is a cross-platform mobile app for recording, analyzing, and understanding dreams. Built with React Native + Expo, it uses a voice-first input paradigm — the core insight being that users are half-asleep when they remember their dreams and typing is too friction-heavy.

The app functions entirely offline-first, storing dreams locally via AsyncStorage with a Zustand state layer. Cloud sync and real AI interpretation are planned for Phase 2.

**Tagline:** *Understand your dreams. Remember your life.*

**Platform targets:**
- Android (Google Play Store) — primary
- iOS (Apple App Store) — React Native cross-compilation
- Web (future Phase 2+)

---

## 2. Tech Stack

| Concern | Choice | Version | Notes |
|---------|--------|---------|-------|
| Framework | React Native | 0.76.6 | New Architecture enabled |
| SDK | Expo | SDK 52 | Managed workflow |
| Language | TypeScript | 5.3 | Strict mode |
| Navigation | Expo Router | 4.0 | File-based routing |
| State | Zustand | 5.0 | Persist middleware |
| Local Storage | AsyncStorage + expo-file-system | — | Dreams JSON + audio files |
| Audio | expo-av | 15.0 | Recording + playback |
| Notifications | expo-notifications | 29.0 | Lucid reminders |
| Animations | react-native-reanimated | 3.16 | Micro-interactions |
| Gestures | react-native-gesture-handler | 2.20 | Swipe, drag |
| Icons | lucide-react-native | 0.468 | SVG line icons |
| Date utils | date-fns | 4.0 | Date parsing + formatting |
| UUID | uuid | 11.0 | ID generation |
| AI | OpenAI SDK (future) | — | Phase 2 |

### Dev Dependencies

| Tool | Version |
|------|---------|
| Babel | 7.25 |
| ESLint | 9.0 |
| TypeScript | 5.3 |

---

## 3. File Structure

```
DreamBound/
├── app/                          # Expo Router screens (file-based routing)
│   ├── _layout.tsx               # Root layout with providers
│   ├── index.tsx                 # Redirect → /tonight
│   ├── (tabs)/                   # Bottom tab navigator
│   │   ├── _layout.tsx           # Tab bar config with custom add button
│   │   ├── tonight.tsx           # Home tab: quick entry, stats, recent dreams
│   │   ├── journal.tsx           # Journal tab: calendar + list view
│   │   ├── insights.tsx          # Insights tab: patterns, statistics
│   │   ├── profile.tsx           # Profile tab: account, settings
│   │   └── __add_placeholder.tsx # Invisible tab for center add button
│   └── (modals)/                 # Modal screens (full-screen presentation)
│       ├── _layout.tsx           # Modal stack config
│       ├── new-dream.tsx         # Dream entry: voice + text + emotions
│       ├── dream/[id].tsx        # Dream detail: full view + interpretation
│       ├── interpretation.tsx    # Full-screen interpretation [PLACEHOLDER]
│       └── settings.tsx          # Settings sheet
│
├── src/
│   ├── types/
│   │   └── index.ts              # All TypeScript interfaces and types
│   ├── constants/
│   │   ├── theme.ts             # Design tokens: colors, spacing, typography
│   │   └── config.ts             # App constants: storage keys, AI config, etc.
│   ├── services/
│   │   ├── storage.ts            # AsyncStorage wrapper + file system helpers
│   │   ├── ai.ts                 # OpenAI integration layer (real API)
│   │   ├── mockAi.ts             # Mock AI for development (returns realistic data)
│   │   ├── audio.ts              # expo-av recording/playback wrapper
│   │   └── dreamEngine.ts        # Core business logic: CRUD, analysis, insights
│   ├── store/
│   │   ├── dreamStore.ts         # Zustand store: dreams state + CRUD
│   │   └── userStore.ts          # Zustand store: profile, preferences, sleep
│   ├── components/
│   │   ├── ui/                   # Generic reusable UI components (future)
│   │   ├── dream/                # Dream-specific components (future)
│   │   ├── entry/                # Dream entry components (future)
│   │   └── insights/             # Charts and stats (future)
│   └── utils/
│       └── helpers.ts             # Date formatting, text utils, debounce
│
├── assets/                        # App icons, splash, fonts
│   ├── icon.png                  # App icon (1024x1024)
│   ├── splash.png                 # Splash screen (1284x2778)
│   ├── adaptive-icon.png          # Android adaptive icon foreground
│   └── favicon.png               # Web favicon
│
├── package.json
├── tsconfig.json
├── app.json                      # Expo config (name, permissions, plugins)
├── SPEC.md                       # Product specification (features, design, roadmap)
└── DESIGN.md                    # This document (architecture, data, implementation)
```

---

## 4. Data Models

All models are defined in `src/types/index.ts`.

### 4.1 Dream

```typescript
interface Dream {
  id: string;                    // UUID v4
  createdAt: string;              // ISO 8601
  updatedAt: string;             // ISO 8601
  title: string;                  // Auto-generated from first 6 words if empty
  content: string;                // Transcribed or typed dream text
  audioUri?: string;             // Local file path (expo-file-system)
  audioDuration?: number;         // Seconds
  emotions: Emotion[];             // 0-3 emotions
  tags: string[];                 // User-defined, max 10
  isLucid: boolean;               // Lucid dream flag
  isNightmare: boolean;           // Nightmare flag
  interpretation?: Interpretation; // AI analysis result
  editHistory: DreamEdit[];        // Up to 10 previous versions
}
```

### 4.2 Interpretation

```typescript
interface Interpretation {
  generatedAt: string;            // ISO 8601
  model: string;                  // "gpt-4o", "gpt-4o-mini", "mock"
  summary: string;                // 2-3 sentence overview
  themes: string[];               // Top 3-4 themes
  symbols: DreamSymbol[];          // Detected symbols with personal context
  emotionalAnalysis: string;       // Emotional landscape of dream
  lucidityAnalysis: string;       // What lucid awareness might mean
  advice: string;                 // Reflective question or prompt
}

interface DreamSymbol {
  name: string;                   // e.g. "water", "falling"
  meaning: string;                // General psychological meaning
  personalContext: string;         // What it means for THIS user
  occurrences: number;            // Total across all dreams
}
```

### 4.3 Profile & User

```typescript
interface Profile {
  id: string;
  email: string;
  createdAt: string;
  premium: boolean;
  interpretationCredits: number;   // Free tier: 3/month
  preferences: UserPreferences;
  lifetimeStats: LifetimeStats;
}

interface UserPreferences {
  notificationsEnabled: boolean;
  quietHoursStart: string;         // "22:00"
  quietHoursEnd: string;           // "07:00"
  lucidRemindersInterval: number;  // Hours (0=disabled)
  defaultEmotions: Emotion[];
  language: string;                // "en" initially
  useMockAI: boolean;             // True = mock responses
  aiModel: AiModel;                // 'gpt-4o' | 'gpt-4o-mini' | 'claude'
  dreamWallEnabled: boolean;
}

interface LifetimeStats {
  totalDreams: number;
  totalInterpretations: number;
  lucidDreams: number;
  nightmares: number;
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: string | null;
}
```

### 4.4 SleepEntry

```typescript
interface SleepEntry {
  id: string;
  date: string;          // YYYY-MM-DD
  bedtime?: string;      // ISO 8601
  wakeTime: string;      // ISO 8601
  quality: number;       // 1-5
  dreamRecall: number;   // 1-5
  notes?: string;
}
```

### 4.5 Emotions

Eight fixed emotions, not user-configurable (configurable emotions is Phase 2):

```typescript
type Emotion = 'joy' | 'sadness' | 'fear' | 'anger' | 'surprise' | 'confusion' | 'calm' | 'anxiety';
```

---

## 5. Core Services

### 5.1 `dreamEngine.ts` — Core Business Logic

The dream engine is the central service for all dream operations. It handles no I/O directly — it transforms data and delegates persistence to `storage.ts`.

**Key operations:**

| Function | Signature | Description |
|----------|-----------|-------------|
| `createDream` | `(input) → Dream` | Factory, generates UUID + title |
| `updateDream` | `(dream, input) → Dream` | Applies updates, manages edit history |
| `attachAudio` | `(dream, uri, duration) → Promise<Dream>` | Copies audio file to app storage |
| `runInterpretation` | `(dream, useMock, model, apiKey?) → Promise<Interpretation>` | Calls AI or mock service |
| `extractSymbols` | `(dreams[]) → SymbolFrequency[]` | Keyword-based symbol detection |
| `getEmotionTrends` | `(dreams[]) → EmotionTrend[]` | Emotion distribution |
| `getStatistics` | `(dreams[], sleep?) → DreamStatistics` | Full stats object |
| `calculateStreaks` | `(dreams[]) → {current, longest}` | Streak computation |
| `searchDreams` | `(dreams[], query) → Dream[]` | Full-text search |
| `filterDreams` | `(dreams[], filters) → Dream[]` | Apply filter criteria |
| `getDreamsForDate` | `(dreams[], date) → Dream[]` | Filter by date |
| `groupDreamsByMonth` | `(dreams[]) → Record<month, Dream[]>` | Grouped for list view |
| `getAllTags` | `(dreams[]) → string[]` | Deduplicated tag list |

**Symbol extraction** uses a keyword list covering ~50 common dream symbols. This is intentionally naive — in Phase 4, this will be replaced with an embedding-based approach that learns the user's personal symbol vocabulary.

### 5.2 `ai.ts` — AI Service Layer

Two-mode service:

1. **Mock mode** (`useMockAI = true`): Returns `generateMockInterpretation()` from `mockAi.ts`. Always succeeds instantly. Good for development and demos.

2. **Real mode** (`useMockAI = false`): Calls OpenAI Chat Completions API with structured JSON output. Supports retry with exponential backoff. Falls back to mock on persistent failure.

**API Key handling:** The `apiKey` parameter is passed through from the caller. In Phase 2, this will come from a secure credential store (expo-secure-store or device keychain).

**Prompt structure:**
- System prompt: Defines the dream analyst persona and JSON output schema
- User prompt: Dream content + metadata (emotions, tags, lucidity, date)

### 5.3 `mockAi.ts` — Development AI

Generates realistic but deterministic dream interpretations for development. Uses a keyword-matched symbol database (`COMMON_SYMBOLS`) to pick relevant symbols from dream content, then assembles responses from template phrases.

Does NOT call any external API. Response structure exactly mirrors the real `Interpretation` interface.

### 5.4 `audio.ts` — Audio Recording

Wraps `expo-av` Recording and Sound APIs:

| Function | Description |
|----------|-------------|
| `startRecording()` | Requests mic permission, configures audio mode, starts recording |
| `stopRecording()` | Stops, unloads, returns `{uri, duration}` |
| `cancelRecording()` | Stops and deletes the temp file |
| `getRecordingStatus()` | Returns current duration and metering data |
| `playAudio(uri)` | Plays back a saved recording |
| `transcribeAudio(uri)` | **[PLACEHOLDER]** — Whisper API integration |

**Audio files** are stored in `FileSystem.documentDirectory + 'audio/'` as `.m4a` files. The filename is `dream_<timestamp>.m4a`.

**Recording settings:**
- Sample rate: 44,100 Hz
- Channels: 1 (mono)
- Bit rate: 128 kbps
- Max duration: 300 seconds (5 minutes)

### 5.5 `storage.ts` — Persistence

Wraps AsyncStorage with typed operations:

| Function | Description |
|----------|-------------|
| `saveDreams(dreams[])` | Persist dreams array |
| `loadDreams()` | Load dreams array |
| `saveProfile(profile)` | Persist profile |
| `loadProfile()` | Load profile |
| `savePreferences(prefs)` | Persist preferences |
| `loadPreferences()` | Load with `DEFAULT_PREFERENCES` merge |
| `saveAudioFile(uri, filename)` | Copy audio to app document directory |
| `deleteAudioFile(uri)` | Delete audio file |
| `exportAllData()` | Export everything as JSON string |

**Audio directory:** `FileSystem.documentDirectory + 'audio/'`

---

## 6. Navigation & Routing

**Expo Router** is used with a file-based routing convention.

### Screen Hierarchy

```
/                          → Redirects to /tonight
/(tabs)/tonight            → Tab 1 (Home)
/(tab)/journal             → Tab 2 (Journal)
/(tabs)/insights           → Tab 3 (Insights)
/(tabs)/profile             → Tab 4 (Profile)
/(modals)/new-dream         → Full-screen modal (no tab bar)
/(modals)/dream/[id]        → Dream detail modal
/(modals)/interpretation    → Full-screen interpretation [PLACEHOLDER]
/(modals)/settings          → Settings sheet modal
```

### Tab Bar

The tab bar is a custom implementation in `app/(tabs)/_layout.tsx` using React Native's built-in tab navigator. The center "+" button is a **custom tabBarButton** that navigates to the `new-dream` modal instead of a tab screen.

**Tab icons:** Lucide React Native icons, 20px.

### Modal Presentation

All modals use `presentation: 'modal'` and `animation: 'slide_from_bottom'`. The modal layout (`app/(modals)/_layout.tsx`) inherits from the root layout but adds a dark scrim and rounded top corners.

---

## 7. UI Components

### 7.1 Current Implementation

All components are currently **inline** within the screen files. They will be extracted to `src/components/` as the app matures.

### 7.2 Planned Component Library

**Generic UI (`src/components/ui/`):**
- `Button` — Primary, secondary, ghost, destructive variants
- `Card` — Surface card with optional glow, border-color variants
- `Badge` — Small labeled pill (emotions, tags, state)
- `Toggle` — Custom switch with animated thumb
- `Input` — Text input with label and error state
- `BottomSheet` — Draggable modal sheet with snap points
- `Skeleton` — Loading placeholder

**Dream-specific (`src/components/dream/`):**
- `DreamCard` — Summary card for list/calendar views
- `EmotionBadge` — Color-coded emotion indicator
- `TagChip` — Tag display and removal
- `InterpretationCard` — Expandable AI interpretation display
- `AudioPlayer` — Playback controls for voice recordings

**Entry (`src/components/entry/`):**
- `VoiceRecorder` — Recording button + waveform visualization
- `EmotionPicker` — Grid of emotion options
- `LucidToggle` — Lucid/Nightmare state toggles
- `TagInput` — Comma-separated tag input with autocomplete

**Insights (`src/components/insights/`):**
- `StatCard` — Icon + label + value + trend indicator
- `EmotionBar` — Horizontal bar for emotion distribution
- `SymbolCard` — Symbol frequency with trend
- `StreakDisplay` — Current/longest streak visualization

### 7.3 Design Tokens

All visual design is centralized in `src/constants/theme.ts`:

| Token | Value |
|-------|-------|
| `colors.background` | `#0A0E1A` |
| `colors.surface` | `#111827` |
| `colors.surfaceElevated` | `#1E2442` |
| `colors.primary` | `#6366F1` |
| `colors.accent` | `#F59E0B` |
| `colors.lucid` | `#22D3EE` |
| `colors.nightmare` | `#FB7185` |
| `colors.textPrimary` | `#F8FAFC` |
| `colors.textSecondary` | `#94A3B8` |
| `colors.textMuted` | `#64748B` |
| `spacing.*` | 4px grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64) |
| `borderRadius.*` | sm:6, md:16, lg:24, full:9999 |
| `typography.*` | h1:32px/700, h2:22px/600, h3:18px/600, body:16px/400, caption:12px/500 |

---

## 8. State Management

### 8.1 Zustand Stores

Two stores, both using the `persist` middleware with AsyncStorage:

**`dreamStore.ts`**
- Persisted: `dreams[]`, `viewMode`
- Ephemeral: `isLoaded`, `isInterpreting`, `statistics`, `allTags`
- Key: `dreambound:dreams`

**`userStore.ts`**
- Persisted: `profile`, `isPremium`, `preferences`, `sleepEntries`, `interpretationCreditsUsed`
- Ephemeral: none (all persisted)
- Key: `dreambound:user`

### 8.2 Store Access Pattern

Screens use selective subscriptions to avoid unnecessary re-renders:

```typescript
// Good — subscribes only to needed fields
const recentDreams = useDreamStore((s) => s.getRecentDreams(5));
const stats = useDreamStore((s) => s.statistics);

// Avoid — subscribes to entire store, re-renders on any change
const everything = useDreamStore();
```

### 8.3 Cross-Store Operations

The `interpretDream` action in `dreamStore` calls `useUserStore`'s `useInterpretationCredit()` to check credits before proceeding. This is done inline at call time.

---

## 9. Screen Specifications

### 9.1 Tonight Screen (`/(tabs)/tonight.tsx`)

**Purpose:** Primary landing screen, morning entry point.

**Layout:**
1. Greeting header ("Good evening" / "Good morning" / "Good afternoon")
2. Quick entry card — prominent mic button → navigates to `/new-dream`
3. Stats row (only shown if `statistics.totalDreams > 0`): Total Dreams, Streak, Lucid %
4. Premium banner (only if `!isPremium`): CTA to upgrade
5. Recent Dreams list (max 5): each shows title, date, emotion badges, snippet

**Time-based greeting:**
- 5:00–11:59 → "Good morning"
- 12:00–17:59 → "Good afternoon"
- 18:00–04:59 → "Good evening"

### 9.2 Journal Screen (`/(tabs)/journal.tsx`)

**Purpose:** Full history of all dreams.

**Layout (List mode):**
1. Search input (placeholder — full search not yet wired up)
2. Month-grouped dream list, newest first
3. Each dream card: title, date, emotion badges, snippet (2 lines)

**Layout (Calendar mode):**
1. Month navigation (prev/next)
2. 7-column day grid with day-of-week headers
3. Colored dots per day: indigo=normal, cyan=lucid, rose=nightmare
4. Tap day → navigate to that day's dream (or empty state)

**Toggle:** List/calendar buttons in header. State persisted in `viewMode`.

### 9.3 Insights Screen (`/(tabs)/insights.tsx`)

**Purpose:** Pattern recognition and dream statistics.

**Empty state:** Shown when `totalDreams === 0`. Illustration + prompt to record first dream.

**Content (when populated):**
1. Overview grid (2×2): Total Dreams, Avg/Week, Current Streak, Longest Streak
2. Dream Types: Lucid % + Nightmare % cards side-by-side
3. Emotion Distribution: horizontal bars per emotion
4. Most Active Time: hour heatmap or single value
5. Recurring Symbols: ranked list (symbol name, frequency, trend indicator)
6. Dominant Emotion: single emotion card

### 9.4 Profile Screen (`/(tabs)/profile.tsx`)

**Purpose:** Account management and settings.

**Sections:**
1. Account card: avatar (initial), email, credits/premium status
2. Premium banner (if not premium): upgrade CTA
3. Stats row: total dreams, streak, lucid %
4. Preferences section: Dark mode toggle (disabled — always dark), Notifications toggle, AI Model selector
5. Data section: Export Data, Clear All Data (destructive)
6. Sign Out button
7. App version

### 9.5 New Dream Modal (`/(modals)/new-dream.tsx`)

**Purpose:** Capture a dream immediately upon waking.

**Recording flow:**
1. Large mic button → starts recording immediately (full-screen recording UI with waveform)
2. Tap stop → audio saved, returns to text input
3. Audio preview shown with delete option

**Entry flow:**
1. Text area (large, borderless) with placeholder "What did you dream about?"
2. Emotion picker: 8 emotions in wrap layout, tap to select (max 3)
3. Tags input: comma-separated text
4. Lucid toggle + Nightmare toggle (mutually exclusive presentation)
5. Save button → validates non-empty → creates dream → optional auto-interpret

**Validation:**
- `content` must be non-empty
- Emotions capped at 3
- Tags capped at 10

### 9.6 Dream Detail Modal (`/dream/[id].tsx`)

**Purpose:** Full view of a single dream + its AI interpretation.

**Content:**
1. Title + date
2. Badges: Lucid / Nightmare if applicable
3. Audio card (if audio exists)
4. Emotion badges
5. Tags
6. Full dream text
7. AI Interpretation card (if exists) — shows summary, themes, symbols, analysis
8. "Get AI Interpretation" button (if no interpretation yet) — triggers `interpretDream`
9. Edit history indicator (if `editHistory.length > 0`)

**Actions:**
- Delete (trash icon in header) → confirmation alert → deletes and pops back
- Edit → **[PLACEHOLDER]** — inline editing not yet implemented

### 9.7 Settings Modal (`/(modals)/settings.tsx`)

**Purpose:** Fine-grained app preferences.

**Sections:**
1. AI Settings: Mock toggle, Model selector
2. Notifications: Enable toggle, Lucid reminder interval
3. Quiet Hours: Start/End time selectors
4. Privacy: Dream Wall toggle

### 9.8 Interpretation Modal (`/(modals)/interpretation.tsx`) — [PLACEHOLDER]

Currently a minimal implementation. The full-screen interpretation view is rendered inline in `dream/[id].tsx`. This modal exists as a routing target for potential future deep-linking.

---

## 10. AI Integration

### 10.1 Architecture

```
dreamStore.interpretDream(id)
    ↓
dreamEngine.runInterpretation(dream, useMock, model, apiKey)
    ↓
    ├── useMock=true  → mockAi.generateMockInterpretation()
    └── useMock=false → ai.callOpenAI(dream, model, apiKey)
                            ↓
                        POST /v1/chat/completions
                            ↓
                        parseInterpretationResponse()
```

### 10.2 Prompt Design

The system prompt defines the dream analyst persona and constrains output to a strict JSON schema. This ensures:
1. Structured data (parseable into `Interpretation` interface)
2. Personality consistency
3. No hallucinated dream content (only analysis)

### 10.3 API Key Management

**Current:** API key is passed as a parameter and stored nowhere. Callers pass `undefined` in mock mode.

**Phase 2:** Keys will be stored in `expo-secure-store`, never in AsyncStorage or code.

### 10.4 Mock AI

The mock service (`mockAi.ts`) generates interpretations that:
- Extract keywords from dream content (matched against `COMMON_SYMBOLS`)
- Pick emotions based on the dream's emotion field
- Vary responses using seeded randomness so repeated calls differ slightly
- Match the exact `Interpretation` interface structure

### 10.5 Transcription — [PLACEHOLDER]

`audio.transcribeAudio()` currently returns `{text: '', confidence: 0}`. In Phase 2, this will call OpenAI Whisper API to convert voice recordings to text automatically.

---

## 11. Native Modules & Permissions

### 11.1 Android Permissions

Declared in `app.json` → `android.permissions`:

| Permission | Reason |
|-----------|--------|
| `RECORD_AUDIO` | Voice dream recording |
| `VIBRATE` | Notification feedback |
| `RECEIVE_BOOT_COMPLETED` | Reschedule notifications after reboot |
| `SCHEDULE_EXACT_ALARM` | Precise lucid dream reminder timing |

### 11.2 iOS Permissions

Declared in `app.json` → `ios.infoPlist`:

| Key | Value |
|-----|-------|
| `NSMicrophoneUsageDescription` | "DreamBound needs microphone access to record your dream descriptions when you wake up." |
| `NSPhotoLibraryUsageDescription` | "DreamBound needs photo library access to save dream artwork generated by AI." |

### 11.3 Expo Plugins

```json
"plugins": [
  "expo-router",
  ["expo-av", { "microphonePermission": "..." }],
  ["expo-notifications", { "sounds": [] }]
]
```

---

## 12. Future Phases

### Phase 1 — MVP (Current)
- [x] Voice recording (no auto-transcription)
- [x] Text dream entry
- [x] Basic journal (calendar + list)
- [x] Mock AI interpretation
- [x] Basic insights (symbols, emotions, streaks)
- [x] Emotion + tag tracking
- [x] Lucid/Nightmare flags
- [x] Local AsyncStorage persistence
- [x] Zustand state management
- [x] Bottom tab navigation
- [x] Full-screen dream entry modal
- [ ] **Inline editing of dreams** — [PLACEHOLDER]
- [ ] **Full-text search** — search UI exists, not wired to engine
- [ ] **Emotion picker redesign** — needs better UX in new-dream modal

### Phase 2 — Cloud + Real AI
- [ ] User accounts (email/password + OAuth: Google, Apple)
- [ ] Supabase backend (PostgreSQL + Auth + Realtime)
- [ ] Real OpenAI interpretation (GPT-4o / GPT-4o-mini)
- [ ] OpenAI Whisper transcription
- [ ] Cloud sync across devices
- [ ] Interpretation credits system (3 free/month, premium unlimited)
- [ ] Secure API key storage (expo-secure-store)

### Phase 3 — Community + Social
- [ ] Dream Wall: anonymous sharing
- [ ] Comment and react to shared dreams
- [ ] "Dreams like yours" matching
- [ ] Content moderation system
- [ ] Report/abuse system

### Phase 4 — Deep Personalization
- [ ] Symbol memory: learn YOUR recurring symbols over time
- [ ] Embedding-based symbol extraction (instead of keyword matching)
- [ ] Sleep quality integration (HealthKit / Google Fit)
- [ ] Personal dream dictionary
- [ ] Dream forecasting based on life events
- [ ] Configurable emotions (user-defined emotion palette)

### Phase 5 — Advanced Tools
- [ ] WBTB timer with gentle wake sounds
- [ ] Lucid dream induction audio (binaural beats option)
- [ ] Reality check notification system with smart scheduling
- [ ] Dream incubation planning
- [ ] AI-generated dream imagery (Stable Diffusion / DALL-E)

---

## 13. Implementation Notes

### 13.1 Profile Sync Pattern

Every interactive element that modifies profile state must write to `store.currentProfile`, NOT the closure variable. This avoids the "Profile Clone Reference Bug" where changes appear to work but don't persist:

```typescript
// WRONG — writes to clone
button.addEventListener('click', async () => {
  profile.someField = newValue;      // ← clone mutation
  await store.saveCurrentProfile();  // ← sends unmodified store.currentProfile
});

// CORRECT — writes to authoritative store
button.addEventListener('click', async () => {
  store.currentProfile.someField = newValue;  // ← authoritative
  await store.saveCurrentProfile();
  renderPage(store.getCurrentProfile());        // ← fresh clone for render
});
```

### 13.2 Dream Entry Auto-Title

If the user doesn't provide a title, `dreamEngine.generateTitle()` creates one from the first 6 words of the content, with an ellipsis if longer.

### 13.3 Audio File Cleanup

When a dream is deleted, its audio file is NOT automatically deleted from the filesystem (pending fix). The `removeAudio` function exists for future use.

### 13.4 Edit History

`updateDream` automatically saves the previous content to `editHistory` before applying changes. History is capped at 10 entries (oldest removed when limit exceeded).

### 13.5 Date Formatting

All dates stored as ISO 8601 strings. Display formatting uses `date-fns`:
- `formatDreamDate` → "Today, 3:42 AM" / "Yesterday, 11:15 PM" / "Mar 5, 11:15 AM"
- `formatSectionHeader` → "March 2025" (for list grouping)
- `formatMonthYear` → "March 2025"

### 13.6 EAS Build Configuration

For building Android APKs and iOS builds via EAS:
```bash
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

EAS JSON config (`eas.json`) is pending creation in Phase 2.

---

## 14. Known Issues & Open Questions

1. **Audio file cleanup on dream delete**: Not yet implemented. Orphaned audio files accumulate.

2. **Transcription**: `transcribeAudio()` returns empty. User must manually type content after voice recording.

3. **Full-text search**: The journal screen has a search bar, but it doesn't yet filter results from `getFilteredDreams()`. The search text is captured in state but not applied.

4. **Inline dream editing**: The `editDream` action exists in the store, but there's no UI to trigger it. The Dream Detail screen shows a delete button but no edit button.

5. **AI API key security**: In Phase 1, no API key storage exists. `interpretDream` is always called in mock mode unless a key is manually passed.

6. **Cloud backend**: No backend exists. All data is local. Supabase integration is planned for Phase 2.

7. **iOS build**: The app has not been built for iOS yet. Expo Doctor should be run before first iOS build.

8. **Notification scheduling**: `expo-notifications` is configured but no notification scheduling code has been written. Lucid reminders are stored as a preference but don't trigger system notifications.

9. **Interpretation regeneration**: Once an interpretation is generated, there's no UI to regenerate it with a different model or prompt variant.

10. **Dream Wall moderation**: No content moderation strategy has been defined. Phase 3 needs a plan for preventing abuse of the anonymous sharing feature.

---

*Document maintained alongside `SPEC.md` (product specification) and `package.json` (dependencies). Update this document whenever architecture or data model changes are made.*

# DreamBound — Product Specification

## 1. Concept & Vision

**DreamBound** is an AI-powered dream journal that transforms the chaotic, fleeting experience of dreaming into something you can record, understand, and grow from. It feels like a personal dream laboratory — intimate, calming, and deeply personal. The app meets you at the edge of sleep and wakefulness: voice-first entry so you never lose a dream before you can type it, intelligent interpretation that learns *your* symbol vocabulary over time, and beautiful pattern visualizations that make your subconscious feel seen.

The emotional tone is **lunar and ethereal** — a quiet space that feels like the moment between night and morning. Not clinical, not gamified. Just yours.

---

## 2. Design Language

### Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Background | Deep Navy | `#0A0E1A` |
| Surface | Midnight Blue | `#111827` |
| Surface Elevated | Dark Indigo | `#1E2442` |
| Primary | Indigo | `#6366F1` |
| Primary Light | Soft Violet | `#818CF8` |
| Accent | Warm Amber | `#F59E0B` |
| Accent Glow | Gold | `#FBBF24` |
| Text Primary | White | `#F8FAFC` |
| Text Secondary | Slate | `#94A3B8` |
| Text Muted | Dark Slate | `#64748B` |
| Lucid Marker | Cyan | `#22D3EE` |
| Nightmare Marker | Rose | `#FB7185` |
| Success | Emerald | `#34D399` |
| Border | Dark Border | `#1F2937` |
| Overlay | Scrim | `rgba(0,0,0,0.6)` |

### Typography

| Role | Font | Size | Weight |
|------|------|------|--------|
| H1 (Screen Title) | System / Inter | 32px | Bold (700) |
| H2 (Section Header) | System / Inter | 22px | SemiBold (600) |
| H3 (Card Title) | System / Inter | 18px | SemiBold (600) |
| Body | System / Inter | 16px | Regular (400) |
| Body Small | System / Inter | 14px | Regular (400) |
| Caption | System / Inter | 12px | Medium (500) |
| Label | System / Inter | 11px | SemiBold (600) |
| Button | System / Inter | 16px | SemiBold (600) |

### Spacing System (8pt grid)
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64px`

### Border Radius
- Small (tags, chips): `6px`
- Medium (cards, inputs): `16px`
- Large (modals, sheets): `24px`
- Full (avatars, buttons): `9999px`

### Shadows
- Card shadow: `0 4px 24px rgba(0,0,0,0.4)`
- Glow effect (primary): `0 0 20px rgba(99,102,241,0.3)`
- Soft lift: `0 8px 32px rgba(0,0,0,0.5)`

### Motion Philosophy
- **Ease curve:** `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)
- **Micro-interactions:** 150ms (button press, toggle)
- **Panel transitions:** 300ms (modals, sheets)
- **Page transitions:** 350ms (screen navigation)
- **Dream entry:** subtle fade + gentle float-up (400ms)
- **Interpretation reveal:** typewriter-style text appearance
- **Stagger children:** 50ms delay between list items on mount

### Visual Assets
- Icons: Lucide React (consistent, minimal line icons)
- No emoji in UI — SVG icons only
- Background: subtle gradient from `#0A0E1A` to `#111827` with faint aurora borealis pattern (CSS gradient overlay)
- Dream state colors: deep purple wash for normal, cyan border for lucid, rose for nightmare

---

## 3. Layout & Structure

### Navigation
**Bottom Tab Navigator** (5 tabs):

| Tab | Icon | Label | Route |
|-----|------|-------|-------|
| Home | Sparkles | Tonight | `/(tabs)/tonight` |
| Journal | BookOpen | Journal | `/(tabs)/journal` |
| Add | Mic (center, prominent) | — | `(new-dream)` modal |
| Insights | BarChart2 | Insights | `/(tabs)/insights` |
| Profile | User | Profile | `/(tabs)/profile` |

### Screen Hierarchy

```
/                           → Redirect to /tonight
/(tabs)
  /tonight                  → Home: quick entry, recent dreams, tonight's summary
  /journal                  → Full journal: calendar + list toggle
  /insights                 → Patterns, recurring symbols, statistics
  /profile                  → Account, settings, app preferences
/(modals)
  /new-dream                → Full-screen dream entry modal (voice + text)
  /dream/[id]               → Dream detail with AI interpretation
  /settings                 → App settings sheet
  /interpretation           → Full AI interpretation view
  /dream-wall               → Community shared dreams (future)
```

### Visual Pacing
- **Tonight screen:** Spacious hero with quick-entry button → compact dream cards below
- **Dream Entry:** Full-screen immersive, minimal chrome, voice dominates first
- **Journal:** Dense but organized — calendar gives overview, list gives depth
- **Insights:** Data-forward but soft — charts with dreamy gradients, not harsh bars
- **Profile:** Clean settings list with generous spacing

---

## 4. Features & Interactions

### 4.1 Dream Entry (Core)

**Voice Recording**
- Tap the center mic button → immediately starts recording
- Waveform visualization during recording (animated bars)
- Tap again to stop → auto-transcribes + saves audio locally
- Audio stored as `.m4a` files in app documents directory
- If transcription fails, audio is saved with a "tap to transcribe" prompt

**Text Entry**
- Large, borderless textarea — placeholder: *"What did you dream about?"*
- Auto-save every 3 seconds while typing
- Character count hidden unless > 500 chars
- Emotion picker below: 8 emotions (Joy, Sadness, Fear, Anger, Surprise, Confusion, Calm, Anxiety)
- Tags input: comma-separated, autocomplete from existing tags
- Lucidity toggle: "Was this a lucid dream?"
- Nightmare toggle: "Was this a nightmare?"
- Optional title field (auto-generated from first 6 words if empty)

**Quick Entry Flow**
1. User wakes → opens app → sees Tonight screen
2. Taps prominent mic button → enters voice recording immediately
3. After recording stops → transcribed text appears → user can edit
4. Taps "Interpret" → AI analysis generates → shown on Dream Detail screen

**States**
- Empty (no dreams today): Illustrated empty state with moon graphic
- Recording: Full-screen recording UI with waveform
- Editing: Text input with emotion/tags/lucidity pickers
- Saving: Brief spinner → redirects to Dream Detail

### 4.2 AI Dream Interpretation

**How it works**
- Dream text sent to OpenAI GPT-4o (configurable model)
- Prompt includes dream content + user's dream history + recurring symbols
- Response structured as JSON: `{ summary, themes, symbols: [{name, meaning, personal_context}], emotions, lucidity_analysis, advice }`
- Stored in dream record for offline viewing

**Interpretation Display**
- Appears on Dream Detail screen below the dream text
- Sections: Summary, Key Symbols, Emotional Analysis, What This Might Mean
- Each symbol shows: name, general meaning, "This appears X times in your dreams"
- "Tap any symbol to see its history across your dreams"
- Interpretation can be regenerated (costs 1 credit or watched ad)

**Placeholder Implementation**
- For initial build: Mock interpretation service returning static but realistic responses
- Toggle in settings: "Use mock AI" vs "Use real AI (requires API key)"
- When mock: returns a realistic-looking interpretation with placeholder symbols

### 4.3 Dream Journal

**Calendar View**
- Month grid with colored dots per day (indigo=normal, cyan=lucid, rose=nightmare)
- Tap a day → shows dreams from that day in a bottom sheet
- Current day highlighted with amber ring
- Swipe to change months

**List View**
- Chronological, newest first
- Grouped by month (sticky headers)
- Each card shows: title, date/time, emotion badge, lucidity indicator, snippet (2 lines)
- Pull-to-refresh gesture
- Infinite scroll (load 20 at a time)

**Search**
- Full-text search across all dream text
- Filter by: emotion, lucidity, nightmare, date range, tags
- Results highlighted with matching context

### 4.4 Insights & Patterns

**Recurring Symbols**
- Top 10 most frequent symbols from user's dream history
- Each shows: symbol name, frequency count, trend (up/down/stable)
- Tap to see all dreams containing this symbol

**Emotion Trends**
- Line chart: emotion distribution over past 30 days
- Bar chart: emotion breakdown by lucidity status

**Dream Statistics**
- Total dreams logged
- Average dreams per week
- Lucid dream percentage
- Nightmare percentage
- Most active dream day (time of day)
- Most common emotion
- Streak (consecutive days with dream entries)

**Sleep Correlation (Future)**
- Manual sleep quality input: 1-5 stars each morning
- Correlation between sleep quality and dream vividness/recall

### 4.5 Lucid Dreaming Tools

**Reality Check Reminders**
- Configurable notification schedule (every 2/4/6 hours while awake)
- Notification text rotates: "Are you dreaming right now?", "Reality check time!", etc.
- When tapped → opens app to dream entry with "Lucid dream tip of the day"

**Wake Back To Bed (WBTB) Guide**
- Step-by-step guide for inducing lucid dreams via WBTB method
- Timer feature: set alarm X hours after sleep, app wakes you with gentle sound, you stay in bed
- Tips integrated: keep still, visualize, focus on awareness

**Lucid Tips Library**
- Curated list of lucid dream induction techniques
- Personal tracking: which techniques tried, which worked

### 4.6 Dream Wall (Future/Placeholder)

- Community-shared dreams (anonymized)
- Upvote and comment (no real names)
- Tags-based filtering
- "Similar dreams to yours" based on AI analysis

### 4.7 Sleep Tracking (Future/Placeholder)

- Manual bedtime/wake time logging
- Optional: HealthKit / Google Fit integration (future)
- Sleep quality rating (1-5)
- Dream recall quality rating (1-5)
- Correlation analysis: sleep quality vs dream patterns

### 4.8 Profile & Settings

**Account**
- Email/password or OAuth (Google/Apple)
- Premium status
- Interpretation credits (free tier: 3/month)

**Settings**
| Setting | Options |
|---------|---------|
| Notifications | Enable/disable, schedule quiet hours |
| AI Model | GPT-4o, GPT-4o-mini, Claude (future) |
| Mock AI Mode | On/Off (for testing without API costs) |
| Default emotions | Customize which 8 emotions shown |
| Language | English (expandable) |
| Data export | Export all dreams as JSON/CSV |
| Dark/Light mode | Dark (default), Light (future) |
| Dream Wall | Enable/disable sharing |
| Account deletion | Full GDPR-compliant deletion |

---

## 5. Component Inventory

### DreamCard
- **Default:** Surface card, title, date, emotion badge, snippet, lucidity dot
- **Hover/Press:** Subtle scale(0.98) + border glow
- **Lucid:** Cyan left border accent
- **Nightmare:** Rose left border accent
- **Loading:** Skeleton placeholder

### EmotionBadge
- Small rounded pill with emotion icon + label
- Color-coded per emotion (Joy=amber, Sadness=blue, Fear=rose, etc.)
- Size variants: sm (12px text), md (14px text)

### TagChip
- Small rounded pill, border style
- Shows tag text + X to remove (in edit mode)
- Tappable in filter mode

### VoiceRecorder
- States: idle (mic button), recording (waveform + stop button), processing (spinner)
- Waveform: 20 animated bars, heights vary by audio level
- Recording duration counter
- Cancel button (X) to discard

### InterpretationCard
- Expandable card sections
- Summary section is always visible
- "See more" to expand symbols, emotions, advice
- Regenerate button (with cost/warning)

### StatCard
- Icon + label + value + trend indicator
- Used in Insights grid

### CalendarDay
- States: empty, has-dreams (colored dot), today (amber ring), selected (filled)
- Dream count indicator (up to 3 dots, then "+N")

### SleepQualityInput
- 5-star or 5-moon rating input
- Animated on selection

### BottomSheet
- Used for: day detail preview, filters, quick actions
- Drag to dismiss
- Snap points: collapsed (peek), half, full

---

## 6. Technical Approach

### Framework & Tooling

| Concern | Choice |
|---------|--------|
| Framework | React Native + Expo SDK 52+ |
| Language | TypeScript |
| Navigation | Expo Router (file-based routing) |
| State Management | Zustand (lightweight, TypeScript-native) |
| Local Storage | AsyncStorage + expo-file-system for audio |
| Audio | expo-av (recording + playback) |
| Notifications | expo-notifications |
| AI | OpenAI SDK (real) / mock service (placeholder) |
| Animations | React Native Reanimated 3 |
| Gestures | react-native-gesture-handler |
| Icons | lucide-react-native |
| Charts | react-native-gifted-chat (for simple) or visx (future) |

### Data Model

```typescript
// Dream
interface Dream {
  id: string;                    // UUID
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
  title: string;
  content: string;                // transcribed or typed text
  audioUri?: string;              // local file path if voice recorded
  audioDuration?: number;         // seconds
  emotions: Emotion[];            // 1-3 emotions
  tags: string[];
  isLucid: boolean;
  isNightmare: boolean;
  interpretation?: Interpretation;
  editHistory: DreamEdit[];       // previous versions
}

interface Interpretation {
  generatedAt: string;
  model: string;                 // "gpt-4o", "mock", etc.
  summary: string;
  themes: string[];
  symbols: DreamSymbol[];
  emotionalAnalysis: string;
  lucidityAnalysis: string;
  advice: string;
}

interface DreamSymbol {
  name: string;
  meaning: string;
  personalContext: string;        // from user's history
  occurrences: number;            // total across all dreams
}

interface DreamEdit {
  editedAt: string;
  content: string;
}

type Emotion = 'joy' | 'sadness' | 'fear' | 'anger' | 'surprise' | 'confusion' | 'calm' | 'anxiety';

// Sleep Entry
interface SleepEntry {
  id: string;
  date: string;                  // YYYY-MM-DD
  bedtime?: string;               // ISO 8601
  wakeTime: string;               // ISO 8601
  quality: number;               // 1-5
  dreamRecall: number;            // 1-5
  notes?: string;
}

// User Preferences
interface UserPreferences {
  notificationsEnabled: boolean;
  quietHoursStart: string;       // "22:00"
  quietHoursEnd: string;         // "07:00"
  lucidRemindersInterval: number; // hours (0=disabled)
  defaultEmotions: Emotion[];
  language: string;
  useMockAI: boolean;
  aiModel: 'gpt-4o' | 'gpt-4o-mini' | 'claude';
  dreamWallEnabled: boolean;
}

// Profile
interface Profile {
  id: string;
  email: string;
  createdAt: string;
  premium: boolean;
  interpretationCredits: number;  // free tier: 3
  preferences: UserPreferences;
  lifetimeStats: LifetimeStats;
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

### API Design (Backend — Future)

```
POST /auth/signup
POST /auth/login
GET  /dreams                    → paginated list
POST /dreams                    → create dream
GET  /dreams/:id
PUT  /dreams/:id
DELETE /dreams/:id
POST /dreams/:id/interpret      → triggers AI interpretation
GET  /insights                  → aggregated patterns
POST /sleep                     → log sleep entry
GET  /sleep                     → sleep history
GET  /profile
PUT  /profile/preferences
POST /dream-wall                → share dream (anonymized)
GET  /dream-wall                → public dreams
```

### File Structure

```
DreamBound/
├── app/                        # Expo Router screens
│   ├── _layout.tsx              # Root layout with providers
│   ├── (tabs)/                 # Tab navigator
│   │   ├── _layout.tsx         # Tab bar config
│   │   ├── tonight.tsx         # Home screen
│   │   ├── journal.tsx         # Journal screen
│   │   ├── insights.tsx        # Insights screen
│   │   └── profile.tsx         # Profile screen
│   ├── (modals)/               # Modal routes
│   │   ├── _layout.tsx         # Modal layout
│   │   ├── new-dream.tsx       # Dream entry modal
│   │   ├── dream/[id].tsx      # Dream detail modal
│   │   ├── interpretation.tsx  # Full interpretation view
│   │   └── settings.tsx         # Settings sheet
│   └── index.tsx               # Redirect to /tonight
├── src/
│   ├── types/                  # TypeScript interfaces
│   │   └── index.ts
│   ├── constants/              # Theme, config
│   │   ├── theme.ts
│   │   └── config.ts
│   ├── services/               # Business logic
│   │   ├── storage.ts          # AsyncStorage wrapper
│   │   ├── ai.ts               # AI interpretation service
│   │   ├── audio.ts            # Voice recording/playback
│   │   └── dreamEngine.ts      # Core dream CRUD + analysis
│   ├── store/                  # Zustand stores
│   │   ├── dreamStore.ts
│   │   └── userStore.ts
│   ├── components/
│   │   ├── ui/                 # Generic UI components
│   │   ├── dream/              # Dream-specific components
│   │   ├── entry/              # Dream entry components
│   │   └── insights/          # Charts and stats
│   └── utils/                  # Helpers
│       └── helpers.ts
├── assets/                     # Images, fonts
├── DESIGN.md                    # This document
└── SPEC.md                     # Product specification
```

### Dream Engine Service

The `dreamEngine.ts` service is the core business logic layer:

```typescript
// Core operations
createDream(data: CreateDreamInput): Promise<Dream>
getDream(id: string): Promise<Dream | null>
updateDream(id: string, data: UpdateDreamInput): Promise<Dream>
deleteDream(id: string): Promise<void>
getAllDreams(): Promise<Dream[]>
getDreamsByDateRange(start: string, end: string): Promise<Dream[]>

// Analysis
extractSymbols(dreams: Dream[]): SymbolFrequency[]
getEmotionTrends(dreams: Dream[]): EmotionTrend[]
getStatistics(dreams: Dream[], sleepEntries?: SleepEntry[]): DreamStatistics

// AI Integration
interpretDream(dream: Dream, useMock: boolean): Promise<Interpretation>

// Persistence
syncToCloud(): Promise<void>  // future
exportData(): Promise<string> // JSON export
```

---

## 7. Monetization

### Free Tier
- 3 AI interpretations per month
- Unlimited dream entries (text + voice)
- Basic journal (calendar + list)
- Basic insights (top 5 symbols, simple stats)
- 1 saved loadout / preset

### Premium ($4.99/month or $39.99/year)
- Unlimited AI interpretations
- Full insights with all symbols + trends
- Advanced sleep tracking
- All lucid dreaming tools
- Priority support
- Early access to new features

---

## 8. Future Roadmap

### Phase 1 (MVP — Current Build)
- Voice + text dream entry
- Basic journal (calendar + list)
- Mock AI interpretation
- Basic insights
- Emotion + tag tracking
- Local storage only

### Phase 2 (Cloud + Real AI)
- User accounts (email + OAuth)
- Real OpenAI interpretation
- Cloud sync across devices
- Interpretation credits system

### Phase 3 (Community + Social)
- Dream Wall (anonymous sharing)
- Comment and react to shared dreams
- "Dreams like yours" matching

### Phase 4 (Deep Personalization)
- Symbol memory (learns YOUR recurring symbols)
- Sleep quality integration (HealthKit/Google Fit)
- Personal dream dictionary
- Dream forecasting (predict dream themes based on life events)

### Phase 5 (Advanced Tools)
- WBTB timer with gentle wake sounds
- Lucid dream induction audio (binaural beats option)
- Reality check notifications
- Dream incubation planning

---

## 9. Competitive Positioning

| Feature | Dreamly | Dream Journal Ultimate | Dream Catcher | DreamBound (us) |
|---------|---------|----------------------|---------------|----------------|
| Voice entry | ❌ | ✅ | ❌ | ✅ (primary) |
| AI interpretation | ✅ | ✅ | ❌ | ✅ + personalized |
| Free tier generous | ❌ (1 dream) | ✅ | ✅ | ✅ (3/month) |
| Symbol memory | ❌ | ❌ | ❌ | ✅ (Phase 4) |
| Sleep correlation | ❌ | ❌ | ❌ | ✅ (Phase 4) |
| Lucid tools | ❌ | Basic | ✅ | ✅ (Phase 5) |
| Pattern insights | ❌ | Basic | ✅ | ✅ |
| Cross-platform | ❌ | ❌ | ❌ | ✅ (RN) |
| Community | ❌ (barely used) | Dream Wall | ❌ | ✅ (Phase 3) |

The **voice-first entry** is the primary differentiator. Nobody in this space has made voice recording the primary interaction — they all treat it as a nice-to-have. For a dream app, voice is essential because you're half-asleep when you use it.

---

## 10. Open Questions

1. **Transcription provider:** Use OpenAI Whisper API (accurate, cheap) or a free alternative?
2. **Cloud backend:** Supabase vs Firebase vs custom Node.js? Supabase is developer-friendly and has good RN support.
3. **Dream Wall moderation:** How to prevent abuse without real moderation overhead?
4. **AI prompt tuning:** Need user testing to calibrate interpretation depth vs token cost.
5. **iOS App Store compliance:** Voice recording + cloud sync may require specific permissions and privacy policies.

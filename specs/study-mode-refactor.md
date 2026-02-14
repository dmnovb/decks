# Study Mode Complete Overhaul - Implementation Spec

## Context

The current flashcard study system has critical UX problems that make it frustrating to use:
- **No structure**: Users just iterate through cards with no clear beginning/end, no session goals
- **Clunky flow**: Slow, boring UI with no feedback or motivation during study
- **Missing progress indicators**: Basic progress bar only, no live statistics or achievements
- **No keyboard support**: Desktop users forced to click buttons (inefficient for power users)
- **Poor data visibility**: No comprehensive statistics, heatmaps, or insights after studying

The user wants a **professional, efficient, data-rich experience** like Anki, but with modern UX that doesn't feel dated. Target feel: "Anki's algorithmic rigor + Linear's clean design + instant feedback."

## Research Findings

Modern spaced repetition apps ([Mochi](https://mochi.cards/), [FSRS resources](https://github.com/open-spaced-repetition/fsrs-vs-sm17)) prioritize:
- **Speed**: <100ms load times retain 3x more users ([2026 UI best practices](https://saigontechnology.com/blog/app-design/))
- **Keyboard-first UX**: Essential for serious learners
- **Microinteractions**: Build trust and reduce hesitation ([Apiko UX trends](https://apiko.com/blog/ux-design-trends/))
- **Simplicity**: Remove anything that doesn't help the user
- **Data visualization**: Charts, heatmaps, retention curves ([Brainscape algorithm comparison](https://www.brainscape.com/academy/comparing-spaced-repetition-algorithms/))

Language learning apps like [Duolingo](https://userguiding.com/blog/duolingo-onboarding-ux) succeed through gamification, but the user wants **professional, not childish** - focus on data and efficiency instead.

## Implementation Approach

### Architecture: Session-Based Study System

Transform from "iterate through all cards" to **structured study sessions** with:
1. **Session Setup**: Configure card limits, filters (due only, new cards limit), shuffle
2. **Study Interface**: Clean, keyboard-first card display with live progress stats
3. **Session Summary**: Comprehensive post-session statistics with actionable insights
4. **Statistics Dashboard**: Dedicated page with heatmaps, retention curves, problem cards

### Key Design Decisions

**State Management**:
- Local state (useReducer) for session-specific data (current card, timer, streaks)
- Existing `useUpdateFlashcard` hook for persistence (already handles statistics)
- SWR for data fetching (cards, statistics)
- DecksProvider for global deck state updates

**Animations**:
- Motion (Framer) for card flips and complex transitions
- CSS transitions for simple hover states
- Target: 60fps, <16.6ms per frame

**Performance**:
- Optimistic updates for perceived <50ms latency
- Code splitting for statistics dashboard (lazy load)
- Memoization to prevent unnecessary re-renders
- Debounced live stats updates (500ms)

**Keyboard Shortcuts**:
- `Space`: Flip card
- `1-4`: Rate difficulty (Again, Hard, Good, Easy)
- `Esc`: Exit session (with confirmation)
- `?`: Toggle help modal

**Mobile**:
- Native touch events (no heavy libraries)
- Swipe up: Flip card
- Swipe right: Good
- Swipe left: Again

## Database Schema Changes

Add two new models to track session history and enable comprehensive statistics:

```prisma
model StudySession {
  id             String   @id @default(uuid())
  userId         String
  deckId         String
  startedAt      DateTime @default(now())
  completedAt    DateTime?
  totalCards     Int
  newCards       Int      @default(0)
  reviewCards    Int      @default(0)
  correctCount   Int      @default(0)
  wrongCount     Int      @default(0)
  averageTime    Float    @default(0)
  totalTime      Int      @default(0)

  deck           Deck     @relation(fields: [deckId], references: [id])
  user           User     @relation(fields: [userId], references: [id])
  cardReviews    CardReview[]
}

model CardReview {
  id             String   @id @default(uuid())
  sessionId      String
  flashcardId    String
  quality        Int
  timeSpent      Int
  reviewedAt     DateTime @default(now())

  session        StudySession @relation(fields: [sessionId], references: [id])
  flashcard      Flashcard @relation(fields: [flashcardId], references: [id])
}
```

Update existing models:
- Add `studySessions StudySession[]` to `User`
- Add `studySessions StudySession[]` to `Deck`
- Add `cardReviews CardReview[]` to `Flashcard`

## Critical Files

### New Files to Create

**Core Session Components**:
- `/src/components/Flashcards/study-session/session-setup.tsx` - Pre-study configuration dialog
- `/src/components/Flashcards/study-session/session-card.tsx` - Clean card display with keyboard shortcuts
- `/src/components/Flashcards/study-session/session-progress.tsx` - Live stats overlay (accuracy, streak, time)
- `/src/components/Flashcards/study-session/session-summary.tsx` - Post-session comprehensive statistics
- `/src/components/Flashcards/study-session/keyboard-shortcuts-help.tsx` - Help modal (triggered by `?`)

**Statistics Components**:
- `/src/components/Statistics/statistics-dashboard.tsx` - Main statistics page
- `/src/components/Statistics/review-heatmap.tsx` - GitHub-style calendar (90 days)
- `/src/components/Statistics/retention-chart.tsx` - Retention curve visualization
- `/src/components/Statistics/problem-cards-list.tsx` - Struggling cards detection

**Hooks**:
- `/src/hooks/use-study-session.ts` - Session state management (config, cards, streaks, timing)
- `/src/hooks/use-keyboard-shortcuts.ts` - Global keyboard event handling
- `/src/hooks/use-session-timer.ts` - Per-card and total session timing

**API Routes**:
- `/src/app/api/sessions/route.ts` - POST (create session), GET (fetch history)
- `/src/app/api/statistics/route.ts` - GET (aggregate statistics for deck/user)
- `/src/app/api/card-reviews/route.ts` - POST (log individual card review)

**Utilities**:
- `/src/utils/card-filters.ts` - Filter/sort cards (due only, new cards limit, shuffle)
- `/src/utils/session-analytics.ts` - Calculate accuracy, detect problem cards, retention curves

**UI Components**:
- `/src/components/ui/segmented-progress.tsx` - Progress bar with correct/wrong/remaining segments

### Files to Modify

**`/src/components/Flashcards/flashcards-view.tsx`**:
- Rename to `flashcards-view-legacy.tsx` (keep as backup)
- Create new `flashcards-view.tsx` that orchestrates: setup → study → summary flow

**`/src/app/decks/[id]/page.tsx`**:
- Add "Statistics" tab next to "Study Mode" and "Normal"
- Conditional rendering for statistics dashboard

**`/prisma/schema.prisma`**:
- Add `StudySession` and `CardReview` models
- Add relations to `User`, `Deck`, `Flashcard`

## Existing Code to Reuse

**DO NOT reimplement these - they work correctly:**

1. **`/src/hooks/use-update-flashcard.ts`** - Already handles:
   - Statistics calculation (streak, totalReviews, correctReviews)
   - API persistence (PATCH /api/flashcards)
   - DecksProvider dispatch (UPDATE_FLASHCARD action)
   - Toast notifications (success, error with retry, streak milestones)
   - Use this hook as-is from `use-study-session.ts`

2. **`/src/utils/sm2.ts`** - SM2 algorithm implementation:
   - Calculates interval, repetitions, easeFactor based on quality
   - Already correct and battle-tested
   - Call before `useUpdateFlashcard` to get updated values

3. **`/src/app/api/flashcards/route.ts` (PATCH endpoint)** - Persists all SR fields:
   - Accepts: difficulty, interval, repetitions, easeFactor, lastReviewed, nextReview, streak, totalReviews, correctReviews
   - No changes needed - extend with query params for filtering in GET

4. **`/src/providers/decks-provider.tsx`** - State management:
   - UPDATE_FLASHCARD action updates card in deck
   - Reuse existing dispatch pattern

5. **UI Components** - All shadcn/Radix components available:
   - Button, Card, Dialog, Sheet, Progress, Tabs, Tooltip
   - Sonner for toasts
   - Motion for animations

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Session infrastructure & basic study flow

1. Create Prisma migrations for `StudySession`, `CardReview` models
2. Implement `/src/hooks/use-study-session.ts` (basic version)
3. Implement `/src/utils/card-filters.ts`
4. Create session setup dialog component
5. Create session card display component
6. Wire up session setup → study flow

**Validation**: User can configure session, cards load with filters, basic study loop works

### Phase 2: Keyboard & Progress (Week 2)
**Goal**: Professional keyboard-first UX & live feedback

1. Implement keyboard shortcuts hook
2. Add shortcuts to session card (Space, 1-4, Esc, ?)
3. Create keyboard help modal
4. Implement session timer hook
5. Create segmented progress bar component
6. Create session progress overlay (live stats)
7. Add card flip animation with Motion

**Validation**: All keyboard shortcuts work, help modal shows, live progress updates smoothly, 60fps animations

### Phase 3: Session Summary & Persistence (Week 2)
**Goal**: Comprehensive post-session experience

1. Implement `/src/app/api/sessions/route.ts` (POST)
2. Implement `/src/app/api/card-reviews/route.ts` (POST)
3. Create session summary component
4. Add session save logic to hook
5. Implement milestone toasts (every 5 cards, streak achievements)
6. Add optimistic updates for instant feel

**Validation**: Session saves to database, summary shows accurate stats, optimistic updates feel instant

### Phase 4: Statistics Dashboard (Week 3)
**Goal**: Data-rich analytics & insights

1. Implement `/src/app/api/statistics/route.ts` (GET)
2. Create statistics dashboard component
3. Create review heatmap component (GitHub-style)
4. Create retention curve chart
5. Create problem cards list (leech detection)
6. Implement session analytics utilities
7. Add "Statistics" mode to deck page

**Validation**: Statistics page loads <500ms, charts render correctly, problem card detection accurate

### Phase 5: Polish & Optimization (Week 4)
**Goal**: Performance, accessibility, mobile UX

1. Add touch gestures to session card (swipe to flip/rate)
2. Optimize animations for mobile (reduce on low-end devices)
3. Add accessibility: ARIA labels, keyboard focus, screen reader support
4. Add skeleton loaders for statistics charts
5. Add error boundaries around session components
6. Performance audit: Lighthouse >90, no layout shift
7. Add localStorage backup (recover from crashes)
8. User testing & feedback iteration

**Validation**: Lighthouse Performance >90, Accessibility 100, touch gestures work on iOS/Android, screen reader support

## Verification Strategy

### Feature Testing

**Session Setup**:
- [ ] Card count limits apply correctly (10, 20, 50, All)
- [ ] New cards limit respected
- [ ] Due-only filter shows only overdue cards
- [ ] Shuffle randomizes order
- [ ] Session preview counts accurate

**Study Flow**:
- [ ] Card flip works on Space key and click
- [ ] Keyboard shortcuts (1-4) rate correctly
- [ ] Esc exits session with confirmation
- [ ] ? toggles help modal
- [ ] SM2 algorithm applied correctly
- [ ] Statistics calculated accurately (streak, accuracy)

**Session Summary**:
- [ ] Total time matches elapsed session time
- [ ] Accuracy percentage correct
- [ ] Problem cards list shows wrong cards
- [ ] Session saves to database correctly

**Statistics Dashboard**:
- [ ] Heatmap reflects actual review history (90 days)
- [ ] Retention curve shows meaningful trends
- [ ] Problem cards detection accurate (>10 reviews, <50% accuracy)
- [ ] All charts load within 500ms

### Performance Benchmarks

**Target Metrics**:
- Initial session load: <200ms (from setup to first card)
- Card flip animation: 60fps (16.6ms per frame)
- API response (rate card): <100ms (P95)
- Statistics page load: <500ms (including charts)
- Bundle size increase: <50KB (gzip)

**Monitoring**:
```typescript
performance.mark('session-start');
// ... session initialization
performance.mark('session-ready');
performance.measure('session-init', 'session-start', 'session-ready');
console.log(`Session init: ${performance.getEntriesByName('session-init')[0].duration}ms`);
```

### Accessibility

- [ ] Keyboard-only navigation works fully
- [ ] Screen reader announces card content
- [ ] Focus visible on all interactive elements
- [ ] ARIA labels on progress bars, buttons
- [ ] Color contrast meets WCAG AA (4.5:1)

### Mobile

- [ ] Touch gestures work on iOS Safari
- [ ] Touch gestures work on Android Chrome
- [ ] Cards display correctly on 320px width
- [ ] Animations smooth on mid-range devices (60fps)
- [ ] No horizontal scroll

### User Acceptance Testing

**Test Scenarios**:
1. First-time user: Can they understand session setup without guidance?
2. Keyboard user: Can they complete session without touching mouse?
3. Mobile user: Can they study comfortably on phone?
4. Data-driven user: Do statistics provide actionable insights?
5. High-volume user: Can they study 100+ cards without performance issues?

**Success Criteria**:
- 90% of users complete first session without confusion
- <5% error rate on keyboard shortcuts (after first use)
- Mobile session completion rate >80%
- No crashes or data loss after 100-card sessions

## Edge Cases & Error Handling

**Empty Deck**:
- Show helpful empty state with "Create flashcards" CTA
- Disable study mode button

**All Cards Due in Future**:
- Session setup shows: "0 cards due today"
- Offer option: "Study ahead?" (disable due filter)

**Session Interrupted**:
- Detect page refresh/close during session
- Show resume dialog on return: "Continue where you left off?"
- Restore session state from localStorage

**API Failure**:
- Optimistic update shown immediately
- Queue failed request for retry
- Show toast: "Offline - will sync when connected"
- Persist failed requests

**Slow Network**:
- Show skeleton loaders for statistics charts
- Disable rate buttons during API call (prevent double submission)
- Timeout after 10s, show retry button

**Error Boundaries**:
- Wrap session components in error boundary
- Save session state on crash for recovery
- Show friendly error message with "Resume" button

## Why This Design Wins

**Beats Anki**:
- **Speed**: Optimistic updates, <100ms perceived latency vs Anki's 200-500ms
- **UX**: Modern, minimal UI vs Anki's cluttered 2010s design
- **Motivation**: Live streaks, milestone toasts, rich statistics vs Anki's basic counters
- **Accessibility**: Keyboard-first, WCAG AA compliant vs Anki's poor screen reader support
- **Mobile**: Touch-optimized gestures vs Anki's clunky mobile port

**Maintains Anki's Strengths**:
- **Algorithm**: SM2 implementation identical to Anki
- **Flexibility**: Session config (limits, filters) matches Anki's power-user features
- **Data**: Self-hosted PostgreSQL, full data ownership

**Professional, Not Gamified**:
- No cartoons, mascots, or childish celebrations
- Data-first: Charts, metrics, actionable insights
- Efficient: Keyboard shortcuts, batch operations
- Serious learner focus

## Sources

- [Mochi - Modern Spaced Repetition](https://mochi.cards/)
- [2026 UI/UX Best Practices](https://saigontechnology.com/blog/app-design/)
- [Spaced Repetition Algorithm Comparison](https://www.brainscape.com/academy/comparing-spaced-repetition-algorithms/)
- [FSRS vs SM17 Benchmark](https://github.com/open-spaced-repetition/fsrs-vs-sm17)
- [Duolingo UX Case Study](https://userguiding.com/blog/duolingo-onboarding-ux)
- [2026 UI Design Trends](https://apiko.com/blog/ux-design-trends/)

# Feature Design: PWA + Mobile Study Experience

## Problem
Alcove is desktop-first with no PWA setup. On mobile it works but feels like a website: no home screen install, keyboard-centric study UI (Space to flip, 4 click-buttons to rate). The goal is a native-feeling study experience on phone — installable via the browser's "Add to Home Screen" flow, touch-first, with swipe gestures and haptics during study sessions. Desktop experience stays entirely unchanged.

## What's out of scope
- Offline support (always-connected assumption)
- App Store distribution (web PWA install only)
- Push notifications / study reminders
- Any changes to desktop UI (keyboard + 4-button layout stays)
- CRUD UI changes (create/edit/delete decks/cards/folders work as-is)
- New SM2 logic (already implemented, quality values unchanged)
- Schema or API changes

## Design decisions

**1. PWA manifest only, no caching service worker**
Standalone display mode, name "Alcove". No offline caching needed. A minimal no-op service worker is still required — Chrome on Android won't show the install prompt without one.

**2. Touch capability detection, not breakpoint detection**
The swipe UI activates on `'ontouchstart' in window`, not screen width. A narrow desktop browser window shouldn't trigger swipe mode; a tablet with touch should.

**3. Study session touch flow**
```
front → tap card → flip to reveal answer → swipe left or right → 2 rating buttons appear → tap to confirm
```
Tap replaces the current "Show Answer" button on touch devices. Swipe replaces the 4-button rating grid.

**4. Swipe direction → SM2 quality mapping**
Same quality values as the existing 4 buttons, split by direction:
- Swipe left  → **Blackout** (quality 0) / **Bad** (quality 2)
- Swipe right → **Okay** (quality 4) / **Good** (quality 5)

**5. Haptic feedback via Vibration API**
Fires on: (a) swipe threshold crossed, (b) rating button tap.
iOS doesn't support `navigator.vibrate()` — guard with `if ('vibrate' in navigator)`. Haptics are an enhancement, not core UX; silent skip on iOS is acceptable.

## Data model / API / Key interfaces

No schema or API changes.

### Files to create
| File | Purpose |
|---|---|
| `public/manifest.json` | PWA manifest |
| `public/icons/icon-192.png` | Home screen icon |
| `public/icons/icon-512.png` | Splash/maskable icon |
| `public/sw.js` | Minimal no-op service worker |

### Files to modify
| File | Change |
|---|---|
| `src/app/layout.tsx` | Add `<link rel="manifest">`, `<meta name="theme-color">`, Apple PWA meta tags, SW registration script |
| `src/components/Flashcards/study-session/session-card.tsx` | Conditional swipe UI on touch devices using existing `motion/react` drag |

### manifest.json
```json
{
  "name": "Alcove",
  "short_name": "Alcove",
  "display": "standalone",
  "start_url": "/",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### session-card.tsx touch layer (pseudo-structure)
```
State:
  swipeDirection: 'left' | 'right' | null   // set when threshold (~80px) crossed
  isDragging: boolean

On drag (motion/react drag prop + onDrag callback):
  - Track offsetX
  - At threshold: set swipeDirection, fire navigator.vibrate(10)
  - Visual: card tilts/translates, color overlay hints direction (red=left, green=right)
  - Below threshold on release: snap back, reset state

After swipe confirmed (released past threshold):
  - Show 2 buttons based on direction
  - Left:  Blackout (0) / Bad (2)
  - Right: Okay (4)    / Good (5)

On button tap:
  - navigator.vibrate(10)
  - onRate(quality)
  - Reset swipe state
```

Desktop path: unchanged. 4 buttons (Again/Hard/Good/Easy) render as before when no touch detected.

## Edge cases & constraints

| Case | Handling |
|---|---|
| iOS haptics | `navigator.vibrate()` unsupported — feature-detected, silently skipped |
| Accidental swipe | 80px threshold + snap-back below threshold prevents false positives |
| Swipe vs page scroll | `touch-action: pan-y` on all elements except card; `touch-action: none` on draggable card |
| Chrome install prompt | Requires registered service worker — `public/sw.js` exists even if it does nothing |
| iOS PWA meta tags | iOS ignores manifest for some properties — need `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon` in `<head>` |

## Open questions

- **Icons**: No icon assets in `/public` yet. Need 192×512px PNGs matching the app visual identity. Placeholder solid-color PNGs work for local testing but not production.
- **Swipe threshold**: 80px is an initial estimate. May need adjustment after testing on a real device.

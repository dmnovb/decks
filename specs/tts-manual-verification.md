# ElevenLabs TTS manual verification

## Pricing rationale

TTS playback is charged at 1 credit for text up to 200 characters and 2 credits for 201-500 characters. This keeps short front/back flashcard playback priced like a lightweight AI action while adding a small multiplier for longer answers that consume more ElevenLabs characters. The API caps input at 500 characters for v1 cost control.

## Setup

1. Set `ELEVENLABS_API_KEY` in the server environment.
2. Start the app and sign in as a user with credits.
3. Open a deck with at least one flashcard and start a study session.

## Cases

1. Happy path playback
   - Click the speaker button on the question side.
   - Flip the card and click the question and answer speaker buttons.
   - Confirm audio plays, the button shows a loading spinner while the request/audio is active, and the voice menu selection persists after refresh.

2. Out of credits
   - Use a test account with 0 credits.
   - Click a speaker button.
   - Confirm the API returns `402` and the UI shows an "Out of credits" toast with a Pricing action.

3. ElevenLabs 5xx/refund
   - Temporarily set `ELEVENLABS_API_KEY` to an invalid value or force the upstream fetch to fail.
   - Click a speaker button.
   - Confirm the API returns a non-2xx error and the spent `tts_playback` credits are refunded with `tts_playback_failed`.

4. Rate limit
   - Send 31+ `POST /api/tts` requests from the same IP inside one minute.
   - Confirm requests after the 30/min ceiling return `429` with a `Retry-After` header.

5. Unauthenticated rejection
   - Clear the `auth-token` cookie.
   - Send `POST /api/tts` with a valid body.
   - Confirm the API returns `401` without calling ElevenLabs or spending credits.

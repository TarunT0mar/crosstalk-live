# CrossTalk Live

CrossTalk is a browser-first prototype for conversations between two people who do not share a language. Unlike turn-based translators, its interaction model treats interruptions, overlapping speech, partial sentences and changing opinions as normal parts of a conversation.

**Live demo:** https://crosstalk-live.mellowlion12.chatgpt.site

## What the prototype demonstrates

- Hindi and English speech recognition
- Live interim and final transcripts
- Translated captions and spoken playback
- Barge-in: new speech cancels stale translated audio
- Visual overlap and interruption indicators
- Separate tracks for the original and translated statements
- Conversation memory
- Typed input when browser speech services are unavailable
- Responsive layouts for desktop and mobile

## How it works

```text
Microphone or typed message
          ↓
Browser SpeechRecognition
          ↓
Original transcript
          ↓
Browser Translator API
or bounded demo dictionary
          ↓
Translated caption
          ↓
Browser SpeechSynthesis
          ↓
Translated audio
```

The application calls `speechSynthesis.cancel()` when the other participant starts speaking. This prevents outdated translated audio from talking over a new interruption.

## Run locally

No build process or dependencies are required.

```bash
git clone https://github.com/TarunT0mar/crosstalk-live.git
cd crosstalk-live
python3 -m http.server 4177 --directory dist
```

Then open http://localhost:4177 in Chrome.

Opening `dist/index.html` directly is not recommended because microphone and browser language APIs generally require a secure origin or localhost.

## Browser support

Chrome is recommended. Speech recognition is supplied by the browser and may use a remote browser service. Embedded browsers can return a `network` error even when microphone permission has been granted. Typed input exercises the same translation, interruption and transcript pipeline without microphone access.

The experimental browser Translator API is used where available. A small deterministic Hindi-English phrase dictionary keeps the hosted prototype testable when that API is missing. It is not a general-purpose translation engine.

## Project structure

```text
dist/
  index.html    Interface and accessible page structure
  styles.css    Responsive visual system
  app.js        Speech, translation, synthesis and interruption logic
.openai/
  hosting.json  ChatGPT Sites deployment configuration
```

## Production roadmap

A production version would replace the browser-only pipeline with:

- WebRTC rooms for participants on separate devices
- Server-side streaming speech recognition and translation
- Streaming text-to-speech with cancellable audio segments
- WebSocket events for partial transcripts and barge-in
- Authentication and expiring room invitations
- Recording consent and retention controls
- Quality, latency and translation-confidence telemetry

## Current limitations

- The hosted demo is a same-screen product prototype, not a multi-device room.
- Arbitrary translation depends on experimental browser support.
- Browser speech services behave differently across devices.
- Emotion is preserved only through timing, overlap and available system voices.
- No conversation audio is intentionally stored by this static application.

## Privacy

The static application contains no application database. Browser speech recognition may process audio using the browser vendor's speech service. Users should not treat this prototype as a private or regulated communication channel.

## License

This repository is provided as a demonstration project. Add an explicit license before reusing it commercially.

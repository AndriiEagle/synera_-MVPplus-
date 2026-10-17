# Synera Android UI recording QA

- Source: local `web_launch/server.mjs --demo` only.
- Viewport: 390 x 844, Android portrait proportion.
- Clips: real Chromium input against Studio: current UI, then optional Atelier 2026 with plum accent.
- Observed interactions: consent checkboxes, fit submission, Studio section transition; Atelier menu, style selection, accent selection, fit submission.
- Network: zero external requests while recording.
- Playback: both H.264 MP4 files fully decoded by ffmpeg without decode errors.
- Representative frames: inspected at 00:00:02 from both recordings.
- Scope: local demo data only. The clips do not show a live Google map, voice assistant, external AI, video call, live user matching, or physical Android device.

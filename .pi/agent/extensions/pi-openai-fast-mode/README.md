# Fast Mode

Local Pi extension for OpenAI priority inference.

- `defaults.json` is read-only configuration; Fast Mode defaults to disabled (normal service).
- Only exact provider/model pairs in `defaults.json` receive priority requests or show the Fast status. Unlisted models are unaffected by `/fast`.
- `gpt-6-astra` is allowlisted for `openai` and `openai-codex`. `/fast on` requests `service_tier: "priority"`; the Fast status indicates a request, not verified provider acceptance or a guaranteed speedup.
- Defaults load on session startup or `/reload`; use `/fast off` to disable Fast Mode in an already-running session.
- `/fast [on|off|toggle]` changes only the current session.
- `--fast` enables only the current session.
- Session shutdown never writes defaults or runtime state.
- The extension publishes `pi-openai-fast-mode=fast` through Pi status state for the Vim statusline.

`config.json` is ignored because older package versions may recreate it while a pre-migration Pi session shuts down. The local extension does not read it.

# Fast Mode

Local Pi extension for OpenAI priority inference.

- `defaults.json` is read-only configuration; Fast Mode defaults to disabled.
- `/fast [on|off|toggle]` changes only the current session.
- `--fast` enables only the current session.
- Session shutdown never writes defaults or runtime state.
- The extension publishes `pi-openai-fast-mode=fast` through Pi status state for the Vim statusline.

`config.json` is ignored because older package versions may recreate it while a pre-migration Pi session shuts down. The local extension does not read it.

# AI Workspace

This folder is your local AI workspace. It carries shared guardrails, scripts, skills, and slash-command docs adapted from `agent-scripts`, with local pathing under `~/.ai`.

## Quick Setup
Run this on a new machine (or after pulling updates):

```bash
brew bundle --file ~/.Brewfile
npm install -g tsx ts-node commander puppeteer-core
brew install steipete/tap/summarize || bun add -g @steipete/summarize
bun add -g @steipete/bslog

cd ~/.ai/skills/brave-search && npm ci
cd ~/.ai/skills/video-transcript-downloader && npm ci

mkdir -p ~/.codex
if [ -e ~/.codex/AGENTS.md ] && [ ! -L ~/.codex/AGENTS.md ]; then mv ~/.codex/AGENTS.md ~/.codex/AGENTS.md.backup.$(date +%Y%m%d-%H%M%S); fi
if [ -L ~/.codex/AGENTS.md ] && [ "$(readlink ~/.codex/AGENTS.md)" != "$HOME/.ai/AGENTS.md" ]; then mv ~/.codex/AGENTS.md ~/.codex/AGENTS.md.backup.$(date +%Y%m%d-%H%M%S); fi
rm -f ~/.codex/AGENTS.md
ln -s ~/.ai/AGENTS.md ~/.codex/AGENTS.md

if [ -e ~/.codex/prompts ] && [ ! -L ~/.codex/prompts ]; then mv ~/.codex/prompts ~/.codex/prompts.backup.$(date +%Y%m%d-%H%M%S); fi
if [ -L ~/.codex/prompts ] && [ "$(readlink ~/.codex/prompts)" != "$HOME/.ai/docs/slash-commands" ]; then mv ~/.codex/prompts ~/.codex/prompts.backup.$(date +%Y%m%d-%H%M%S); fi
rm -f ~/.codex/prompts
ln -s ~/.ai/docs/slash-commands ~/.codex/prompts

mkdir -p ~/.codex/skills
for d in ~/.ai/skills/*; do
  [ -d "$d" ] || continue
  n="$(basename "$d")"
  if [ -e "$HOME/.codex/skills/$n" ] && [ ! -L "$HOME/.codex/skills/$n" ]; then mv "$HOME/.codex/skills/$n" "$HOME/.codex/skills/${n}.backup.$(date +%Y%m%d-%H%M%S)"; fi
  rm -f "$HOME/.codex/skills/$n"
  ln -s "$d" "$HOME/.codex/skills/$n"
done
```

Install preference: `brew` first, `bun` fallback when brew formula is missing.

Path note: when adding new binary paths, append them at the end of `~/.zshrc` after the existing `PATH` examples in this setup section (same pattern/order).

Quick verification:

```bash
command -v oracle
command -v tsc
command -v tsx
command -v yt-dlp
command -v ffmpeg
command -v summarize
summarize --version
readlink ~/.codex/AGENTS.md
readlink ~/.codex/prompts
find ~/.codex/skills -mindepth 1 -maxdepth 1 -type l | wc -l
```

## Syncing With Other Repos
- Treat `scripts/committer` and `scripts/docs-list.ts` as shared helpers. If you change them in another repo, mirror the change here (and vice versa) to avoid drift.
- When syncing helpers into another repo, keep files portable and dependency-light.
- Avoid repo-specific path aliases/import structures in shared helper files.

## Pointer-Style AGENTS
- Keep runtime behavior rules in `AGENTS.md`.
- In downstream repos, prefer a pointer-style `AGENTS.md` line that references this workspace file, then add only repo-local rules below it.
- Keep maintenance policy in this `README.md`, not in downstream `AGENTS.md` files.

## Script Helpers

### `scripts/committer`
- Stages only explicit paths, validates commit message, creates commit.

### `scripts/docs-list.ts`
- Walks `docs/`, enforces front-matter (`summary`, `read_when`), and prints summaries.
  - Build: `bun build scripts/docs-list.ts --compile --outfile bin/docs-list`
  - Run: `bin/docs-list`

### `scripts/browser-tools.ts`
- Standalone Chrome DevTools helper inspired by "What if you don't need MCP?".
- Optional compiled binary:
  - Build: `NODE_PATH="$(npm root -g)" bun build scripts/browser-tools.ts --compile --target bun --outfile bin/browser-tools`
  - Run: `bin/browser-tools --help`
- Notes:
  - Requires global npm modules: `commander`, `puppeteer-core`.
  - `bin/browser-tools` is not tracked by git; rebuild locally as needed.
  - Keep this helper dependency-light and portable across repos.

## Skills
- Skills live in `skills/`.
- Some are guidance-only; others require local setup (API keys, npm installs, or external CLIs).
- If a skill references scripts under `skills/<name>/scripts`, keep those files alongside the skill.

### Available Now
- `create-cli`
- `brave-search`
- `frontend-design`
- `markdown-converter`
- `oracle`
- `openai-image-gen`
- `swift-concurrency-expert`
- `swiftui-liquid-glass`
- `swiftui-performance-audit`
- `swiftui-view-refactor`
- `video-transcript-downloader`

### Parked (Needs Setup)
- `1password` (install `op` / `1password-cli`)
- `instruments-profiling` (install/configure Xcode tooling so `xcrun xctrace` works)
- `nano-banana-pro` (set `GEMINI_API_KEY`)
- `native-app-performance` (install/configure Xcode tooling so `xcrun xctrace` works)

## Slash Commands
- Local mirror lives in `docs/slash-commands/`.
- Global prompts (if used) live in `~/.codex/prompts/`.

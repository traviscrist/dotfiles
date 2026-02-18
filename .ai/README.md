# AI Workspace

This folder is your local AI workspace. It carries shared guardrails, scripts, skills, and slash-command docs adapted from `agent-scripts`, with local pathing under `~/.ai`.

## Quick Setup
Run this on a new machine (or after pulling updates):

```bash
brew bundle --file ~/.Brewfile
npm install -g tsx ts-node commander puppeteer-core

cd ~/.ai/skills/brave-search && npm ci
cd ~/.ai/skills/video-transcript-downloader && npm ci

mkdir -p ~/.codex
if [ -e ~/.codex/prompts ] && [ ! -L ~/.codex/prompts ]; then mv ~/.codex/prompts ~/.codex/prompts.backup.$(date +%Y%m%d-%H%M%S); fi
if [ -L ~/.codex/prompts ] && [ "$(readlink ~/.codex/prompts)" != "$HOME/.ai/docs/slash-commands" ]; then mv ~/.codex/prompts ~/.codex/prompts.backup.$(date +%Y%m%d-%H%M%S); fi
rm -f ~/.codex/prompts
ln -s ~/.ai/docs/slash-commands ~/.codex/prompts
```

Quick verification:

```bash
command -v oracle
command -v tsc
command -v tsx
command -v yt-dlp
command -v ffmpeg
readlink ~/.codex/prompts
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

## Slash Commands
- Local mirror lives in `docs/slash-commands/`.
- Global prompts (if used) live in `~/.codex/prompts/`.

# AI Workspace

This folder is your local AI workspace. It carries shared guardrails, scripts, and skills with local pathing under `~/.ai`.

## Quick Setup
Run this on a new machine (or after pulling updates):

```bash
brew bundle --file ~/.Brewfile
npm install -g tsx
brew install agent-browser
agent-browser install
curl -o /tmp/gitpod -fsSL "https://releases.gitpod.io/cli/stable/gitpod-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m | sed 's/x86_64/amd64/;s/\\(arm64\\|aarch64\\)/arm64/')" \
  && chmod +x /tmp/gitpod \
  && sudo mv /tmp/gitpod /usr/local/bin/gitpod
brew install steipete/tap/summarize || bun add -g @steipete/summarize
bun add -g @steipete/bslog

cd ~/.ai/skills/brave-search && npm ci

mkdir -p ~/.codex
if [ -e ~/.codex/AGENTS.md ] && [ ! -L ~/.codex/AGENTS.md ]; then mv ~/.codex/AGENTS.md ~/.codex/AGENTS.md.backup.$(date +%Y%m%d-%H%M%S); fi
if [ -L ~/.codex/AGENTS.md ] && [ "$(readlink ~/.codex/AGENTS.md)" != "$HOME/.ai/AGENTS.md" ]; then mv ~/.codex/AGENTS.md ~/.codex/AGENTS.md.backup.$(date +%Y%m%d-%H%M%S); fi
rm -f ~/.codex/AGENTS.md
ln -s ~/.ai/AGENTS.md ~/.codex/AGENTS.md

mkdir -p ~/.ai/prompts
if [ -e ~/.codex/prompts ] && [ ! -L ~/.codex/prompts ]; then mv ~/.codex/prompts ~/.codex/prompts.backup.$(date +%Y%m%d-%H%M%S); fi
if [ -L ~/.codex/prompts ] && [ "$(readlink ~/.codex/prompts)" != "$HOME/.ai/prompts" ]; then mv ~/.codex/prompts ~/.codex/prompts.backup.$(date +%Y%m%d-%H%M%S); fi
rm -f ~/.codex/prompts
ln -s ~/.ai/prompts ~/.codex/prompts

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
After adding new brew formulae/casks, record them in `~/.Brewfile`.

Path note: when adding new binary paths, append them at the end of `~/.zshrc` after the existing `PATH` examples in this setup section (same pattern/order).

Quick verification:

```bash
command -v tsx
command -v agent-browser
agent-browser --version
agent-browser doctor
command -v gitpod
gitpod version
command -v summarize
summarize --version
command -v bslog
test -f ~/.peekaboo/config.json && echo "peekaboo config ok"
readlink ~/.codex/AGENTS.md
readlink ~/.codex/prompts
find ~/.codex/skills -mindepth 1 -maxdepth 1 -type l | wc -l
```

## bslog Setup Checks

`bslog` uses split auth:
- `BETTERSTACK_API_TOKEN`: source discovery (`bslog sources list`)
- `BETTERSTACK_QUERY_USERNAME` + `BETTERSTACK_QUERY_PASSWORD`: query paths (`bslog tail|search|errors|warnings|sql|query`)

Validate both paths:

```bash
bslog sources list --format json >/dev/null
bslog config source "Polaris Web"
bslog sql "SELECT 1 FORMAT JSONEachRow" --format json
```

If query auth fails:
- In Better Stack Logs, create fresh Query API credentials via `Connect remotely`.
- Update `~/.secrets` exports for `BETTERSTACK_QUERY_USERNAME` and `BETTERSTACK_QUERY_PASSWORD`.
- Reload shell: `source ~/.zshrc`.

Source/region notes:
- Prefer source **name** in config (`bslog config source "Polaris Web"`), not numeric ID.
- If a source is in a non-default data region and queries fail unexpectedly, run verbose command and confirm query endpoint/region alignment.

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
  - Run: `docs-list`

### `agent-browser` (external CLI)
- Preferred browser automation tool for agent workflows.
- Install/update:
  - `brew install agent-browser` (fallback: `npm install -g agent-browser`)
  - `agent-browser install` (first-time Chrome for Testing bootstrap)
  - `agent-browser upgrade` (update to latest)
- Quick usage:
  - `agent-browser open https://example.com`
  - `agent-browser snapshot`
  - `agent-browser screenshot page.png`
  - `agent-browser close`

## Skills
- Skills live in `skills/`.
- Some are guidance-only; others require local setup (API keys, npm installs, or external CLIs).
- If a skill references scripts under `skills/<name>/scripts`, keep those files alongside the skill.

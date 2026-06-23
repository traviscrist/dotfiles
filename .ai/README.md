# AI Workspace

This folder is your local AI workspace. It carries shared guardrails, scripts, and skills with local pathing under `~/.ai`.

## Codex Setup
- Run `codex doctor` after Codex upgrades; fix `fail` items before changing agent behavior.
- Reusable workflows live in `skills/`. Custom prompts in `prompts/` are legacy and should be converted to skills when touched.
- This workspace intentionally symlinks `~/.ai/skills/*` into `~/.codex/skills/` so local skills are available immediately. For shared distribution, package workflows as Codex plugins.
- `docs-list` expects a `docs/` directory in the current repo. In this workspace it may fail until `docs/` exists; record that as a skipped docs gate, not a repo failure.

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

mkdir -p ~/.codex
if [ -e ~/.codex/AGENTS.md ] && [ ! -L ~/.codex/AGENTS.md ]; then mv ~/.codex/AGENTS.md ~/.codex/AGENTS.md.backup.$(date +%Y%m%d-%H%M%S); fi
if [ -L ~/.codex/AGENTS.md ] && [ "$(readlink ~/.codex/AGENTS.md)" != "$HOME/.ai/AGENTS.md" ]; then mv ~/.codex/AGENTS.md ~/.codex/AGENTS.md.backup.$(date +%Y%m%d-%H%M%S); fi
rm -f ~/.codex/AGENTS.md
ln -s ~/.ai/AGENTS.md ~/.codex/AGENTS.md

mkdir -p ~/.ai/prompts
# Legacy prompt bridge. Prefer skills for new reusable workflows.
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
test -f ~/.peekaboo/config.json && echo "peekaboo config ok"
readlink ~/.codex/AGENTS.md
readlink ~/.codex/prompts
find ~/.codex/skills -mindepth 1 -maxdepth 1 -type l | wc -l
yadm status -uno
```

## Better Stack MCP

Better Stack is configured as a remote HTTP MCP server in `~/.codex/config.toml`:

```toml
[mcp_servers.betterstack]
url = "https://mcp.betterstack.com"
```

Use OAuth when the client prompts for browser sign-in. For non-OAuth clients, configure an API-token-backed MCP header instead of reinstalling a local CLI.

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
- Use this for browser checks. Avoid Puppeteer, Playwright, browser MCPs, and ad-hoc Node browser scripts unless a repo already owns that test stack or Travis explicitly asks.
- Install/update:
  - `brew install agent-browser` (fallback: `npm install -g agent-browser`)
  - `agent-browser install` (first-time Chrome for Testing bootstrap)
  - `agent-browser upgrade` (update to latest)
- Quick usage:
  - `agent-browser open https://example.com`
  - `agent-browser snapshot`
  - `agent-browser screenshot page.png`
  - `agent-browser close`

## Tool Details
- `peekaboo`: screen inspection/clicks. Requires Screen Recording + Accessibility permissions. Check with `peekaboo permissions status`.
- `trash`: delete guardrail. Use `trash <path>` instead of destructive shell deletes.
- `summarize`: install/update with `brew install steipete/tap/summarize` or `bun add -g @steipete/summarize`.
- `betterstack`: remote MCP server for Better Stack uptime, telemetry, incidents, dashboards, and logs.
- `render`: install with `brew install render`, then add `brew "render"` to `~/.Brewfile`; prefer `RENDER_API_KEY` auth.
- `tmux`: reserve for persistent interactive work such as servers/debuggers.
- `yadm`: use `yadm status -uno` by default in the home repo; use explicit paths for untracked checks.

## Skills
- Durable local skills live in `~/.ai/skills` and symlink into `~/.codex/skills`.
- Installed third-party skills live in `~/.agents/skills`.
- `skills/make-pr` replaces legacy `/makepr`.
- Some are guidance-only; others require local setup (API keys, npm installs, or external CLIs).
- If a skill references scripts under `skills/<name>/scripts`, keep those files alongside the skill.

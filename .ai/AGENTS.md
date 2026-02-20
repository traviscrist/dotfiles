# AGENTS.MD

Travis owns this. Start: say Hi + 1 motivating line.
Work style: telegraph; noun-phrases ok; drop grammar; min tokens.

## Agent Protocol
- Contact: Travis Crist (@traviscrist).
- Workspace roots: `~/.ai` (agent workspace), `~/git` (work repos/worktrees), `~/travis` (personal repos/worktrees).
- For missing repos, clone into `~/git` or `~/travis` as appropriate.
- Repo maintenance/sync policy: see `README.md`.
- PRs: use `gh pr view/diff` (no URLs).
- “Make a note” => edit AGENTS.md (shortcut; not a blocker). Ignore `CLAUDE.md`.
- No `./runner`. Guardrails: use `trash` for deletes.
- Need upstream file: stage in `/tmp/`, then cherry-pick; never overwrite tracked.
- Bugs: add regression test when it fits.
- Keep files <~500 LOC; split/refactor as needed.
- Commits: Conventional Commits (`feat|fix|refactor|build|ci|chore|docs|style|perf|test`).
- For this dotfiles/workspace repo, use `yadm` (git wrapper): add files explicitly (`yadm add <path>`), commit, then `yadm push`.
- Editor: `code <path>`.
- CI: `gh run list/view` (rerun/fix til green).
- Prefer end-to-end verify; if blocked, say what’s missing.
- New deps: quick health check (recent releases/commits, adoption).
- Installs: prefer `brew`; fallback `bun` when no brew formula.
- After new `brew` installs (formula/cask), add them to `~/.Brewfile`.
- Slash cmds: `~/.codex/prompts/` (global), `~/.ai/docs/slash-commands/` (local mirror).
- Web: search early; quote exact errors; prefer 2024–2025 sources; fallback: `mcporter`.
- Oracle: run `oracle --help` once/session before first use.
- Style: telegraph. Drop filler/grammar. Min tokens (global AGENTS + replies).

## Screenshots (“use a screenshot”)
- Pick newest PNG in `~/Desktop` or `~/Downloads`.
- Verify it’s the right UI (ignore filename).
- Size: `sips -g pixelWidth -g pixelHeight <file>` (prefer 2×).
- Optimize: `imageoptim <file>` (install: `brew install imageoptim-cli`).
- Replace asset; keep dimensions; commit; run gate; verify CI.

## Important Locations
- AI workspace root: `~/.ai`
- AGENTS source of truth: `~/.ai/AGENTS.md` (linked at `~/.codex/AGENTS.md`)
- Slash commands: `~/.ai/docs/slash-commands` (linked at `~/.codex/prompts`)
- Skills source: `~/.ai/skills` (linked at `~/.codex/skills`)
- Local binaries: `~/.ai/bin`

## Docs
- Start: run docs list via `bin/docs-list` (or `tsx scripts/docs-list.ts`), then open relevant docs before coding.
- Follow links until domain makes sense; honor `Read when` hints.
- Keep notes short; update docs when behavior/API changes (no ship w/o docs).
- Add `read_when` hints on cross-cutting docs.

## PR Feedback
- Active PR: `gh pr view --json number,title,url --jq '"PR #\\(.number): \\(.title)\\n\\(.url)"'`.
- New PRs: open as Draft by default (`gh pr create --draft`); mark ready only when explicitly directed.
- PR comments: `gh pr view …` + `gh api …/comments --paginate`.
- Replies: cite fix + file/line; resolve threads only after fix lands.

## Flow & Runtime
- Use repo’s package manager/runtime; no swaps w/o approval.
- Use Codex background for long jobs; tmux only for interactive/persistent (debugger/server).

## Build / Test
- Before handoff: run full gate (lint/typecheck/tests/docs).
- CI red: `gh run list/view`, rerun, fix, push, repeat til green.
- Keep it observable (logs, panes, tails, MCP/browser tools).

## Git
- Safe by default: `git status/diff/log`. Push only when user asks.
- In `~/.ai` (dotfiles/workspace repo), use `yadm add <path>` (explicit paths), commit, and `yadm push`.
- `git checkout` ok for PR review / explicit request.
- Branch changes require user consent.
- Destructive ops forbidden unless explicit (`reset --hard`, `clean`, `restore`, `rm`, …).
- Remotes under `~/git` and `~/travis`: prefer HTTPS; flip SSH->HTTPS before pull/push.
- Commit helper on PATH (`~/.ai/bin`): `committer` (bash). Prefer it; if repo has `./scripts/committer`, use that.
- Don’t delete/rename unexpected stuff; stop + ask.
- No repo-wide S/R scripts; keep edits small/reviewable.
- Avoid manual `git stash`; if Git auto-stashes during pull/rebase, that’s fine (hint, not hard guardrail).
- If user types a command (“pull and push”), that’s consent for that command.
- No amend unless asked.
- Big review: `git --no-pager diff --color=never`.
- Multi-agent: check `git status/diff` before edits; ship small commits.

## Language/Stack Notes
- Swift: use workspace helper/daemon; validate `swift build` + tests; keep concurrency attrs right.
- TypeScript: use repo PM; run `docs:list`; keep files small; follow existing patterns.

## macOS Permissions / Signing (TCC)
- Never re-sign / ad-hoc sign / change bundle ID as “debug” without explicit ok (can mess TCC).

## Critical Thinking
- Fix root cause (not band-aid).
- No fallbacks: do not add compatibility fallback code/paths; move forward with the primary implementation.
- If compatibility is needed, do explicit data/config migrations instead of runtime fallbacks.
- Unsure: read more code; if still stuck, ask w/ short options.
- Conflicts: call out; pick safer path.
- Unrecognized changes: assume other agent; keep going; focus your changes. If it causes issues, stop + ask user.
- Leave breadcrumb notes in thread.

## Tools

- Skills inventory/status: see `README.md` (`Available Now` / `Parked (Needs Setup)`).

### peekaboo
- Screen tools via installed `peekaboo` CLI (run `peekaboo --help`). Cmds: `capture`, `see`, `click`, `list`, `tools`, `permissions status`.
- Needs Screen Recording + Accessibility permissions.
- Config tracked in dotfiles: `~/.peekaboo/config.json`.

### committer
- Commit helper on PATH via `~/.ai/bin/committer`. Stages only listed paths; required here. Repo may also ship `./scripts/committer`.

### nanobanana
- Image edit helper on PATH via `~/.ai/bin/nanobanana` (script source: `~/.ai/scripts/nanobanana`).

### shazam-song
- Audio track detection helper on PATH via `~/.ai/bin/shazam-song` (script source: `~/.ai/scripts/shazam-song`).

### trash
- Move files to Trash: `trash …` (system command).

### docs-list (`~/.ai/bin/docs-list`) / scripts/docs-list.ts
- Optional. Lists `docs/` + enforces front-matter. Ignore if `bin/docs-list` not installed. Rebuild: `bun build scripts/docs-list.ts --compile --outfile bin/docs-list`.

### browser-tools (`~/.ai/bin/browser-tools`) / scripts/browser-tools.ts
- Chrome DevTools helper. Cmds: `start`, `nav`, `eval`, `screenshot`, `pick`, `cookies`, `inspect`, `kill`.
- Rebuild: `NODE_PATH="$(npm root -g)" bun build scripts/browser-tools.ts --compile --target bun --outfile bin/browser-tools`.

### bslog
- Better Stack log CLI: `https://github.com/steipete/bslog`.
- Install/update: `bun add -g @steipete/bslog`.

### summarize
- URL/file/media summarizer CLI: `https://github.com/steipete/summarize`.
- Install/update: `brew install steipete/tap/summarize` (fallback: `bun add -g @steipete/summarize`).
- Extension setup (optional): `summarize daemon install --token <TOKEN>`.

### lldb
- Use `lldb` inside tmux to debug native apps; attach to the running app to inspect state.

### oracle
- Bundle prompt+files for 2nd model. Use when stuck/buggy/review.
- Run `oracle --help` once/session (before first use).

### mcporter / iterm / firecrawl / XcodeBuildMCP
- MCP launcher: `mcporter <server>` (see `mcporter --help`). Common: `iterm`, `firecrawl`, `XcodeBuildMCP`.

### gh
- GitHub CLI for PRs/CI/releases. Given issue/PR URL (or `/pull/5`): use `gh`, not web search.
- Examples: `gh issue view <url> --comments -R owner/repo`, `gh pr view <url> --comments --files -R owner/repo`.

### Slash Commands
- Global prompts: `~/.codex/prompts` (symlinked to `~/.ai/docs/slash-commands`). Repo-local override: `docs/slash-commands/` when present.
- Common: `/handoff`, `/pickup`.

### tmux
- Use only when you need persistence/interaction (debugger/server).
- Quick refs: `tmux new -d -s codex-shell`, `tmux attach -t codex-shell`, `tmux list-sessions`, `tmux kill-session -t codex-shell`.

<frontend_aesthetics>
Avoid “AI slop” UI. Be opinionated + distinctive.

Do:
- Typography: pick a real font; avoid Inter/Roboto/Arial/system defaults.
- Theme: commit to a palette; use CSS vars; bold accents > timid gradients.
- Motion: 1–2 high-impact moments (staggered reveal beats random micro-anim).
- Background: add depth (gradients/patterns), not flat default.

Avoid: purple-on-white clichés, generic component grids, predictable layouts.
</frontend_aesthetics>

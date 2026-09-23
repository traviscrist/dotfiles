# AI Workspace

Shared policy, scripts, and local tooling under `~/.ai`.

## Agent Policy

`~/.ai/AGENTS.md` is the shared policy. Both `~/.pi/agent/AGENTS.md` and
`~/.codex/AGENTS.md` link to it. Keep it short: constraints, approval boundaries,
required verification, and pointers—not a generic implementation playbook.
Repository instructions own their architecture, privacy contracts, and gates.

`docs-list` expects a `docs/` directory. This workspace has none; record that
as a skipped docs gate, not a failure requiring new documentation.

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
```

Yadm restores the Pi/Codex policy links. Before creating or repairing a link,
inspect the existing path and preserve unexpected content; do not overwrite it.

Install preference: Homebrew first, Bun when no formula exists. Record new
Homebrew formulae/casks in `~/.Brewfile`. Shell paths/config belong in
`~/.zsh/*.zsh`, sourced by `~/.zshrc`.

Quick verification:

```bash
command -v tsx
command -v agent-browser
agent-browser --version
agent-browser doctor
command -v gitpod
gitpod version
readlink ~/.pi/agent/AGENTS.md
readlink ~/.codex/AGENTS.md
yadm status -uno
```

## Pi Installation and Minimal Setup

Pi uses the official npm installation, not Homebrew:

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
pi update
```

Baseline: Pi 0.87.0. Updates are explicit. The `pi` shell function in
`~/.zsh/functions.zsh` uses `fnm exec --using=lts-latest`, so project Node pins
do not hide Pi or select an unsupported runtime.

- Default model: `openai-codex/gpt-6-astra`, high thinking; no automatic routing.
- Core tools and native compaction/output limits. No custom context caps,
  output-limit extension, pruning, or compaction model override.
- No installed third-party Pi packages or default orchestration. Lens, FFF,
  structured questions, web access, MCP adapter, and pi-subagents were removed.
- Retained local extensions: busy-tab-followup, handoff, pi-openai-fast-mode,
  and vim-statusline. Retained theme: Mariana Dark.
- Busy **Tab** queues follow-ups; autocomplete takes precedence. Native
  **Alt+Enter** still works. Plain `next` is ordinary input, not a hidden command.
- `/fast on` requests priority service for allowlisted models in this session;
  `/fast off` disables it. Fast defaults OFF and does not persist across sessions.
- Native retry settings remain five retries with 8s initial exponential backoff
  (8s, 16s, 32s, 64s, 128s); project overrides take precedence.
- Startup maintenance hooks were removed. Existing sessions, runtime artifacts,
  and credentials are not purged as part of extension removal.

Use CLI tools through Bash first. A missing specialist integration is a
prerequisite, not permission to bypass an approved access route. If explicitly
requested, Pi can load a package for one session with `pi -e npm:<package>`;
audit it first. Existing MCP endpoint configuration is retained but inactive
without the adapter; credentials remain untouched.

Restart existing Pi sessions after cleanup, once active work is safe to stop.
Already-running sessions retain old tools and instructions until reloaded/restarted;
the removal does not rewrite their history or terminate other agents.

### Prompts and Skills

Four short templates in `~/.pi/agent/prompts/`:

- `/debug <context>`: read-only diagnosis and a proposed fix.
- `/ship <task>`: implement and validate; publication only if explicitly authorized.
- `/review [PR]`: read-only PR review; no fixes or external writes.
- `/pr [PR]`: inspect feedback, obtain selection approval, fix/validate, then obtain
  separate publication approval before commit/push/replies/resolution/re-review.

No `/next`, `/yolo`, `/pr --auto`, automatic fanout, chaining, or sync agent.
Repository gates apply without copying their implementation into these templates.

Global Graphify/Next/PR workflow skills and shared Clerk/Crit skill installs were
removed. Shared removal affects all harnesses reading `~/.agents/skills`.
The Langfuse reference remains at `~/.pi/agent/skills/langfuse`, with local
`disable-model-invocation: true`: it is not advertised to every model request.
Load it explicitly for relevant work or with `/skill:langfuse`; repository-local
skills, including AuraBear's evaluation case guidance, remain intact.

### Session Handoff

`/handoff [focus]` prepares a continuation brief using the selected model once
at medium thinking. Review/edit it before opening a linked fresh session with an
unsubmitted draft. Esc cancels; briefs over 12,000 characters are rejected.
No automatic trigger, branch change, implementation, or new authorization.

Wait for active work and queued messages to finish first. The new session rechecks
Git state, remaining gates, and approval boundaries. Summarization costs tokens
even if cancelled; successful handoffs record summary usage in the new session.

### Validation and Safe Sync

The npm workspace retains only the four Pi SDK dependencies at 0.87.0 for local
extension tests. Run each `*.test.ts` under the four retained extension directories
with a separate `bun test <file>` process; their module mocks interfere together.
Validate native resource loading without making a model request, check formatting,
JSON, Markdown, line counts, links, and `yadm diff --check` before publication.

For intentional Pi/dotfile changes:

1. Inspect `yadm status -uno`, targeted untracked paths, and the intended diff.
2. Verify ignore rules for auth, sessions, workflows/runtime artifacts, and recursive
   `node_modules`. Never stage secrets, local env files, or private content.
3. Stage only explicit safe paths with `yadm add <path> ...`; inspect the staged diff
   and `yadm diff --cached --check`. Preserve unrelated changes and staging.
4. Commit with Conventional Commits, then `yadm push`. Report failures; no force push.

Keep tests and temporary synthetic checks outside product repositories. Never put
real conversation content, secrets, or private observations in local test logs.

## Langfuse CLI

Installed globally with Bun (no Homebrew formula):

```bash
bun add --global langfuse-cli@1.2.0
langfuse --version
langfuse api __schema
```

The retained skill and references are tracked locally; upstream provenance is in
`~/.agents/.skill-lock.json`. Refreshing upstream must preserve its manual-only
frontmatter and repository privacy/approval rules.

Load only approved credentials into the CLI process and verify the region-correct
`LANGFUSE_BASE_URL` before requests. Never print keys, credential-bearing `--curl`
output, or restricted observations. Installation is not authentication or authority
to replay data, write datasets, promote prompts, or perform evaluations.

## Other Harnesses and Integrations

- Codex: run `codex doctor` after upgrades. Existing `~/.ai/skills` and their
  `~/.codex/skills` links are separate from the removed shared Clerk/Crit installs.
  Legacy Codex prompts remain under `~/.ai/prompts`, linked from `~/.codex/prompts`.
- Better Stack: remote MCP at `https://mcp.betterstack.com` in Codex configuration;
  authenticate through OAuth or approved API-token headers, never tracked secrets.
- Home Assistant: retained Pi MCP configuration uses
  `http://homeassistant.local:8123/api/mcp`, bearer auth via `HA_MCP`, and only
  exposed entities. It is inactive without an explicitly loaded adapter. HTTP is
  unencrypted; use only on a trusted LAN. Tool calls require approval.
- Neon: TrueVault-only, work laptop only, read-only; local excluded config and OS
  credential storage. See the shared policy before any access.
- Figma/FigJam: approved Codex Figma route only; removing Pi's MCP adapter does not
  authorize direct remote OAuth or a desktop-MCP replacement.

## Kitty Per-Computer Layouts

- **Cmd+Shift+S** saves windows, tabs, splits, and directories to
  `~/.config/kitty/startup.kitty-session`; the next full launch restores the layout.
- Saving is manual, not live process/Pi conversation recovery. The shared
  `.config/kitty/.gitignore` excludes this per-machine session file.
- First setup: launch `kitty --session=none`, arrange the layout, then save.
  Do not commit snapshots containing local paths or launch arguments.
- Reload shortcuts with **Ctrl+Cmd+,**; layout restore takes effect on full launch.

## Script Helpers and Maintenance

- `~/.ai/bin/committer`: stages only explicit paths and validates commit messages.
- `docs-list`: lists docs/frontmatter; source is `scripts/docs-list.ts`. Build with
  `bun build scripts/docs-list.ts --compile --outfile bin/docs-list`.
- Mirror portable committer/docs-list fixes between this workspace and repos
  using those helpers. Keep downstream AGENTS focused on repo-local requirements.
- `agent-browser`: headless browser checks; run `agent-browser close` afterward.
  Install with Homebrew and use `agent-browser install` for browser bootstrap.
- `trash`: approved deletion guardrail. `render`: CLI with local auth, never tracked keys.
- `tmux`: interactive/persistent servers or debuggers, not an orchestration layer.
- Herdr remains uninstalled. No automatic artifact/session cleanup at Pi startup;
  inspect existing manual maintenance commands before choosing any cleanup scope.

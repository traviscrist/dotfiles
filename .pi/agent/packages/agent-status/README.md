# Agent Status

Persistent, model-authored progress status for Pi. The widget reserves the slot immediately above `@juicesharp/rpiv-todo` and stays hidden until the agent publishes an update.

## Behavior

- Adds the `status_update` tool with `planning`, `implementing`, `validating`, `blocked`, and `done` phases.
- Prompts only the interactive parent agent during multi-step work.
- Requests an update after meaningful Todo transitions or six substantive tool calls.
- Injects reminders into the next existing model turn; it never starts a separate turn.
- Persists the latest tool-result snapshot in the active session branch.
- Restores after reload, resume, tree navigation, and compaction.
- Keeps headless subagents isolated from the parent widget.
- Strips terminal controls and rejects high-confidence credential values before persistence.

## Commands

- `/agent-status` — show the latest status.
- `/agent-status clear` — clear the widget and append a branch-local tombstone.

## Development

```sh
tsc -p ~/.pi/agent/packages/agent-status/tsconfig.json
cd ~/.pi/agent/packages/agent-status
bun test index.test.mjs state.test.mjs
```

The package must remain immediately before `npm:@juicesharp/rpiv-todo` in `~/.pi/agent/settings.json`. Pi renders above-editor widgets in registration order, and this extension registers an empty factory at `session_start` to reserve that position.

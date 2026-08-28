---
name: graphify
description: Use when explicitly creating, updating, querying, tracing, or explaining a Graphify knowledge graph, or when repository instructions require Graphify. Do not load for ordinary code lookup when no graph operation is needed.
---

# Graphify

Graphify turns code and content into a persistent knowledge graph with community
detection, source provenance, query/path/explain traversal, and reviewable outputs.
Use progressive disclosure: load only the reference for the requested operation.

## Existing project graph

When repository instructions name a committed graph, use that exact graph and command
before broad search. Confirm conclusions against source before editing. Do not search
for or assume a root graph when repository instructions declare subsystem graphs.

For a straightforward query with an explicit repository command, run it directly with
a bounded budget; the repository instruction is sufficient. Load
`references/query.md` only when vocabulary expansion, BFS/DFS selection, path,
explain, fallback traversal, or saved feedback is needed.

Typical commands:

```sh
graphify query "<question>" --graph <path>/graphify-out/graph.json --budget 2400
graphify path "<source>" "<target>" --graph <path>/graphify-out/graph.json
graphify explain "<node>" --graph <path>/graphify-out/graph.json
```

## Incremental update or reclustering

When the user explicitly requests `--update` or `--cluster-only`, read
`references/update.md` completely and follow it. A repository-required plain
`graphify update <subsystem>` command can run directly; inspect its report for parser
warnings, missing-source nodes, and stale topology as repository instructions require.

## Full build

For a new graph, a bare `/graphify`, a path/URL build, deep extraction, community
labeling, visualization, or full export pipeline:

1. Read `references/build-pipeline.md` completely.
2. Read `references/operations-and-routing.md` completely.
3. Follow both in order.

Those references preserve the complete extraction, merge, health, export, manifest,
cost, interpreter, query, add/watch, hook, and honesty runbooks without loading them
for ordinary queries.

## Specialized operations

- GitHub clone, multi-repo, or monorepo merge: `references/github-and-merge.md`
- Video/audio transcription: `references/transcribe.md`
- Semantic extraction prompt: `references/extraction-spec.md`
- Additional exports: `references/exports.md`
- Add URL or watch mode: `references/add-watch.md`
- Commit hooks or native integration: `references/hooks.md`

Load only references required by the active operation.

## Help

For `/graphify --help` or `/graphify -h` with no other arguments, print this concise
usage and stop without running commands:

```text
/graphify [path|GitHub URL] [--mode deep] [--update] [--cluster-only]
/graphify query "<question>" [--graph <graph.json>] [--budget <tokens>]
/graphify path "<source>" "<target>" [--graph <graph.json>]
/graphify explain "<node>" [--graph <graph.json>]
/graphify add <url>
```

## Honesty rules

- Never invent an edge; mark uncertainty as ambiguous.
- Never hide corpus, graph-health, cohesion, or token-cost warnings.
- Do not overwrite a healthy graph with an empty or unexpectedly smaller graph.
- Warn before visualizing more than 5,000 nodes.

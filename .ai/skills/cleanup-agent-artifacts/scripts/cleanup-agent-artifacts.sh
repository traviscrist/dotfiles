#!/usr/bin/env bash
set -euo pipefail

mode="dry-run"
root=""
root_explicit="false"
include_research="false"

usage() {
  cat <<'USAGE'
Usage: cleanup-agent-artifacts.sh [--dry-run|--apply] [--root PATH] [--include-research]

Dry-runs by default. --apply moves safe agent artifact candidates to Trash.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      mode="dry-run"
      shift
      ;;
    --apply)
      mode="apply"
      shift
      ;;
    --root)
      if [[ $# -lt 2 ]]; then
        echo "error: --root requires a path" >&2
        exit 2
      fi
      root="$2"
      root_explicit="true"
      shift 2
      ;;
    --include-research)
      include_research="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$root" ]]; then
  root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

if [[ ! -d "$root" ]]; then
  echo "error: root is not a directory: $root" >&2
  exit 2
fi

root="$(cd "$root" && pwd -P)"

git_root=""
if git -C "$root" rev-parse --show-toplevel >/dev/null 2>&1; then
  git_root="$(cd "$(git -C "$root" rev-parse --show-toplevel)" && pwd -P)"
fi

if [[ "$mode" == "apply" && -z "$git_root" && "$root_explicit" != "true" ]]; then
  echo "error: apply outside a git repo requires an explicit --root" >&2
  exit 2
fi

if [[ "$mode" == "apply" ]] && ! command -v trash >/dev/null 2>&1; then
  echo "error: trash command not found; refusing permanent deletion" >&2
  exit 2
fi

names=(
  ".pi-subagents"
  ".agent-artifacts"
  ".agent-research"
  ".codex-artifacts"
  ".claude-artifacts"
  "agent-artifacts"
  "goal-swarm"
)

if [[ "$include_research" == "true" ]]; then
  names+=("research")
fi

find_args=("$root" -path "$root/.git" -prune -o -type d '(')
for i in "${!names[@]}"; do
  if [[ "$i" -gt 0 ]]; then
    find_args+=(-o)
  fi
  find_args+=(-name "${names[$i]}")
done
find_args+=(')' -print)

raw_candidates=()
while IFS= read -r path; do
  raw_candidates+=("$path")
done < <(find "${find_args[@]}" | sort)

candidates=()
skipped=()

contains_tracked_files() {
  local path="$1"
  [[ -z "$git_root" ]] && return 1

  local rel
  rel="$(python3 - "$git_root" "$path" <<'PY'
import os, sys
print(os.path.relpath(sys.argv[2], sys.argv[1]))
PY
)"

  [[ "$rel" == ..* ]] && return 1
  [[ -n "$(git -C "$git_root" ls-files -- "$rel")" ]]
}

is_nested_under_candidate() {
  local path="$1"
  local existing
  [[ "${#candidates[@]}" -eq 0 ]] && return 1

  for existing in "${candidates[@]}"; do
    case "$path" in
      "$existing"/*) return 0 ;;
    esac
  done
  return 1
}

for path in "${raw_candidates[@]}"; do
  if is_nested_under_candidate "$path"; then
    skipped+=("$path (nested under selected candidate)")
    continue
  fi

  if contains_tracked_files "$path"; then
    skipped+=("$path (contains tracked files)")
    continue
  fi

  candidates+=("$path")
done

printf 'Root: %s\n' "$root"
printf 'Mode: %s\n' "$mode"

if [[ "${#candidates[@]}" -eq 0 ]]; then
  echo "No safe agent artifact candidates found."
else
  echo "Candidates:"
  printf '  %s\n' "${candidates[@]}"
fi

if [[ "${#skipped[@]}" -gt 0 ]]; then
  echo "Skipped:"
  printf '  %s\n' "${skipped[@]}"
fi

if [[ "$mode" == "dry-run" ]]; then
  echo "Dry-run only. Re-run with --apply to move candidates to Trash."
  exit 0
fi

if [[ "${#candidates[@]}" -eq 0 ]]; then
  exit 0
fi

trash "${candidates[@]}"
echo "Moved ${#candidates[@]} candidate(s) to Trash."

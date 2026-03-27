aws-ssh() {
  aws ssm start-session --target $1 --profile $2
}

# Describes AWS instances
describe-instances() {
  aws --version
  which aws
  [ -z "$1" ] && DI_PROFILE="" || DI_PROFILE="$1"
  [ -z "$2" ] && DI_REGION="" || DI_REGION=" --region $2"
  aws ec2 describe-instances --profile $1 --filters 'Name=instance-state-name,Values=running' --query 'Reservations[].Instances[].[PublicIpAddress,PrivateIpAddress,InstanceId,Tags[?Key==`Name`].Value[]||[`--`]]' --output text | sed '$!N;s/\n/ /' | column -t -s $'\t'
}

d-logs() {
  docker-compose logs --tail=100 -f $1 $2 $3 $4
}

d-up() {
  docker-compose up -d $1
}

d-down() {
  docker-compose down $1
}

d-up-logs() {
  docker-compose up -d && docker-compose logs --tail=100 -f $1
}

d-up-logs-web() {
  docker-compose up -d && docker-compose logs web --tail=100 -f $1
}

d-restart-logs() {
  docker-compose restart web && docker-compose logs --tail=100 -f $1
}

dc() {
  docker-compose
}

# Route Linear MCP workspace by repo context:
# - redcrayon* and homemgmt-ai* repos -> linear_redcrayon
# - polaris-* repos   -> linear_truevault
codex() {
  local repo_root repo_name
  repo_root="$(command git rev-parse --show-toplevel 2>/dev/null || pwd)"
  repo_name="${repo_root##*/}"

  local -a codex_route_args
  case "$repo_name" in
    *redcrayon*|homemgmt-ai*)
      codex_route_args=(
        -c 'mcp_servers.linear_redcrayon.enabled=true'
        -c 'mcp_servers.linear_truevault.enabled=false'
      )
      ;;
    polaris-*)
      codex_route_args=(
        -c 'mcp_servers.linear_redcrayon.enabled=false'
        -c 'mcp_servers.linear_truevault.enabled=true'
      )
      ;;
    *)
      codex_route_args=()
      ;;
  esac

  command codex "${codex_route_args[@]}" "$@"
}

# Force kanban to run on Homebrew Node (>=20), regardless of repo fnm version.
# Adds daemon helpers:
# - kanban start [args...]
# - kanban stop
# - kanban status
# - kanban logs
kanban() {
  local kanban_bin="${HOME}/.bun/bin/kanban"
  if [[ ! -x "$kanban_bin" ]]; then
    echo "kanban binary not found at $kanban_bin" >&2
    return 1
  fi

  local repo_root repo_name safe_name pid_file log_file cmd
  repo_root="$(command git rev-parse --show-toplevel 2>/dev/null || pwd)"
  repo_name="${repo_root##*/}"
  safe_name="${repo_name//[^a-zA-Z0-9._-]/-}"
  pid_file="/tmp/kanban-${safe_name}.pid"
  log_file="${HOME}/Library/Logs/kanban-${safe_name}.log"
  cmd="$1"

  case "$cmd" in
    start)
      shift
      if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
        echo "kanban already running for ${repo_name} (pid $(cat "$pid_file"))"
        local existing_url
        existing_url="$(sed -nE 's/.*(http:\/\/127\.0\.0\.1:[0-9]+\/[^[:space:]]+).*/\1/p' "$log_file" | tail -n 1)"
        [[ -n "$existing_url" ]] && echo "url: $existing_url"
        echo "log: $log_file"
        return 0
      fi
      mkdir -p "${HOME}/Library/Logs"
      (
        cd "$repo_root" || exit 1
        nohup env PATH="/opt/homebrew/bin:${PATH}" "$kanban_bin" --no-open "$@" >|"$log_file" 2>&1 &
        echo $! > "$pid_file"
      )
      echo "started kanban for ${repo_name} (pid $(cat "$pid_file"))"
      local url i
      for i in {1..50}; do
        url="$(sed -nE 's/.*(http:\/\/127\.0\.0\.1:[0-9]+\/[^[:space:]]+).*/\1/p' "$log_file" | tail -n 1)"
        [[ -n "$url" ]] && break
        sleep 0.1
      done
      [[ -n "$url" ]] && echo "url: $url"
      echo "log: $log_file"
      ;;
    stop)
      if [[ ! -f "$pid_file" ]]; then
        echo "kanban not running for ${repo_name} (no pid file)"
        return 0
      fi
      local pid
      pid="$(cat "$pid_file")"
      if kill -0 "$pid" 2>/dev/null; then
        kill "$pid"
        echo "stopped kanban for ${repo_name} (pid $pid)"
      else
        echo "kanban not running for ${repo_name} (stale pid $pid)"
      fi
      rm -f "$pid_file"
      ;;
    status)
      if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
        echo "kanban running for ${repo_name} (pid $(cat "$pid_file"))"
        local status_url
        status_url="$(sed -nE 's/.*(http:\/\/127\.0\.0\.1:[0-9]+\/[^[:space:]]+).*/\1/p' "$log_file" | tail -n 1)"
        [[ -n "$status_url" ]] && echo "url: $status_url"
        [[ -f "$log_file" ]] && tail -n 5 "$log_file"
      else
        echo "kanban not running for ${repo_name}"
      fi
      echo "log: $log_file"
      ;;
    logs)
      mkdir -p "${HOME}/Library/Logs"
      touch "$log_file"
      tail -f "$log_file"
      ;;
    *)
      env PATH="/opt/homebrew/bin:${PATH}" "$kanban_bin" "$@"
      ;;
  esac
}

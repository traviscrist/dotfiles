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
kanban() {
  local kanban_bin="${HOME}/.bun/bin/kanban"
  if [[ ! -x "$kanban_bin" ]]; then
    echo "kanban binary not found at $kanban_bin" >&2
    return 1
  fi
  env PATH="/opt/homebrew/bin:${PATH}" "$kanban_bin" "$@"
}

eval "$(/opt/homebrew/bin/brew shellenv)"

# Added by OrbStack: command-line tools and integration
source ~/.orbstack/shell/init.zsh 2>/dev/null || :

alias flush-dns="sudo killall -HUP mDNSResponder"
alias tv-aws="export AWS_PROFILE=truevault"
alias boom="npx npkill"
alias aider="~/.config/scripts/aider_copilot.sh"
alias setupClaudeMcpServers=' claude mcp add playwright npx @playwright/mcp@latest && \
  claude mcp add postgres npx @modelcontextprotocol/server-postgres postgresql://polaris:secure@localhost:5432/polaris \
  claude-code mcp add linear npx mcp-remote https://mcp.linear.app/sse && \
  claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant --project $(pwd)'

aws-ssh() {
  aws ssm start-session --target $1 --profile $2
}

# Describes AWS instances
describe-instances(){
  aws --version
  which aws
  [ -z "$1" ] && DI_PROFILE="" || DI_PROFILE="$1"
  [ -z "$2" ] && DI_REGION="" || DI_REGION=" --region $2"
  aws ec2 describe-instances --profile $1 --filters 'Name=instance-state-name,Values=running' --query 'Reservations[].Instances[].[PublicIpAddress,PrivateIpAddress,InstanceId,Tags[?Key==`Name`].Value[]||[`--`]]' --output text | sed '$!N;s/\n/ /' | column -t -s $'\t'
}

d-logs() {
  docker-compose logs --tail=100 -f $1
}

d-logs-web() {
  docker-compose logs web --tail=100 -f $1
}

d-logs-fresh() {
  docker-compose logs fresh --tail=100 -f $1
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

d-up-logs-fresh() {
  docker-compose up -d && docker-compose logs fresh --tail=100 -f $1
}

d-restart-logs() {
  docker-compose restart web && docker-compose logs --tail=100 -f $1
}

dc() {
  docker-compose
}

alias di="describe-instances"
alias pp="pnpm"
alias kgp='kubectl get po -o custom-columns="Name:metadata.name,CPU-limit:spec.containers[*].resources.limits.cpu, CPU-request:spec.containers[*].resources.requests.cpu, memory-limits:spec.containers[*].resources.limits.memory, memory-request:spec.containers[*].resources.requests.memory"'
alias tf="terraform"
alias nv="nvim"

# Load Secrets
[ -f "$HOME/.secrets" ] && source "$HOME/.secrets"

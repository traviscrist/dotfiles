alias flush-dns="sudo killall -HUP mDNSResponder"
alias awslogin='aws sso login --profile full-admin && export AWS_PROFILE=full-admin'
alias tv-aws="export AWS_PROFILE=truevault"
alias boom="npx npkill"
alias aider="~/.config/scripts/aider_copilot.sh"
alias setupClaudeMcpServers=' claude mcp add playwright npx @playwright/mcp@latest && \
  claude mcp add postgres npx @modelcontextprotocol/server-postgres postgresql://polaris:secure@localhost:5432/polaris && \
  claude mcp add --transport sse linear https://mcp.linear.app/sse && \
  claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant --project $(pwd)'
alias di="describe-instances"
alias pnpm="corepack pnpm"
alias pp="pnpm"
alias kgp='kubectl get po -o custom-columns="Name:metadata.name,CPU-limit:spec.containers[*].resources.limits.cpu, CPU-request:spec.containers[*].resources.requests.cpu, memory-limits:spec.containers[*].resources.limits.memory, memory-request:spec.containers[*].resources.requests.memory"'
alias tf="terraform"
alias nv="nvim"

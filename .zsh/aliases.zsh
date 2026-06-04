alias flush-dns="sudo killall -HUP mDNSResponder"
alias awslogin='aws sso login --profile full-admin && export AWS_PROFILE=full-admin'
alias awsloginread='aws sso login --profile read-only && export AWS_PROFILE=read-only'
alias aws-admin="export AWS_PROFILE=full-admin"
alias boom="npx npkill"
alias aider="~/.config/scripts/aider_copilot.sh"
alias di="describe-instances"
alias pnpm="corepack pnpm"
alias pp="pnpm"
alias kgp='kubectl get po -o custom-columns="Name:metadata.name,CPU-limit:spec.containers[*].resources.limits.cpu, CPU-request:spec.containers[*].resources.requests.cpu, memory-limits:spec.containers[*].resources.limits.memory, memory-request:spec.containers[*].resources.requests.memory"'
alias tf="terraform"
alias nv="nvim"

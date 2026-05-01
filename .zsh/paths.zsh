typeset -U path PATH

#
# DB Tools
#
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"

#
# Editors
#
export EDITOR='nvim'
export VISUAL='nvim'

#
# Language
#
if [[ -z "$LANG" ]]; then
  export LANG='en_US.UTF-8'
fi

#
# Python
#
export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

#
# NodeJS
#
eval "$(fnm env --use-on-cd)"

_fnm_fallback_lts_latest() {
  if [[ -f .node-version || -f .nvmrc ]]; then
    return
  fi
  fnm use --install-if-missing --silent-if-unchanged lts-latest >/dev/null 2>&1
}
add-zsh-hook -d chpwd _fnm_fallback_lts_latest 2>/dev/null
add-zsh-hook chpwd _fnm_fallback_lts_latest
_fnm_fallback_lts_latest

#
# Deno
#
export PATH="/Users/travis/.deno/bin:$PATH"

#
# Rust Cargo
#
export PATH="/Users/travis/.cargo/bin:$PATH"

#
# AI Workspace
#
export PATH="$HOME/.ai/bin:$PATH"

#
# BS Logs
#
export PATH="/Users/travis/.bun/bin:$PATH"

# Better Stack Query Endpoint
export BETTERSTACK_QUERY_BASE_URL="https://us-east-9-connect.betterstackdata.com"

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

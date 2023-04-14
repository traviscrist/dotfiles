# Nushell Environment Config File
#
# version = 0.78.0

let-env STARSHIP_SHELL = "nu"
let-env STARSHIP_SESSION_KEY = (random chars -l 16)
let-env PROMPT_MULTILINE_INDICATOR = (^/opt/homebrew/bin/starship prompt --continuation)
let-env STARSHIP_CONFIG = ([
                            ($env.HOME)
                            ('/.config/starship/starship.toml')
                           ] | str join)

def create_left_prompt [] {
    let width = (term size).columns
    starship prompt $"--cmd-duration=($env.CMD_DURATION_MS)" $"--status=($env.LAST_EXIT_CODE)" $"--terminal-width=($width)"
    # starship prompt --cmd-duration $env.CMD_DURATION_MS $'--status=($env.LAST_EXIT_CODE)'
}

# Whether we have config items
let has_config_items = (not ($env | get -i config | is-empty))

let-env config = if $has_config_items {
    $env.config | upsert render_right_prompt_on_last_line true
} else {
    {render_right_prompt_on_last_line: true}
}

def create_right_prompt [] {
    let width = (term size).columns
    starship prompt --right $"--cmd-duration=($env.CMD_DURATION_MS)" $"--status=($env.LAST_EXIT_CODE)" $"--terminal-width=($width)"
}

# Use nushell functions to define your right and left prompt
let-env PROMPT_COMMAND = { || create_left_prompt }
let-env PROMPT_COMMAND_RIGHT = { || create_right_prompt }

# The prompt indicators are environmental variables that represent
# the state of the prompt
let-env PROMPT_INDICATOR = ""
let-env PROMPT_INDICATOR_VI_INSERT = ": "
let-env PROMPT_INDICATOR_VI_NORMAL = "〉"
let-env PROMPT_MULTILINE_INDICATOR = "::: "

# Nu Default Prompt START
# def create_left_prompt [] {
#     mut home = ""
#     try {
#         if $nu.os-info.name == "windows" {
#             $home = $env.USERPROFILE
#         } else {
#             $home = $env.HOME
#         }
#     }
#
#     let dir = ([
#         ($env.PWD | str substring 0..($home | str length) | str replace -s $home "~"),
#         ($env.PWD | str substring ($home | str length)..)
#     ] | str join)
#
#     let path_segment = if (is-admin) {
#         $"(ansi red_bold)($dir)"
#     } else {
#         $"(ansi green_bold)($dir)"
#     }
#
#     $path_segment
# }
#
# def create_right_prompt [] {
#     let time_segment = ([
#         (date now | date format '%m/%d/%Y %r')
#     ] | str join)
#
#     $time_segment
# }
#
# # Use nushell functions to define your right and left prompt
# let-env PROMPT_COMMAND = {|| create_left_prompt }
# let-env PROMPT_COMMAND_RIGHT = {|| create_right_prompt }
#
# # The prompt indicators are environmental variables that represent
# # the state of the prompt
# let-env PROMPT_INDICATOR = {|| "> " }
# let-env PROMPT_INDICATOR_VI_INSERT = {|| ": " }
# let-env PROMPT_INDICATOR_VI_NORMAL = {|| "> " }
# let-env PROMPT_MULTILINE_INDICATOR = {|| "::: " }
# Nu Default Prompt END

# Specifies how environment variables are:
# - converted from a string to a value on Nushell startup (from_string)
# - converted from a value back to a string when running external commands (to_string)
# Note: The conversions happen *after* config.nu is loaded
let-env ENV_CONVERSIONS = {
  "PATH": {
    from_string: { |s| $s | split row (char esep) | path expand -n }
    to_string: { |v| $v | path expand -n | str join (char esep) }
  }
  "Path": {
    from_string: { |s| $s | split row (char esep) | path expand -n }
    to_string: { |v| $v | path expand -n | str join (char esep) }
  }
}

# Directories to search for scripts when calling source or use
#
# By default, <nushell-config-dir>/scripts is added
let-env NU_LIB_DIRS = [
    ($nu.config-path | path dirname | path join 'scripts')
]

# Directories to search for plugin binaries when calling register
#
# By default, <nushell-config-dir>/plugins is added
let-env NU_PLUGIN_DIRS = [
    ($nu.config-path | path dirname | path join 'plugins')
]

# Personal Paths
let-env PATH = ($env.PATH | append "/usr/local/bin")
let-env PATH = ($env.PATH | append "/opt/homebrew/bin")

# Nodejs
#
# FNM
# load env variables
fnm env --json | from json | load-env

# add dynamic fnm path
let-env PATH = ($env.PATH | split row (char esep) | prepend ([$env.FNM_MULTISHELL_PATH "bin"] | path join))

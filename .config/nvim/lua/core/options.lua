local o = vim.opt
local g = vim.g

o.autochdir = false                     -- don't change the working dir or your fzf doesn't work
o.autoindent = true                     -- copy indent from current line when starting a new line`
o.autoread = true                       -- Read changes to files from outside of vim
o.backup = false                        -- disable backups
o.backspace = 'indent,eol,start'        -- proper backspace behavior
o.clipboard = 'unnamedplus'             -- copy from vim
o.completeopt = 'menu,menuone,noselect' -- A comma separated list of options for Insert mode completion
o.cursorline = false                    -- highlight the current line
o.cursorcolumn = false                  -- highlight the current cusor column
o.colorColumn = 80
o.encoding = 'UTF-8'                    -- sets utf encoding for devicons
o.expandtab = true                      -- use spaces instead of tabs
o.grepprg = 'rg --hidden --vimgrep --smart-case --'
o.hidden = true                         -- Enable modified buffers in background
o.history = 500                         -- Number of search patterns remembered
o.ignorecase = true                     -- ignore case in search patterns
o.inccommand = 'nosplit'                -- preview incremental substitute
g.loaded_netrw = true                   -- disable netrw
g.loaded_netrwPlugin = true             -- disable netrw
o.mouse = 'nv'                          -- only allow mouse in normal and visual mode
o.number = true                         -- adds line number when using relative numbers too
o.pumblend = 10                         -- Popup transparency 0 - 30 most useful
o.pumheight = 10                        -- Maximum number of entries in a popup
o.relativenumber = true                 -- adds line numbers and relative line numbers
o.ruler = true                          -- show the current line number at the bottom
o.scrolloff = 3                         -- Minimal number of screen lines to keep above and below the cursor
o.shiftround = true                     -- Round shift indent
o.shiftwidth = 2                        -- the number of spaces inserted for each indentation
o.shortmess = o.shortmess + 'c'         -- modify autocomplete messages
o.showmatch = true                      -- shows matching bracket briefly when added
o.showmode = false                      -- we don't need to see things like -- INSERT -- anymore
o.signcolumn = 'yes'                    -- show signs in the number column 'number'
o.smartcase = true                      -- Don't ignore case with capitals
o.splitbelow = true                     -- force all horizontal splits to go below current window
o.splitright = true                     -- force all vertical splits to go to the right of current window
o.tabstop = 2                           -- how many columns a tab counts for
o.termguicolors = true                  -- set term gui true colors (most terminals support this)
o.timeoutlen = 400                      -- time to wait for a mapped sequence to complete (in milliseconds)
o.ttimeoutlen = 0                       -- Time in milliseconds to wait for a key code sequence to complete
o.undolevels = 1000
o.updatetime = 300                      -- faster completion
o.wildignorecase = true                 -- When set case is ignored when completing file names and directories
o.wildmode = 'longest:full,full'        -- Command-line completion mode
o.winminwidth = 5                       -- minimum window width
o.wildmenu = true                       -- enables command line completion
o.wildignore = [[
.git,.hg,.svn
*.aux,*.out,*.toc
*.o,*.obj,*.exe,*.dll,*.manifest,*.rbc,*.class
*.ai,*.bmp,*.gif,*.ico,*.jpg,*.jpeg,*.png,*.psd,*.webp
*.avi,*.divx,*.mp4,*.webm,*.mov,*.m2ts,*.mkv,*.vob,*.mpg,*.mpeg
*.mp3,*.oga,*.ogg,*.wav,*.flac
*.eot,*.otf,*.ttf,*.woff
*.doc,*.pdf,*.cbr,*.cbz
*.zip,*.tar.gz,*.tar.bz2,*.rar,*.tar.xz,*.kgb
*.swp,.lock,.DS_Store,._*
*/tmp/*,*.so,*.swp,*.zip,**/node_modules/**,**/target/**,**.terraform/**'
]]
o.writebackup = false -- disable backups

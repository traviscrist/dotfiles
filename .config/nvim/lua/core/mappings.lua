local map = vim.keymap.set

-- Don't show on the cmd line
local default_options = { silent = true }

-- Window Splitting
map('n', '<C-J>', '<C-W><C-J>', default_options)
map('n', '<C-K>', '<C-W><C-K>', default_options)
map('n', '<C-L>', '<C-W><C-L>', default_options)
map('n', '<C-H>', '<C-W><C-H>', default_options)

-- File Writing
map('n', '<leader>w', '<cmd>write<cr>', default_options)
map('n', '<leader>q', '<cmd>wq<cr>', default_options)
map('n', '<leader>qq', '<cmd>quit<cr>', default_options)

-- FZF Lua Settings
map('n', '<leader>b', ':FzfLua buffers<cr>', default_options)
map('n', '<leader>fr', ':FzfLua oldfiles<cr>', default_options)
map('n', '<leader>ff', ':FzfLua git_files<cr>', default_options)
map('n', '<leader>fw', ':FzfLua grep_cword<cr>', default_options)
map('n', '<leader>s', ':FzfLua grep_project<cr>', default_options)

-- NeoTree Settings
map('n', '<leader>t', ':NeoTreeFocusToggle<CR>', default_options)

local wk = require('which-key')

-- Register Leader Key Mappings
wk.register({
  b = { "<cmd>FzfLua buffers<cr>", "Buffers"},
  f = {
    name = 'Find',
    r = { '<cmd>FzfLua oldfiles<cr>', 'Recent Files' },
    f = { '<cmd>FzfLua git_files<cr>', 'Files' },
    w = { '<cmd>FzfLua grep_cword<cr>', 'Word Under Cursor' }
  },
  s = { '<cmd>FzfLua grep_project<cr>', 'Search Project'},
  t = { '<cmd>NeoTreeFocusToggle<CR>', 'Toggle Tree'},
  w = { '<cmd>write<cr>', 'Write'},
  q = { '<cmd>wq<cr>', 'Write Quit'},
  qq = { '<cmd>quit<cr>', 'Quit'}
}, { prefix = '<leader>', mode = 'n', default_options })

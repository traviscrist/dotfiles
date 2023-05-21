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
map('n', '<leader>r', ':FzfLua oldfiles<cr>', default_options)
map('n', '<leader>e', ':FzfLua git_files<cr>', default_options)
map('n', '<leader>a', ':FzfLua grep_cword<cr>', default_options)
map('n', '<leader>s', ':FzfLua grep_project<cr>', default_options)

-- NeoTree Settings
map('n', '<leader>t', ':NeoTreeFocusToggle<cr>', default_options)

-- Escap Highlights
map('n', '<C-C>', ':nohlsearch<cr>', default_options)

-- Git
map('n', '<leader>g', ':FzfLua git_status<cr>', default_options)


-- Surround Tip
-- "ys": You surround
-- "ds": Delete surrounding
-- "cs": Change surrounding
--
-- Then stuff like "ysiw(" becomes "you surround in word [with] parentheses".
-- Another example would be "csq'", which would be "change the surrounding quotes
-- for the apostrophe character". I think if you have a good grasp on the text
-- objects that involve i and a, e.g. ib, aB, etc., you should be fine with most
-- of the functionality for this plugin

local wk = require('which-key')

-- Register Leader Key Mappings
wk.register({
  a  = { '<cmd>FzfLua grep_cword<cr>', 'Word Under Cursor' },
  b  = { "<cmd>FzfLua buffers<cr>", "Buffers" },
  e  = { '<cmd>FzfLua git_files<cr>', 'Files' },
  f  = { '<cmd>lua vim.lsp.buf.format()<cr>', 'Format' },
  g  = { '<cmd>FzfLua git_status<cr>', 'Git Status' },
  q  = { '<cmd>wq<cr>', 'Write Quit' },
  qq = { '<cmd>quit<cr>', 'Quit' },
  r  = { '<cmd>FzfLua oldfiles<cr>', 'Recent Files' },
  s  = { '<cmd>FzfLua grep_project<cr>', 'Search Project' },
  t  = { '<cmd>NeoTreeFocusToggle<CR>', 'Toggle Tree' },
  w  = { '<cmd>write<cr>', 'Write' },
}, { prefix = '<leader>', mode = 'n', default_options })

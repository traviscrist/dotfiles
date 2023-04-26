local map = vim.keymap.set

-- Window Splitting
map('n', '<C-J>', '<C-W><C-J>')
map('n', '<C-K>', '<C-W><C-K>')
map('n', '<C-L>', '<C-W><C-L>')
map('n', '<C-H>', '<C-W><C-H>')

map('n', '<leader>w', '<cmd>write<cr>')
map('n', '<leader>q', '<cmd>wq<cr>')
map('n', '<leader>qq', '<cmd>quit<cr>')

-- FZF Lua Settings
map('n', '<leader>b', ':FzfLua buffers<cr>')
map('n', '<leader>m', ':FzfLua oldfiles<cr>')
map('n', '<leader>e', ':FzfLua git_files<cr>')
map('n', '<leader>g', ':FzfLua grep_project<cr>')
map('n', '<leader>v', ':FzfLua grep_cword<cr>')

-- NeoTree Settings
map('n', '<leader>t', ':NeoTreeFocusToggle<CR>')

-- Search
map('v', '//', 'y<C-R>')

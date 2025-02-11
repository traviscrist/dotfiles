local map = vim.keymap.set

-- Don't show on the cmd line
local default_options = { silent = true }

-- Window Splitting
-- map('n', '<C-J>', '<C-W><C-J>', default_options)
-- map('n', '<C-K>', '<C-W><C-K>', default_options)
-- map('n', '<C-L>', '<C-W><C-L>', default_options)
-- map('n', '<C-H>', '<C-W><C-H>', default_options)
-- Kitty Navigate Splits
map('n', '<C-J>', ':KittyNavigateDown <CR>', default_options)
map('n', '<C-K>', ':KittyNavigateUp <CR>', default_options)
map('n', '<C-L>', ':KittyNavigateRight <CR>', default_options)
map('n', '<C-H>', ':KittyNavigateLeft <CR>', default_options)

-- File Writing
map('n', '<leader>w', '<cmd>write<cr>', default_options)
map('n', '<leader>q', '<cmd>wq<cr>', default_options)
map('n', '<leader>qq', '<cmd>quit<cr>', default_options)
map('n', '<leader>qqa', '<cmd>qall!<cr>', default_options)

-- Buffers
map('n', 'bd', '<cmd>bd<cr>', default_options)
-- Close all buffers except current one
map('n', 'bbq', ':%bd|e#<CR>', { silent = true, desc = 'Close all buffers except current' })

-- Disable Recording Mode
map('n', 'q', '<Nop>', default_options)

-- Number Lines
map('n', '<leader>n', '<cmd>set relativenumber! number!<cr>', default_options)
map('n', '<leader>nn', '<cmd>set number!<cr>', default_options)

-- NeoTree Settings
map('n', '<leader>t', ':NeoTreeFocusToggle<cr>', default_options)

-- Escap Highlights
map('n', '<C-C>', ':nohlsearch<cr>', default_options)

-- Git Signs
map('n', 'tt', ':Gitsigns toggle_current_line_blame<cr>', default_options)

-- Git DiffView
map('n', '<leader>do', ':DiffviewOpen<cr>', default_options)
map('n', '<leader>dc', ':DiffviewClose<cr>', default_options)

-- LSP
vim.keymap.set('n', '<space>f', function() vim.lsp.buf.format { async = true } end, default_options)

-- LSP Saga
-- LSP finder - Find the symbol's definition
-- If there is no definition, it will instead be hidden
-- When you use an action in finder like "open vsplit",
-- you can use <C-t> to jump back
map("n", "gh", "<cmd>Lspsaga finder<CR>")

-- Code action
map({ "n", "v" }, "<space>ca", "<cmd>Lspsaga code_action<CR>")

-- Rename all occurrences of the hovered word for the entire file
map("n", "gr", "<cmd>Lspsaga rename<CR>")

-- Rename all occurrences of the hovered word for the selected files
map("n", "grp", "<cmd>Lspsaga rename ++project<CR>")

-- Peek definition
-- You can edit the file containing the definition in the floating window
-- It also supports open/vsplit/etc operations, do refer to "definition_action_keys"
-- It also supports tagstack
-- Use <C-t> to jump back
map("n", "gp", "<cmd>Lspsaga peek_definition<CR>")

-- Go to definition
map("n", "gd", "<cmd>Lspsaga goto_definition<CR>")

-- Peek type definition
-- You can edit the file containing the type definition in the floating window
-- It also supports open/vsplit/etc operations, do refer to "definition_action_keys"
-- It also supports tagstack
-- Use <C-t> to jump back
map("n", "gt", "<cmd>Lspsaga peek_type_definition<CR>")

-- -- Go to type definition
map("n", "gtd", "<cmd>Lspsaga goto_type_definition<CR>")


-- Show line diagnostics
-- You can pass argument ++unfocus to
-- unfocus the show_line_diagnostics floating window
map("n", "<space>sl", "<cmd>Lspsaga show_line_diagnostics<CR>")

-- Show buffer diagnostics
map("n", "<space>sb", "<cmd>Lspsaga show_buf_diagnostics<CR>")

-- Show workspace diagnostics
map("n", "<space>sw", "<cmd>Lspsaga show_workspace_diagnostics<CR>")

-- Show cursor diagnostics
map("n", "<space>sc", "<cmd>Lspsaga show_cursor_diagnostics<CR>")

-- Diagnostic jump
-- You can use <C-o> to jump back to your previous location
map("n", "[e", "<cmd>Lspsaga diagnostic_jump_prev<CR>")
map("n", "]e", "<cmd>Lspsaga diagnostic_jump_next<CR>")

-- Diagnostic jump with filters such as only jumping to an error
map("n", "[E", function()
  require("lspsaga.diagnostic"):goto_prev({ severity = vim.diagnostic.severity.ERROR })
end)
map("n", "]E", function()
  require("lspsaga.diagnostic"):goto_next({ severity = vim.diagnostic.severity.ERROR })
end)

-- Toggle outline
map("n", "<space>o", "<cmd>Lspsaga outline<CR>")

-- If you want to keep the hover window in the top right hand corner,
-- you can pass the ++keep argument
-- Note that if you use hover with ++keep, pressing this key again will
-- close the hover window. If you want to jump to the hover window
-- you should use the wincmd command "<C-w>w"
map("n", "K", "<cmd>Lspsaga hover_doc ++keep<CR>")

-- Call hierarchy
map("n", "<space>ci", "<cmd>Lspsaga incoming_calls<CR>")
map("n", "<space>co", "<cmd>Lspsaga outgoing_calls<CR>")

local write_as_cwd = function()
  local session_name = vim.fn.getcwd():gsub('/', '-')
  MiniSessions.write(session_name)
end
map("n", '<Leader>ws', write_as_cwd)

local wk = require('which-key')
-- Register Leader Key Mappings
wk.add({
  { "<leader>g",  "<cmd>Neotree float git_status git_base=main<cr>", desc = "Git Status" },
  { "<leader>q",  "<cmd>wq<cr>",                                     desc = "Write Quit" },
  { "<leader>qq", "<cmd>quit<cr>",                                   desc = "Quit" },
  { "<leader>t",  "<cmd>NeoTreeFocusToggle<CR>",                     desc = "Toggle Tree" },
  { "<leader>w",  "<cmd>write<cr>",                                  desc = "Write" },
}, { prefix = '<leader>', mode = 'n', default_options })

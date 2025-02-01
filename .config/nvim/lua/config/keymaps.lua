-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

local map = vim.keymap.set
-- Don't show on the cmd line
local default_options = { silent = true }

-- Kitty Navigate Splits
map("n", "<C-J>", ":KittyNavigateDown <CR>", default_options)
map("n", "<C-K>", ":KittyNavigateUp <CR>", default_options)
map("n", "<C-L>", ":KittyNavigateRight <CR>", default_options)
map("n", "<C-H>", ":KittyNavigateLeft <CR>", default_options)

-- File Writing
map("n", "<leader>w", "<cmd>write<cr>", default_options)
map("n", "<leader>q", "<cmd>wq<cr>", default_options)
map("n", "<leader>qq", "<cmd>quit<cr>", default_options)
map("n", "<leader>qqa", "<cmd>qall!<cr>", default_options)

-- FZF Lua Settings
map("n", "<leader>b", ":FzfLua buffers<cr>", default_options)
map("n", "<leader>r", ":FzfLua git_files<cr>", default_options)
map("n", "<leader>a", ":FzfLua grep_cword<cr>", default_options)
map("n", "<leader>s", ":FzfLua grep_project<cr>", default_options)

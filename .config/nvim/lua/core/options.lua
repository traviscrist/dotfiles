local settings = require("core.settings")

local o = vim.opt
local fn = vim.fn


o.backup = false -- disable backups
o.writebackup = false -- disable backups
o.clipboard = 'unnamedplus' -- copy from vim
o.completeopt = "menu,menuone,noselect" -- A comma separated list of options for Insert mode completion
-- Line Length, Numbering

o.expandtab = true -- use spaces instead of tabs
o.termguicolors = true -- set term gui true colors (most terminals support this)


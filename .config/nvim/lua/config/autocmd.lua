local api = vim.api
local autocmd = vim.api.nvim_create_autocmd

--- Remove all trailing whitespace on save
local TrimWhiteSpaceGrp = api.nvim_create_augroup("TrimWhiteSpaceGrp", { clear = true })
autocmd("BufWritePre", {
  command = [[:%s/\s\+$//e]],
  group = TrimWhiteSpaceGrp,
})

-- Show lsp issue in a window
autocmd("CursorHold", {
  callback = function()
    local opts = {
      focusable = false,
      close_events = { "BufLeave", "CursorMoved", "InsertEnter", "FocusLost" },
      border = 'rounded',
      source = 'always',
      prefix = ' ',
      scope = 'line',
      max_width = 70,
      pad_top = 0,
      pad_bottom = 0,
    }
    vim.diagnostic.open_float(nil, opts)
  end
})

-- Check if we need to reload the file when it changed
autocmd({ "FocusGained", "TermClose", "TermLeave" }, {
  command = "checktime",
})

-- Highlight on yank
autocmd("TextYankPost", {
  callback = function()
    vim.highlight.on_yank()
  end,
})

-- resize splits if window got resized
autocmd({ "VimResized" }, {
  callback = function()
    vim.cmd("tabdo wincmd =")
  end,
})

-- go to last loc when opening a buffer
autocmd("BufReadPost", {
  callback = function()
    local mark = vim.api.nvim_buf_get_mark(0, '"')
    local lcount = vim.api.nvim_buf_line_count(0)
    if mark[1] > 0 and mark[1] <= lcount then
      pcall(vim.api.nvim_win_set_cursor, 0, mark)
    end
  end,
})

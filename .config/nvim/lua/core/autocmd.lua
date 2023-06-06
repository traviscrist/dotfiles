local api = vim.api
local autocmd = vim.api.nvim_create_autocmd

--- Remove all trailing whitespace on save
local TrimWhiteSpaceGrp = api.nvim_create_augroup("TrimWhiteSpaceGrp", { clear = true })
autocmd("BufWritePre", {
  command = [[:%s/\s\+$//e]],
  group = TrimWhiteSpaceGrp,
})

autocmd('BufWritePre', {
  callback = function()
    vim.lsp.buf.format()
  end,
  buffer = 0
})

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

M = {}

function M.custom_lsp_attach(client, bufnr)
  -- Enable completion triggered by <c-x><c-o>
  vim.api.nvim_buf_set_option(bufnr, 'omnifunc', 'v:lua.vim.lsp.omnifunc')

  -- Mappings.
  -- See `:help vim.lsp.*` for documentation on any of the below functions
  local bufopts = { noremap = true, silent = true, buffer = bufnr }
  vim.keymap.set('n', 'gD', vim.lsp.buf.declaration, bufopts)
  vim.keymap.set('n', 'gd', vim.lsp.buf.definition, bufopts)
  vim.keymap.set('n', 'K', vim.lsp.buf.hover, bufopts)
  vim.keymap.set('n', 'gi', vim.lsp.buf.implementation, bufopts)
  vim.keymap.set('n', 'gk', vim.lsp.buf.signature_help, bufopts)
  vim.keymap.set('n', '<space>wa', vim.lsp.buf.add_workspace_folder, bufopts)
  vim.keymap.set('n', '<space>wr', vim.lsp.buf.remove_workspace_folder, bufopts)
  vim.keymap.set('n', '<space>wl', function()
    print(vim.inspect(vim.lsp.buf.list_workspace_folders()))
  end, bufopts)
  vim.keymap.set('n', '<space>rn', vim.lsp.buf.rename, bufopts)
  vim.keymap.set('n', '<space>ca', vim.lsp.buf.code_action, bufopts)
  vim.keymap.set('n', 'gr', function() require('fzf-lua').lsp_references() end, bufopts)
  vim.keymap.set('n', 'gt', function() require('fzf-lua').lsp_typedefs() end, bufopts)
  vim.keymap.set('n', 'gs', function() require('fzf-lua').lsp_document_symbols() end, bufopts)
  vim.keymap.set('n', '<leader>f', function() vim.lsp.buf.format { async = true } end, bufopts)

  local wk = require('which-key')
  -- Don't show on the cmd line
  local default_options = { silent = true }
  wk.register({
    f  = { '<cmd>lua vim.lsp.buf.format()<cr>', 'Format' },
    gd = { '<cmd>lua vim.lsp.buf.definition()<cr>', 'Goto Definition'},
    gr = { '<cmd>Fzflua lsp_references<cr>', 'LSP References'},
    gt = { '<cmd>Fzflua lsp_typedefs<cr>', 'LSP Type Defs'},
    gs = { '<cmd>Fzflua lsp_document_symbols<cr>', 'LSP Doc Symbols'}
  }, { mode = "n", default_options })

end

return M

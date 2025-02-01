local M = {
  'ibhagwan/fzf-lua',
  -- optional for icon support
  dependencies = {
    'nvim-tree/nvim-web-devicons'
  },
  config = function()
    require('fzf-lua').setup({
      lsp = {
        symbols = {
          symbol_style = 2
        },
      }
    })
  end
}

return M

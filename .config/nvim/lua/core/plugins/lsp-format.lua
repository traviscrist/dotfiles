local M = {
  'lukas-reineke/lsp-format.nvim',
  config = function()
    require('lsp-format').setup({
      kt = {
        exclude = { 'kotlin_language_server' }
      }
    })
  end
}

return M

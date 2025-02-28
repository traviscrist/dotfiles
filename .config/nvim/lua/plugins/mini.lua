return {
  'echasnovski/mini.nvim',
  version = '*',
  config = function()
    require('mini.starter').setup({})
    require('mini.surround').setup({})
    require('mini.pairs').setup({})
  end
}

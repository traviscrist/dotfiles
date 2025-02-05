return {
  'echasnovski/mini.nvim',
  version = '*',
  config = function()
    require('mini.sessions').setup({
      autowrite = true,
    })
    require('mini.starter').setup({})
    require('mini.surround').setup({})
  end
}

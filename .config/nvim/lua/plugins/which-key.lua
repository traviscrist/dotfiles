local M = {
  'folke/which-key.nvim',
  config = function()
    require('which-key').setup({
      preset = 'helix'
    })
  end
}

return M

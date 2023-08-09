local M = {
  "shellRaining/hlchunk.nvim",
  event = { "UIEnter" },
  config = function()
    require("hlchunk").setup()
  end
}

return M

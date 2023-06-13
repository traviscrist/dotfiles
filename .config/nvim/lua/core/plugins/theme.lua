local settings = require("core.settings")

if settings.theme == "nightfox" then
  return {
    "EdenEast/nightfox.nvim",
    config = function()
      require("core.plugins.themes.nightfox")
    end,
  }
elseif settings.theme == "tundra" then
  return {
    "sam4llis/nvim-tundra",
    config = function()
      require("core.plugins.themes.tundra")
    end,
  }
elseif settings.theme == "mariana" then
  return {
    "kaiuri/nvim-juliana",
    config = function()
      require("core.plugins.themes.mariana")
    end,
  }
elseif settings.theme == "oceanicnext" then
  return {
    "mhartington/oceanic-next",
    config = function()
      require("core.plugins.themes.oceanicnext")
    end,
  }
elseif settings.theme == "everforest" then
  return {
    "sainnhe/everforest",
    config = function()
      require("core.plugins.themes.everforest")
    end,
  }
elseif settings.theme == "everforest-lua" then
  return {
    "neanias/everforest-nvim",
    config = function()
      require("core.plugins.themes.everforest-lua")
    end,
  }
end


return {
  "neanias/everforest-nvim",
  version = false,
  lazy = false,
  priority = 1000, -- make sure to load this before all the other start plugins
  -- Optional; default configuration will be used if setup isn't called.
  config = function()
    require("everforest").setup({
      -- Controls the "hardness" of the background. Options are "soft", "medium" or "hard".
      -- Default is "medium".
      background = "soft",
      -- How much of the background should be transparent. Options are 0, 1 or 2.
      -- Default is 0.
      --
      -- 2 will have more UI components be transparent (e.g. status line
      -- background).
      transparent_background_level = 2,
      -- Whether italics should be used for keywords, builtin types and more.
      italics = false,
      -- Disable italic fonts for comments. Comments are in italics by default, set
      -- this to `true` to make them _not_ italic!
      disable_italic_comments = false,

      -- LSP Saga Diagnostic Issues
      -- diagnostic.border_follow = false
      -- setup must be called before loading
      vim.cmd([[colorscheme everforest]])
    })
  end,
}
--

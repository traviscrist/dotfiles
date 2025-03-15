local M = {
  'folke/snacks.nvim',
  priority = 1000,
  lazy = false,
  opts = {
    notifier = { enabled = true },
    explorer = {
      enabled = true,
      replace_netrw = true,
    },
    picker = {
      layout = {
        preset = "ivy_split"
      },
      sources = {
        explorer = {
          jump = { close = true },
          layout = {
            layout = { position = "right" },
          },
        },
      },
      enabled = true,
    }
  },
  keys = {
    -- Find
    { "<leader>o", function() Snacks.explorer.reveal() end,     desc = "Show File" },
    { "<leader>b", function() Snacks.picker.buffers() end,      desc = "Buffers" },
    { "<leader>f", function() Snacks.picker.files() end,        desc = "Find Files" },
    { "<leader>e", function() Snacks.picker.git_files() end,    desc = "Find Git Files" },
    { "<leader>r", function() Snacks.picker.recent() end,       desc = "Recent" },
    -- Search
    { "<leader>a", function() Snacks.picker.grep_word() end,    desc = "Visual selection or word", mode = { "n", "x" } },
    { "<leader>x", function() Snacks.picker.grep_buffers() end, desc = "Grep Open Buffers" },
    { "<leader>s", function() Snacks.picker.grep() end,         desc = "Grep Project" },
  },
}

return M

local M = {
  'folke/snacks.nvim',
  opts = {
    notifier = { enabled = true },
    picker = {
      enabled = true,
    }
  },
  keys = {
    -- Find
    { "<leader>b",  function() Snacks.picker.buffers() end,   desc = "Buffers" },
    { "<leader>f",  function() Snacks.picker.files() end,     desc = "Find Files" },
    { "<leader>e",  function() Snacks.picker.git_files() end, desc = "Find Git Files" },
    { "<leader>r",  function() Snacks.picker.recent() end,    desc = "Recent" },
    -- Grep
    { "<leader>a",  function() Snacks.picker.grep_word() end, desc = "Visual selection or word", mode = { "n", "x" } },
    -- Search
    { "<leader>s", function() Snacks.picker.registers() end, desc = "Registers" },
  }
}

return M

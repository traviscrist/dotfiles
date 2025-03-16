local M = {
  'folke/snacks.nvim',
  priority = 1000,
  lazy = false,
  opts = {
    bigfile = { enabled = true },
    quickfile = { enabled = true },
    notifier = {
      enabled = true,
      timeout = 3000,
    },
    dashboard = {
      enabled = true,
      formats = {
        key = function(item)
          return { { "[", hl = "special" }, { item.key, hl = "key" }, { "]", hl = "special" } }
        end,
      },
      sections = {
        { icon = " ", title = "Sessions", padding = 1 },
        { section = "projects", padding = 1 },
        { icon = " ", title = "MRU", padding = 1 },
        { section = "recent_files", limit = 8, padding = 1 },
        { icon = " ", title = "MRU ", file = vim.fn.fnamemodify(".", ":~"), padding = 1 },
        { section = "recent_files", cwd = true, limit = 8, padding = 1 },
        { title = "Bookmarks", padding = 1 },
        { icon = " ", section = "keys" },
      },
    },
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
    },
    scroll = { enabled = true },
  },
  keys = {
    -- top pickers
    { "<leader><space>", function() Snacks.picker.smart() end,        desc = "Smart Find Files" },
    { "<leader>b",       function() Snacks.picker.buffers() end,      desc = "Buffers" },
    { "<leader>o",       function() Snacks.explorer.reveal() end,     desc = "Show File" },
    { "<leader>f",       function() Snacks.picker.files() end,        desc = "Find Files" },
    { "<leader>e",       function() Snacks.picker.git_files() end,    desc = "Find Git Files" },
    { "<leader>r",       function() Snacks.picker.recent() end,       desc = "Recent" },
    { "<leader>a",       function() Snacks.picker.grep_word() end,    desc = "Visual selection or word", mode = { "n", "x" } },
    { "<leader>l",       function() Snacks.picker.qflist() end,       desc = "Quickfix List" },
    -- explorer
    { "<leader>t",       function() Snacks.explorer() end,            desc = "File Explorer" },
    -- buffers
    { "<leader>cb",      function() Snacks.bufdelete.delete() end,    desc = "Delete Buffer" },
    { "<leader>cab",     function() Snacks.bufdelete.other() end,     desc = "Delete All Other Bufers" },
    -- git
    { "<leader>y",       function() Snacks.git.blame_line() end,      desc = "Open Blame" },
    { "<leader>yy",      function() Snacks.gitbrowse() end,           desc = "Git Browse" },
    { "<leader>yd",      function() Snacks.picker.git_diff() end,     desc = "Git Diff (Hunks)" },
    { "<leader>yb",      function() Snacks.picker.git_branches() end, desc = "Git Branches" },
    { "<leader>ys",      function() Snacks.picker.git_status() end,   desc = "Git Status" },
    { "<leader>yS",      function() Snacks.picker.git_stash() end,    desc = "Git Stash" },
    { "<leader>yl",      function() Snacks.picker.git_log() end,      desc = "Git Log" },
    { "<leader>yL",      function() Snacks.picker.git_log_line() end, desc = "Git Log Line" },
    { "<leader>yg",      function() Snacks.lazygit() end,             desc = "Lazygit" },
    -- grep
    { "<leader>x",       function() Snacks.picker.grep_buffers() end, desc = "Grep Open Buffers" },
    { "<leader>s",       function() Snacks.picker.grep() end,         desc = "Grep Project" },
    -- other
    { "<leader>.",       function() Snacks.scratch() end,             desc = "Toggle Scratch Buffer" },

  },
  init = function()
    vim.api.nvim_create_autocmd("User", {
      pattern = "VeryLazy",
      callback = function()
        -- Setup some globals for debugging (lazy-loaded)
        _G.dd = function(...)
          Snacks.debug.inspect(...)
        end
        _G.bt = function()
          Snacks.debug.backtrace()
        end
        vim.print = _G.dd -- Override print to use snacks for `:=` command

        Snacks.toggle({
          id = "git_blame",
          name = "Git Blame",
          get = function()
            return require("gitsigns.config").config.current_line_blame
          end,
          set = function(state)
            require("gitsigns").toggle_current_line_blame(state)
          end,
        }):map("tt")
        Snacks.toggle({
          id = "diffview_toggle",
          name = 'Git Diff',
          get = function()
            return require("diffview.lib").get_current_view() ~= nil
          end,
          set = function(state)
            vim.cmd("Diffview" .. (state and "Open" or "Close"))
          end,
        }):map("<leader>d")
        Snacks.toggle({
          id = "number",
          name = " Line Numbers",
          get = function()
            return vim.wo.number
          end,
          set = function(state)
            if state then
              vim.wo.relativenumber = false
            end
            vim.wo.number = state
          end,
        }):map("<leader>nn")

        Snacks.toggle.option("relativenumber", { name = "Relative Number" }):map("<leader>nN")
        Snacks.toggle.option("spell", { name = "Spelling" }):map("<leader>us")
        Snacks.toggle.option("wrap", { name = "Wrap" }):map("<leader>uw")
        Snacks.toggle.option("background", { off = "light", on = "dark", name = "Dark Background" }):map("<leader>ub")
        Snacks.toggle.diagnostics({ name = " Diagnostics" }):map("<leader>tD")
      end,
    })
  end,
}

return M

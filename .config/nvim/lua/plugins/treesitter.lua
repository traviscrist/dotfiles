local function setup_textobjects()
  require("nvim-treesitter-textobjects").setup({
    select = { lookahead = true },
  })

  local select = require("nvim-treesitter-textobjects.select")
  local textobjects = {
    af = "@function.outer",
    ["if"] = "@function.inner",
    ac = "@class.outer",
    ic = "@class.inner",
    al = "@loop.outer",
    il = "@loop.inner",
    ib = "@block.inner",
    ab = "@block.outer",
    ir = "@parameter.inner",
    ar = "@parameter.outer",
  }

  local function select_textobject(query)
    return function()
      select.select_textobject(query, "textobjects")
    end
  end

  for key, query in pairs(textobjects) do
    vim.keymap.set({ "x", "o" }, key, select_textobject(query), { desc = "Select " .. query })
  end
end

local function start_treesitter(args)
  if not pcall(vim.treesitter.start, args.buf) then
    return
  end

  vim.bo[args.buf].indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"

  local options = { buffer = args.buf, silent = true }
  vim.keymap.set({ "n", "x" }, "<CR>", function()
    vim.treesitter.select("parent")
  end, vim.tbl_extend("force", options, { desc = "Select parent node" }))
  vim.keymap.set("x", "<Tab>", function()
    vim.treesitter.select("parent")
  end, vim.tbl_extend("force", options, { desc = "Select parent node" }))
  vim.keymap.set("x", "<S-Tab>", function()
    vim.treesitter.select("child")
  end, vim.tbl_extend("force", options, { desc = "Select child node" }))
end

return {
  "nvim-treesitter/nvim-treesitter",
  branch = "main",
  lazy = false,
  build = ":TSUpdate",
  dependencies = {
    {
      "nvim-treesitter/nvim-treesitter-textobjects",
      branch = "main",
      config = setup_textobjects,
    },
    "RRethy/nvim-treesitter-endwise",
    "windwp/nvim-ts-autotag",
  },
  config = function()
    local settings = require("config.settings")
    local treesitter = require("nvim-treesitter")

    treesitter.setup()
    treesitter.install(settings.treesitter_langs)
    require("nvim-ts-autotag").setup()

    vim.api.nvim_create_autocmd("FileType", {
      group = vim.api.nvim_create_augroup("treesitter-start", { clear = true }),
      callback = start_treesitter,
    })
  end,
}

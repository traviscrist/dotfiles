local M = {}

M.theme = "nightfox"
-- treesitter parsers to be installed
-- one of "all", "maintained" (parsers with maintainers), or a list of languages
M.langs = {
  "bash",
  "css",
  "dockerfile",
  "gitignore",
  "graphql",
  "html",
  "java",
  "javascript",
  "jq",
  "json",
  "kotlin",
  "lua",
  "markdown",
  "markdown_inline",
  "python",
  "regex",
  "sql",
  "swift",
  "terraform",
  "typescript",
  "toml",
  "vim",
  "yaml",
}

M.lang_servers = {
  -- LSP
  "bashls",
  "cssls",
  "cssmodules_ls",
  "dockerls",
  "docker_compose_language_service",
  "eslint",
  "html",
  "jsonls",
  "jdtls",
  "lua_ls",
  "marksman",
  "pyright",
  "sqls",
  "taplo",
  "terraformls",
  "tsserver", -- Alternative vtsls
}

M.mason_tools = {
  -- Formatter
  "black",
  "prettier",
  "stylua",
  -- Linter
  "eslint_d",
  "shellcheck",
  "tflint",
  "vale",
  "yamllint",
  -- DAP
  -- "debugpy",
}

return M

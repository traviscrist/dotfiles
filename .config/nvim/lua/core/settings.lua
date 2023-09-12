local M = {}

M.theme = "everforest-lua"
-- treesitter parsers to be installed
-- one of "all", "maintained" (parsers with maintainers), or a list of languages
M.treessitter_langs = {
  "bash",
  "css",
  "dockerfile",
  "gitignore",
  "graphql",
  "hcl",
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
  "rust",
  "sql",
  "swift",
  "terraform",
  "typescript",
  "tsx",
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
  "kotlin_language_server",
  "lua_ls",
  "marksman",
  "pyright",
  "sqlls",
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
  "ktlint",
  "shellcheck",
  "tflint",
  "vale",
  "yamllint",
  -- DAP
  -- "debugpy",
}

return M

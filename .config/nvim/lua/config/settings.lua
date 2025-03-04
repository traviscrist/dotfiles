local M = {}

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
  bashls = {
    settings = {}  -- Server-specific settings
  },
  cssls = {
    settings = {}
  },
  cssmodules_ls = {
    settings = {}
  },
  dockerls = {
    settings = {}
  },
  docker_compose_language_service = {
    settings = {}
  },
  eslint = {
    settings = {}
  },
  html = {
    settings = {}
  },
  jsonls = {
    settings = {
      json = {
        schemas = {},
        validate = { enable = true }
      }
    }
  },
  jdtls = {
    settings = {}
  },
  kotlin_language_server = {
    settings = {}
  },
  lua_ls = {
    settings = {
      Lua = {
        runtime = {
          version = 'LuaJIT'
        },
        diagnostics = {
          globals = { 'vim' }
        },
        workspace = {
          library = vim.api.nvim_get_runtime_file("", true),
          checkThirdParty = false
        },
        telemetry = {
          enable = false
        }
      }
    }
  },
  marksman = {
    settings = {}
  },
  pyright = {
    settings = {
      python = {
        analysis = {
          typeCheckingMode = "basic",
          autoSearchPaths = true,
          useLibraryCodeForTypes = true
        }
      }
    }
  },
  sqlls = {
    settings = {}
  },
  taplo = {
    settings = {}
  },
  terraformls = {
    settings = {}
  },
  vtsls = {
    settings = {
      typescript = {
        preferences = {
          importModuleSpecifier = "relative"
        }
      },
      javascript = {
        preferences = {
          importModuleSpecifier = "relative"
        }
      }
    }
  }
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

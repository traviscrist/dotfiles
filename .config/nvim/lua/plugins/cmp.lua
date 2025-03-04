local settings = require('config.settings')

local M = {
  "iguanacucumber/magazine.nvim",
  name = "nvim-cmp",
  dependencies = {
    { "iguanacucumber/mag-nvim-lsp", name = "cmp-nvim-lsp", opts = {} },
    { "iguanacucumber/mag-nvim-lua", name = "cmp-nvim-lua" },
    { "iguanacucumber/mag-buffer",   name = "cmp-buffer" },
    { "iguanacucumber/mag-cmdline",  name = "cmp-cmdline" },
    "hrsh7th/cmp-nvim-lsp-signature-help",
    "L3MON4D3/LuaSnip",
    "saadparwaiz1/cmp_luasnip"
  },
  config = function()
    local cmp = require("cmp")
    local lspkind = require("lspkind") -- Copilot
    local has_words_before = function()
      if vim.api.nvim_buf_get_option(0, "buftype") == "prompt" then return false end
      local line, col = unpack(vim.api.nvim_win_get_cursor(0))
      return col ~= 0 and vim.api.nvim_buf_get_text(0, line - 1, 0, line - 1, col, {})[1]:match("^%s*$") == nil
    end
    cmp.setup({
      formatting = {
        format = lspkind.cmp_format({
          maxwidth = 50,
          mode = "symbol"
        }),
      },
      snippet = {
        expand = function(args)
          require('luasnip').lsp_expand(args.body) -- For `luasnip` users.
        end,
      },
      window = {
        completion = cmp.config.window.bordered(),
        documentation = cmp.config.window.bordered(),
      },
      mapping = {
        ['<C-b>'] = cmp.mapping.scroll_docs(-4),
        ['<C-f>'] = cmp.mapping.scroll_docs(4),
        ["<C-Space>"] = cmp.mapping.complete(),
        ["<C-e>"] = cmp.mapping.close(),
        ['<CR>'] = cmp.mapping.confirm({ select = false }),  -- Accept currently selected item. Set `select` to `false` to only confirm explicitly selected items.
        ["<Tab>"] = cmp.mapping(function(fallback)
          if cmp.visible() and has_words_before() then
            cmp.select_next_item({ behavior = cmp.SelectBehavior.Select })
          else
            fallback()
          end
        end, { "i", "s" }),
        ["<S-Tab>"] = cmp.mapping(function()
          if cmp.visible() then
            cmp.select_prev_item()
          end
        end, { "i", "s" }),
      },
      sources = {
        -- Other Sources
        { name = "nvim_lsp",                priority = 2 },
        { name = "nvim_lsp_signature_help", priority = 2 },
        -- Copilot Source
        -- { name = "copilot", priority = 3 },
        -- { name = "buffer",                  keyword_length = 5 },
        -- { name = "path" },
        -- { name = "rg",                      keyword_length = 5 },
      },
      sorting = {
        priority_weight = 2,
        comparators = {
          -- require("copilot_cmp.comparators").prioritize,
          -- Below is the default comparitor list and order for nvim-cmp
          cmp.config.compare.offset,
          -- cmp.config.compare.scopes, --this is commented in nvim-cmp too
          cmp.config.compare.exact,
          cmp.config.compare.score,
          cmp.config.compare.kind,
          cmp.config.compare.sort_text,
          cmp.config.compare.length,
          cmp.config.compare.order,
        },
      },
    })

    -- Use buffer source for `/` and `?` (if you enabled `native_menu`, this won't work anymore).
    cmp.setup.cmdline({ '/', '?' }, {
      mapping = cmp.mapping.preset.cmdline(),
      sources = {
        { name = 'buffer' }
      }
    })

    -- Use cmdline & path source for ':' (if you enabled `native_menu`, this won't work anymore).
    cmp.setup.cmdline(":", {
      mapping = cmp.mapping.preset.cmdline(),
      sources = cmp.config.sources({
        { name = "path" },
      }, {
        { name = "cmdline" },
      }),
    })

    -- Setup lspconfig.
    local capabilities = require('cmp_nvim_lsp').default_capabilities()

    -- Default LSP settings
    local default_settings = {
      -- Add your default settings here that should apply to all servers
      diagnostics = {
        enable = true,
        signs = true,
        underline = true,
        update_in_insert = false,
        severity_sort = true,
      }
    }

    vim.lsp.handlers["textDocument/hover"] = vim.lsp.with(vim.lsp.handlers.hover, {
      border = "rounded",
    })

    local function on_attach(client, bufnr)
      -- Enable completion triggered by <c-x><c-o>
      -- require('lsp-format').on_attach(client, bufrn)
      vim.api.nvim_buf_set_option(bufnr, 'omnifunc', 'v:lua.vim.lsp.omnifunc')
    end

    -- Base configuration for all language servers
    local base_config = {
      on_attach = on_attach,
      capabilities = capabilities,
      settings = default_settings
    }

    for server_name, server_settings in pairs(settings.lang_servers) do
      -- Merge server-specific settings with base config
      local config = vim.tbl_deep_extend("force", base_config, {
        settings = server_settings.settings or {}
      })

      require('lspconfig')[server_name].setup(config)
    end
  end,
}

return M

local function setup_persistent_undo()
    local undodir = os.getenv("HOME") .. "/.vimrepository/undodir"
    local handle = io.open(undodir)
    if handle then
        handle:close()
    else
        os.execute("mkdir -p " .. undodir)
    end
    vim.opt.undodir = undodir
    vim.opt.undofile = true
end

local function setup_swap_file_dir()
    local swapdir = os.getenv("HOME") .. "/.swp"
    local handle = io.open(swapdir)
    if handle then
        handle:close()
    else
        os.execute("mkdir -p " .. swapdir)
    end
    vim.opt.directory = swapdir
end


setup_persistent_undo()
setup_swap_file_dir()

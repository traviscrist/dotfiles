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

setup_persistent_undo()

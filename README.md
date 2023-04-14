My mac osx setup

Uses [https://yadm.io/](https://yadm.io/)
GitHub: [https://github.com/TheLocehiliosan/yadm](https://github.com/TheLocehiliosan/yadm)

# Setup

1. Enable Filevault Under Security and Privacy
1. Install [Homebrew](https://brew.sh/)
1. `brew install yadm`
1. Add your [git ssh key](https://help.github.com/en/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
1. `yadm clone` <url> <- This repository
1. `yadm status`
1. Login to App Store
1. `yadm bootstrap`
1. Manually set caps lock to be escape
1. Manually set the dark mode

# How do get defaults
```
defaults read > a
defaults read > b
diff a b
```

# Install Apps Manually
* pandabar
* docker app from https://www.docker.com/products/docker-desktop

# Switch Terraform Version
```sh
tfenv install 0.11.15
tfenv use 0.11.15
```

# Dev Frameworks to Try:
* https://fresh.deno.dev/

# Misc Dev Resources:
* https://webhook.site/ - Webhook testing
* https://toolbox.googleapps.com/apps/dig/ - Domain Lookup
* https://github.com/lirantal/is-website-vulnerable - Check if website has security vulnerabilities cmd line

# Cool Apps to look into
* https://www.hammerspoon.org/go/
* https://github.com/lapce/lapce

# Inspired from
* https://github.com/ada-lovecraft/dotbot
* https://github.com/pndurette/mac-setup
* https://github.com/jaywcjlove/awesome-mac
* https://github.com/donnemartin/dev-setup
* https://github.com/ptb/mac-setup
* https://github.com/mathiasbynens/dotfiles/issues/5#issuecomment-4117712
* https://github.com/mathiasbynens/dotfiles
* https://github.com/mathiasbynens/dotfiles/blob/master/.macos
* https://github.com/paulirish/dotfiles

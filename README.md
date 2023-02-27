My mac osx setup

Uses [https://yadm.io/](https://yadm.io/)
GitHub: [https://github.com/TheLocehiliosan/yadm](https://github.com/TheLocehiliosan/yadm)

# Setup

1. Enable Filevault Under Security and Privacy
1. Enable Firmware password by booting into recovery mode with CMD + R and enabling it
1. Install [Homebrew](https://brew.sh/)
1. `brew install yadm`
1. Add your [git ssh key](https://help.github.com/en/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
1. `yadm clone` <url> <- This repository 1. `yadm status`
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

# Set Shell Default
## Zsh Shell
`chsh -s /bin/zsh`

# Install Apps Manually
* pandabar
* docker app from https://www.docker.com/products/docker-desktop

# Make commits to submodules
1. submodule commit there and push
1. then commit in yadm then push

# Google Cloud
```sh
gcloud auth login
gcloud auth application-default login
gcloud auth configure-docker
gcloud components install gke-gcloud-auth-plugin
```

## For each project:
```sh
gcloud config set project PROJECT_ID
gcloud container clusters get-credentials --zone=[ZONE] primary
```

## Mysql
```sh
gcloud components install cloud_sql_proxy
cloud_sql_proxy -instances=INSTANCE_HERE:prisma=tcp:3306
mysqlsh -u proxyuser --host 127.0.0.1
```

# Switch Terraform Version
```sh
tfenv install 0.11.15
tfenv use 0.11.15
```

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

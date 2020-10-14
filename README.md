My mac osx setup

Uses [https://yadm.io/](https://yadm.io/)
GitHub: [https://github.com/TheLocehiliosan/yadm](https://github.com/TheLocehiliosan/yadm)

# Setup

1. Enable Filevault Under Security and Privacy
1. Enable Firmware password by booting into recovery mode with CMD + R and enabling it
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

# Set Shell Default
## Zsh Shell
`chsh -s /bin/zsh`

# Install Apps Manually
* pandabar
* bettertouchtools
* docker app from https://www.docker.com/products/docker-desktop
* Linear

# Chome Extensions
* ZenHub
* Refined Github

# Make commits to submodules
1. submodule commit there and push
1. then commit in yadm then push

# Google Cloud
```sh
gcloud auth application-default login
gcloud auth configure-docker
```

## For each project:
```sh
gcloud config set project PROJECT_ID
gcloud container clusters get-credentials primary
```

## Mysql
```sh
gcloud components install cloud_sql_proxy
cloud_sql_proxy -instances=INSTANCE_HERE:prisma=tcp:3306
mysqlsh -u proxyuser --host 127.0.0.1
```

# Ambassador Edgectl
```sh
sudo curl -fL https://metriton.datawire.io/downloads/darwin/edgectl -o /usr/local/bin/edgectl && sudo chmod a+x /usr/local/bin/edgectl
edgectl login --namespace=default URL -c CLUSTER
```

# Helm
```sh
curl -L https://git.io/get_helm.sh | bash -s -- --version v2.14.1
```
Using Brew
```sh
git clone https://github.com/Homebrew/homebrew-core.git
git log master -- Formula/kubernetes-helm.rb
brew install https://github.com/Homebrew/homebrew-core/raw/a55a387ba0/Formula/kubernetes-helm.rb
```

# Homebrew
## Pin Terraform Version
From: https://blog.gruntwork.io/installing-multiple-versions-of-terraform-with-homebrew-899f6d124ff9
```sh
git clone git@github.com:Homebrew/homebrew-core.git
cd homebrew-core
git log master -- Formula/terraform.rb
git checkout 3507fce2ba1f36cc371fe888fd093bf5aa79981d
cd Formula
brew unpin terraform
brew unlink terraform
brew install terraform.rb

# Switching
brew switch terraform 0.11.13

# Pinnig
brew pin terraform
brew info terraform
```

# Misc Dev Resources: 
* https://webhook.site/ - Webhook testing
* https://toolbox.googleapps.com/apps/dig/ - Domain Lookup
* https://github.com/lirantal/is-website-vulnerable - Check if website has security vulnerabilities cmd line

# Cool Apps to look into
* https://www.hammerspoon.org/go/
* https://github.com/XVimProject/XVim2

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

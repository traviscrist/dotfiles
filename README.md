My mac osx setup

Uses [https://yadm.io/](https://yadm.io/)
GitHub: [https://github.com/TheLocehiliosan/yadm](https://github.com/TheLocehiliosan/yadm)

# Setup

1. Install [Homebrew](https://brew.sh/)
1. `brew install yadm`
1. `yadm clone` <url> <- This repository
1. `yadm status`
1. Login to App Store
1.`yadm bootstrap` 
1. Add your [git ssh key](https://help.github.com/en/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
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

## Fish Shell
`chsh -s /usr/local/bin/fish`

# Install Apps Manually
* pandabar
* bettertouchtools
* quickres on your own
* docker app from https://www.docker.com/products/docker-desktop

# Make commits to submodules
1. submodule commit there and push
1. then commit in yadm then push

# Google Cloud
```
gcloud auth application-default login
gcloud auth configure-docker
```

# For each project:
```
gcloud config set project PROJECT_ID
gcloud container clusters get-credentials primary
```

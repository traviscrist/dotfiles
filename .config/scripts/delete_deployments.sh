#!/bin/bash

OWNER="OWNER"
REPO="REPO"

for ((i = 0; i < 1000; i+=1)); do
  # Get the list of deployments
  echo $1
  deployments=$(gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    /repos/$OWNER/$REPO/deployments?per_page=100&page=1)

  # Parse deployment IDs from the response
  deployment_ids=$(echo $deployments | jq -r '.[].id')

  # Loop through deployment IDs in batches of 50 and delete them
  for id in $deployment_ids; do
      url="/repos/$OWNER/$REPO/deployments/$id"
      echo $url
      gh api \
        --method DELETE \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "$url"
  done
done

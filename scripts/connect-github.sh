#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <github-repository-url>"
  echo "Example: $0 git@github.com:your-username/refugee-wallet.git"
  exit 1
fi

REPO_URL="$1"
CURRENT_BRANCH="$(git branch --show-current)"

if [[ -z "$CURRENT_BRANCH" ]]; then
  echo "Error: unable to determine current git branch."
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
  echo "Updated existing 'origin' remote to: $REPO_URL"
else
  git remote add origin "$REPO_URL"
  echo "Added 'origin' remote: $REPO_URL"
fi

echo "Pushing branch '$CURRENT_BRANCH' to GitHub..."
git push -u origin "$CURRENT_BRANCH"

echo "Done. Your project is now connected to: $REPO_URL"

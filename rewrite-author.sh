#!/usr/bin/env bash

echo "Rewriting git history authors..."

git filter-branch --force --env-filter '
if [ "$GIT_AUTHOR_EMAIL" = "eduardogonzalezmejia9@gmail.com" ] || [ "$GIT_AUTHOR_NAME" = "Eduardo González" ]; then
  export GIT_AUTHOR_NAME="lucho0904uni"
  export GIT_AUTHOR_EMAIL="lucho0904uni@users.noreply.github.com"
fi
if [ "$GIT_COMMITTER_EMAIL" = "eduardogonzalezmejia9@gmail.com" ] || [ "$GIT_COMMITTER_NAME" = "Eduardo González" ]; then
  export GIT_COMMITTER_NAME="lucho0904uni"
  export GIT_COMMITTER_EMAIL="lucho0904uni@users.noreply.github.com"
fi
' -- --all

echo "Done rewriting history."
 # bail on fail
set -e

packageVersion=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

branch=$(git branch --show-current)
version="${packageVersion}-${branch}"

# fetch latest tags from upstream
git fetch --tags

# update changelog
git changelog --tag v$version --no-merges

# add changelog in case it's the first run
git add History.md

# tag, commit and push
git release v$version
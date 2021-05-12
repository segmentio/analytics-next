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

# tag, commit and push
git release v$version
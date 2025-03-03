const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
/**
 * Given a package name and a relative path to the dist folder -- it reads all the files and runs them through the jsdelivr cache purge API.
 * Will abort the API unless the current commit has a tag with the package name on it.
 */
const purgeJsDelivrCache = async (packageName, relativePath) => {
  console.log(`\n\n`)
  const gitRoot = path.resolve(__dirname, '..')
  const fullPath = path.join(gitRoot, relativePath)

  if (!fs.existsSync(fullPath)) {
    console.error(`Path does not exist: ${fullPath}`)
    process.exit(1)
  }

  // Only run this script if the given package has been published
  // Check if the current git HEAD has a tag containing the package name
  // This is a bit odd versus just having the cache purge on a prepublish hooks, but publish hooks like post/prepublish had been flaky on CI with changesets when I was setting this up.
  if (process.env.CI) {
    console.log('Searching for matching tag for package...')
    try {
      const tags = execSync('git tag --contains HEAD', {
        cwd: gitRoot,
      }).toString()

      const hasMatchingTag = tags.includes(packageName)
      if (!hasMatchingTag) {
        console.log(
          `No tags containing the package name "${packageName}" found on the current git HEAD. Aborting cache purge.`
        )
        process.exit(0)
      }
    } catch (error) {
      console.error(`Failed to check git tags: ${error.message}`)
      process.exit(1)
    }
  }

  const files = fs.readdirSync(fullPath)

  console.log(
    `Purging files for ${packageName}: ${JSON.stringify(files, null, 2)}`
  )
  for (const file of files) {
    const filePath = path.join(relativePath, file)
    console.log(`Purging cache: ${file}...`)
    const url = `https://purge.jsdelivr.net/npm/${packageName}/${filePath}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        console.error(`Failed to purge: ${url} - Status: ${response.status}`)
      }
    } catch (error) {
      console.error(`Failed to purge: ${url} - Error: ${error.message}`)
    }
  }
  console.log(`\nPurge of ${packageName} finished.`)
}

const [packageName, relativePath] = process.argv.slice(2)

if (!packageName || !relativePath) {
  console.error(
    'Usage: node purge-jsdeliver-cache-signals.js <package-name> <relative-path>'
  )
  process.exit(1)
}

purgeJsDelivrCache(packageName, relativePath)

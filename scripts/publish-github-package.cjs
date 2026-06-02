#!/usr/bin/env node
/**
 * Publishes the browser package to GitHub Packages under the @be-growth scope,
 * WITHOUT renaming the package in the monorepo source.
 *
 * Why publish-time rename?
 *  - GitHub Packages requires the package scope to match the repo owner (be-growth).
 *  - Renaming @segment/analytics-next in-place would break ~13 source imports
 *    (consent, test-helpers, playgrounds) and create perpetual conflicts when
 *    syncing with the upstream `segmentio/analytics-next`.
 *  - So we keep the source as `@segment/analytics-next` and only rewrite the
 *    manifest (name / repository / publishConfig) for the published artifact,
 *    restoring the pristine file right after.
 *
 * The browser package already exports `conversionCollectorPlugin`, so the
 * published package ships the UTUA conversion-collector plugin.
 *
 * Runtime deps (@segment/analytics-core@1.8.3, generic-utils@1.2.0, ...) are
 * pinned exact versions resolved from the PUBLIC npm registry and are unchanged
 * from upstream — nothing to rewrite there.
 *
 * Usage:
 *   yarn workspace @segment/analytics-next build   # produce dist/
 *   GITHUB_PACKAGES_TOKEN=ghp_xxx node scripts/publish-github-package.cjs
 *
 * Env:
 *   GITHUB_PACKAGES_TOKEN  (required) PAT with `write:packages` + `repo`, SSO-authorized for be-growth
 *   BG_PACKAGE_VERSION     (optional) override the published version (e.g. 1.84.0-bg.1)
 *   DRY_RUN=1              (optional) run `npm publish --dry-run` (no upload)
 */
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const PUBLISHED_NAME = '@be-growth/analytics-next'
const REGISTRY = 'https://npm.pkg.github.com'
const REPO_URL = 'git+https://github.com/be-growth/analytics-next.git'

const pkgDir = path.join(__dirname, '..', 'packages', 'browser')
const pkgJsonPath = path.join(pkgDir, 'package.json')
const distDir = path.join(pkgDir, 'dist')

const dryRun = process.env.DRY_RUN === '1'

if (!dryRun && !process.env.GITHUB_PACKAGES_TOKEN) {
  console.error(
    'ERROR: GITHUB_PACKAGES_TOKEN is not set.\n' +
      'Create a PAT with `write:packages` + `repo` scopes, authorize it for the be-growth org (SSO),\n' +
      'then run: GITHUB_PACKAGES_TOKEN=ghp_xxx node scripts/publish-github-package.cjs'
  )
  process.exit(1)
}

if (!fs.existsSync(distDir)) {
  console.error(
    'ERROR: packages/browser/dist not found.\n' +
      'Build first: yarn workspace @segment/analytics-next build'
  )
  process.exit(1)
}

const original = fs.readFileSync(pkgJsonPath, 'utf8')
const pkg = JSON.parse(original)

const published = {
  ...pkg,
  name: PUBLISHED_NAME,
  version: process.env.BG_PACKAGE_VERSION || pkg.version,
  repository: { type: 'git', url: REPO_URL, directory: 'packages/browser' },
  publishConfig: { ...(pkg.publishConfig || {}), registry: REGISTRY, access: 'restricted' },
}
// devDependencies reference internal workspace packages (@internal/*, workspace:*)
// that npm cannot resolve and consumers never need — drop them from the artifact.
delete published.devDependencies

try {
  fs.writeFileSync(pkgJsonPath, JSON.stringify(published, null, 2) + '\n')
  console.log(`Publishing ${published.name}@${published.version} -> ${REGISTRY}`)
  // --ignore-scripts: dist is already built; avoid triggering yarn-based lifecycle hooks.
  const cmd = `npm publish --registry ${REGISTRY} --ignore-scripts${dryRun ? ' --dry-run' : ''}`
  execSync(cmd, { cwd: pkgDir, stdio: 'inherit' })
  console.log(dryRun ? 'Dry-run OK.' : 'Published.')
} finally {
  fs.writeFileSync(pkgJsonPath, original)
  console.log('Restored packages/browser/package.json to its pristine @segment/analytics-next form.')
}

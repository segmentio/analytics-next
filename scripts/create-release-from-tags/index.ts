import spawn from '@npmcli/promise-spawn'
import getPackages from 'get-monorepo-packages'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { exists } from '../utils/exists'
import { yarnWorkspaceRootSync } from '@node-kit/yarn-workspace-root'

export type Config = {
  isDryRun: boolean
  tags: Tag[]
}

export type Tag = {
  name: string
  versionNumber: string
  raw: string
}

/**
 *
 * @returns list of tags
 * @example ["@segment/analytics-core@1.0.0", "@segment/analytics-next@2.1.1"]
 */
export const getCurrentGitTags = async (): Promise<Tag[]> => {
  const { stdout, stderr, code } = await spawn('git', [
    'tag',
    '--points-at',
    'HEAD',
  ])
  if (code !== 0) {
    throw new Error(stderr.toString())
  }

  return parseRawTags(stdout.toString())
}

export const getConfig = async (): Promise<Config> => {
  const { DRY_RUN, TAGS } = process.env
  const isDryRun = Boolean(DRY_RUN)
  const tags = TAGS ? parseRawTags(TAGS) : await getCurrentGitTags()

  if (!tags.length) {
    throw new Error('No git tags found.')
  }
  return {
    isDryRun,
    tags,
  }
}

const getRelativeWorkspaceRoot = (): string => {
  const root = yarnWorkspaceRootSync()
  if (!root) {
    throw new Error('cannot get workspace root.')
  }
  return path.relative(process.cwd(), root)
}

const packages = getPackages(getRelativeWorkspaceRoot())

export const getChangelogPath = (packageName: string): string | undefined => {
  const result = packages.find((p) => p.package.name.includes(packageName))
  if (!result)
    throw new Error(`could not find package with name: ${packageName}.`)

  let changelogPath = undefined
  for (const fileName of ['CHANGELOG.MD', 'CHANGELOG.md']) {
    if (changelogPath) break
    const myPath = path.join(result.location, fileName)
    const pathExists = fs.existsSync(myPath)
    if (pathExists) {
      changelogPath = myPath
    }
  }

  if (changelogPath) {
    return changelogPath
  } else {
    console.log(`could not find changelog path for ${result.location}`)
  }
}

/**
 *
 * @returns list of tags
 * @example ["@segment/analytics-core@1.0.0", "@segment/analytics-next@2.1.1"]
 */
const createGithubRelease = async (
  tag: string,
  releaseNotes?: string,
  assets: string[] = []
): Promise<void> => {
  const { stderr, code } = await spawn('gh', [
    'release',
    'create',
    tag,
    ...assets,
    '--title',
    tag,
    '--notes',
    releaseNotes || '',
  ])
  if (code !== 0) {
    throw new Error(stderr.toString())
  }
}

/**
 * `npm pack`s the package for the given tag into a scratch dir and returns
 * the resulting tarball's path, so it can be attached to the GitHub release
 * as a downloadable artifact. Returns undefined (and logs) rather than
 * throwing - a packing failure shouldn't block the release itself.
 */
const packTarball = async (tag: Tag): Promise<string | undefined> => {
  const result = packages.find((p) => p.package.name === tag.name)
  if (!result) {
    console.log(
      `could not find package location for ${tag.name}, skipping tarball.`
    )
    return undefined
  }

  const destDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), 'release-artifacts-')
  )

  const { stderr, code } = await spawn(
    'npm',
    ['pack', '--pack-destination', destDir],
    { cwd: result.location }
  )
  if (code !== 0) {
    console.log(`npm pack failed for ${tag.name}, skipping tarball: ${stderr}`)
    return undefined
  }

  const [tarballName] = await fs.promises.readdir(destDir)
  return tarballName ? path.join(destDir, tarballName) : undefined
}

/**
 * For @segment/analytics-next specifically, also attach the built browser
 * UMD/standalone bundles - the CDN-loadable <script> artifacts, distinct
 * from the npm tarball, that consumers commonly want a direct download link
 * for pinned to a specific tagged release.
 */
const getBrowserBundleAssets = (tag: Tag): string[] => {
  if (tag.name !== '@segment/analytics-next') return []

  const result = packages.find((p) => p.package.name === tag.name)
  if (!result) return []

  const umdDir = path.join(result.location, 'dist/umd')
  const wanted = [
    'index.js',
    'index.js.gz',
    'standalone.js',
    'standalone.js.gz',
  ]
  return wanted.map((f) => path.join(umdDir, f)).filter((f) => fs.existsSync(f))
}

/**
 *
 * @param rawTag - ex. "@segment/analytics-foo@1.99.0"
 */
const extractPartsFromTag = (rawTag: string): Tag | undefined => {
  const [name, version] = rawTag.split(/@(\d.*)/)
  if (!name || !version) return undefined
  return {
    name,
    versionNumber: version?.replace('\n', '') as string,
    raw: rawTag,
  }
}

/**
 *
 * @param rawTags - string delimited list of tags (e.g. `@segment/analytics-next@2.1.1 @segment/analytics-core@1.0.0`)
 */
export const parseRawTags = (rawTags: string): Tag[] => {
  return rawTags
    .trim()
    .replace(new RegExp('\\n', 'g'), ' ') // remove any newLine characters
    .split(' ')
    .map(extractPartsFromTag)
    .filter(exists)
}

/**
 *
 * @returns the release notes that correspond to a given tag.
 */
export const parseReleaseNotes = (
  changelogText: string,
  versionNumber: string
): string => {
  const h2tag = /(##\s.*\d.*)/gi
  let begin: number
  let end: number

  changelogText.split('\n').forEach((line, idx) => {
    if (begin && end) return
    if (line.includes(versionNumber)) {
      begin = idx + 1
    } else if (begin && h2tag.test(line)) {
      end = idx - 1
    }
  })

  const result = changelogText.split('\n').filter((_, idx) => {
    return idx >= begin && idx <= (end ?? Infinity)
  })
  return result.join('\n')
}

const getReleaseNotes = (tag: Tag): string | undefined => {
  const { name, versionNumber } = tag
  const changelogPath = getChangelogPath(name)
  if (!changelogPath) {
    console.log(`no changelog path for ${name}... skipping.`)
    return
  }
  const changelogText = fs.readFileSync(changelogPath, { encoding: 'utf8' })
  const releaseNotes = parseReleaseNotes(changelogText, versionNumber)
  if (!releaseNotes) {
    console.log(
      `Could not find release notes for tags ${tag.raw} in ${changelogPath}.`
    )
  }
  return releaseNotes
}

const createGithubReleaseFromTag = async (
  tag: Tag,
  { dryRun = false } = {}
): Promise<void> => {
  const notes = getReleaseNotes(tag)
  if (notes) {
    console.log(
      `\n ---> Outputting release titled: ${tag.raw} with notes: \n ${notes}`
    )
  }

  if (dryRun) {
    console.log(`--> Dry run: ${tag.raw} not released.`)
    return undefined
  }

  const tarball = await packTarball(tag)
  const assets = [...(tarball ? [tarball] : []), ...getBrowserBundleAssets(tag)]

  await createGithubRelease(tag.raw, notes, assets)
  return undefined
}

export const createReleaseFromTags = async (config: Config) => {
  console.log('Processing tags:', config.tags, '\n')

  for (const tag of config.tags) {
    console.log(`\n ---> Creating release for tag: ${tag.raw}`)
    await createGithubReleaseFromTag(tag, { dryRun: config.isDryRun })
  }
}

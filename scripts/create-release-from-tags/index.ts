import spawn from '@npmcli/promise-spawn'
import getPackages from 'get-monorepo-packages'
import path from 'path'
import fs from 'fs'
import { exists } from '../utils/exists'

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
    '--column',
  ])
  if (code !== 0) {
    throw new Error(stderr.toString())
  }

  return parseRawTags(stdout.toString())
}

export const getConfig = async ({
  DRY_RUN,
  TAGS,
}: NodeJS.ProcessEnv): Promise<Config> => {
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

const getChangelogPath = (packageName: string): string | undefined => {
  const result = getPackages('.').find((p) =>
    p.package.name.includes(packageName)
  )
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
  releaseNotes?: string
): Promise<void> => {
  const { stderr, code } = await spawn('gh', [
    'release',
    'create',
    tag,
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
  return rawTags.trim().split(' ').map(extractPartsFromTag).filter(exists)
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

  await createGithubRelease(tag.raw, notes)
  return undefined
}

export const createReleaseFromTags = async (config: Config) => {
  console.log('Processing tags:', config.tags, '\n')

  for (const tag of config.tags) {
    await createGithubReleaseFromTag(tag, { dryRun: config.isDryRun })
  }
}

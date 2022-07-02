#!/usr/bin/env ./node_modules/.bin/ts-node --script-mode --transpile-only --files
/* eslint-disable no-undef */

const ex = require('execa')
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs-extra')
const path = require('path')
const mime = require('mime')
const logUpdate = require('log-update')

const PROD_BRANCH_NAME = 'master'

const shouldReleaseToProduction = process.env.RELEASE

const bucket =
  process.env.NODE_ENV == 'production'
    ? process.env.PROD_BUCKET
    : process.env.STAGE_BUCKET
if (!bucket) throw new Error('Missing one of PROD_BUCKET or STAGE_BUCKET')

const shadowBucket =
  process.env.NODE_ENV == 'production'
    ? process.env.PROD_SHADOW
    : process.env.STAGE_SHADOW

const cloudfrontCanonicalUserId =
  process.env.NODE_ENV == 'production'
    ? process.env.PROD_CDN_OAI
    : process.env.STAGE_CDN_OAI
  if (!cloudfrontCanonicalUserId) throw new Error('Missing one of PROD_CDN_OAI or STAGE_CDN_OAI')

const customDomainCanonicalUserId =
  process.env.NODE_ENV == 'production'
    ? process.env.PROD_CUSTOM_DOMAIN_OAI
    : process.env.STAGE_CUSTOM_DOMAIN_OAI
if (!customDomainCanonicalUserId) throw new Error('Missing one of PROD_CUSTOM_DOMAIN_OAI or STAGE_CUSTOM_DOMAIN_OAI')

const accessKeyId = process.env.AWS_ACCESS_KEY_ID
if (!accessKeyId) throw new Error('Missing AWS_ACCESS_KEY_ID')
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
if (!secretAccessKey) throw new Error('Missing AWS_SECRET_ACCESS_KEY')
const sessionToken = process.env.AWS_SESSION_TOKEN
if (!sessionToken) throw new Error('Missing AWS_SESSION_TOKEN')


const getBranch = async () =>
  (await ex('git', ['branch', '--show-current'])).stdout

const getSha = async () =>
  (await ex('git', ['rev-parse', '--short', 'HEAD'])).stdout

async function getFiles(dir) {
  const subdirs = await fs.readdir(dir)
  const files = await Promise.all(
    subdirs.map(async (subdir) => {
      const res = path.resolve(dir, subdir)
      return (await fs.stat(res)).isDirectory() ? getFiles(res) : [res]
    })
  )
  return files.reduce((a, f) => a.concat(f, [])).map((f) => f.split(dir)[1])
}

async function upload(meta) {
  const s3 = new S3({
    accessKeyId,
    secretAccessKey,
    sessionToken,
    region: 'us-west-2',
  })

  const files = await getFiles(path.join(process.cwd(), './dist/umd'))
  const total = files.length
  let progress = 0

  const uploads = files.map(async (f) => {
    const filePath = path.join(process.cwd(), './dist/umd', f)

    const options = {
      Bucket: bucket,
      Key: path.join(`analytics-next`, meta.branch, meta.sha, f),
      Body: await fs.readFile(filePath),
      GrantRead: cloudfrontCanonicalUserId,
      ContentType:
        mime.getType(filePath.replace('.gz', '')) || 'application/javascript',
    }

    const shadowOptions = {
      ...options,
      Bucket: shadowBucket,
    }

    if (meta.branch !== PROD_BRANCH_NAME) {
      options.CacheControl = 'public,max-age=31536000,immutable'
    }

    if (filePath.includes('.gz')) {
      options.ContentEncoding = 'gzip'
    }

    const output = await s3.putObject(options).promise()
    await s3.putObject(shadowOptions).promise() // upload build to shadow pipeline bucket as well

    // put latest version with only 5 minutes caching
    await s3
      .putObject({
        ...options,
        CacheControl: 'public,max-age=300,immutable',
        Key: path.join(`analytics-next`, meta.branch, 'latest', f),
      })
      .promise()

    // put chunks in a separate path. Regardless of branch, version, etc.
    // there are immutable scripts that will be loaded by webpack in runtime
    if (filePath.includes('bundle')) {
      options.GrantRead = `${cloudfrontCanonicalUserId},${customDomainCanonicalUserId}`
      await s3
        .putObject({
          ...options,
          Key: path.join(`analytics-next`, 'bundles', f),
          CacheControl: 'public,max-age=31536000,immutable',
        })
        .promise()
    }

    progress++
    logUpdate(`Progress: ${progress}/${total}`)

    return output
  })

  await Promise.all(uploads)
}

async function release() {
  console.log('Compiling Bundles')

  const sha = await getSha()
  let branch = process.env.BUILDKITE_BRANCH || (await getBranch())


  if (branch === PROD_BRANCH_NAME && !shouldReleaseToProduction) {
    // prevent accidental release via force push to master
    throw new Error(`Release aborted. If you want to release to ${PROD_BRANCH_NAME} branch, set RELEASE=true.`)
  }


  // this means we're deploying production
  // from a release branch
  if (shouldReleaseToProduction) {
    branch = PROD_BRANCH_NAME
  }

  const meta = {
    sha,
    branch: `br/${branch}`,
  }

  console.table(meta)

  console.log('Uploading Assets')
  await upload(meta)
}

release().catch((err) => {
  console.error(err)
  process.exit(1)
})

#!/usr/bin/env node
/* eslint-disable no-undef */

const pkg = require('../package.json')
const ex = require('execa')
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs-extra')
const path = require('path')
const mime = require('mime')
const logUpdate = require('log-update')

const bucket =
  process.env.NODE_ENV == 'production'
    ? 'segment-ajs-renderer-compiled-production'
    : 'segment-ajs-renderer-compiled-qa'
const cloudfrontCanonicalUserId =
  process.env.NODE_ENV == 'production'
    ? 'id=***REMOVED***' // cdn.segment.com OAI
    : 'id=***REMOVED***' // cdn.segment.build OAI
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const sessionToken = process.env.AWS_SESSION_TOKEN

const getBranch = async () =>
  (await ex('git', ['rev-parse', '--abbrev-ref', 'HEAD'])).stdout

const getSha = async () =>
  process.env.BUILDKITE_BRANCH ||
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

    if (meta.branch !== 'master') {
      options.CacheControl = 'public,max-age=31536000,immutable'
    }

    if (filePath.includes('.gz')) {
      options.ContentEncoding = 'gzip'
    }

    const output = await s3.putObject(options).promise()

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
  const branch = await getBranch()
  const version = pkg.version

  const meta = {
    sha,
    branch: `br/${branch}`,
    version,
  }

  console.table(meta)

  console.log('Uploading Assets')
  await upload(meta)
}

release().catch((err) => {
  console.error(err)
  process.exit(1)
})

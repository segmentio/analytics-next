#!/usr/bin/env ./node_modules/.bin/ts-node --script-mode --transpile-only --files

import pkg from '../package.json'
import ex from 'execa'
import S3 from 'aws-sdk/clients/s3'
import fs from 'fs-extra'
import path from 'path'
import mime from 'mime'
import logUpdate from 'log-update'

interface Meta {
  branch: string
  sha: string
  version: string
}

const bucket =
  process.env.NODE_ENV == 'production'
    ? 'segment-ajs-renderer-compiled-production'
    : 'segment-ajs-renderer-compiled-qa'
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const sessionToken = process.env.AWS_SESSION_TOKEN

const env = {
  NODE_ENV: 'production',
}

const getBranch = async (): Promise<string> =>
  (await ex('git', ['branch', '--show-current'])).stdout
const getSha = async (): Promise<string> =>
  (await ex('git', ['rev-parse', '--short', 'HEAD'])).stdout

async function getFiles(dir: string): Promise<string[]> {
  const subdirs = await fs.readdir(dir)
  const files = await Promise.all(
    subdirs.map(async (subdir) => {
      const res = path.resolve(dir, subdir)
      return (await fs.stat(res)).isDirectory() ? getFiles(res) : [res]
    })
  )
  return files.reduce((a, f) => a.concat(f, [])).map((f) => f.split(dir)[1])
}

async function upload(meta: Meta): Promise<void> {
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

    const options: S3.PutObjectRequest = {
      Bucket: bucket,
      Key: path.join(`analytics-next`, meta.branch, meta.sha, f),
      Body: await fs.readFile(filePath),
      ACL: 'public-read',
      ContentType:
        mime.getType(filePath.replace('.gz', '')) ?? 'application/javascript',
    }

    if (meta.branch !== 'master') {
      options.CacheControl = 'public,max-age=31536000,immutable'
    }

    if (filePath.includes('.gz')) {
      options.ContentEncoding = 'gzip'
    }

    const output = await s3.putObject(options).promise()

    // put latest version without caching
    await s3
      .putObject({
        ...options,
        CacheControl: undefined,
        Key: path.join(`analytics-next`, meta.branch, 'latest', f),
      })
      .promise()

    progress++
    logUpdate(`Progress: ${progress}/${total}`)

    return output
  })

  await Promise.all(uploads)
}

async function release(): Promise<void> {
  console.log('Compiling Bundles')

  await ex('make', ['build'], {
    env,
  })

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

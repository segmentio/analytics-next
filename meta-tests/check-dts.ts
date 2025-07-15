import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import getPackages from 'get-monorepo-packages'

/**
 * This script is for extra typechecking of the built .d.ts files in {package_name}/dist/types/*.
 * Occassionally, "internal" .dts errors can result from oddities in typescript configuration,
 * such as: https://github.com/segmentio/analytics-next/issues/748.
 * These errors would only surface for customers with `skipLibCheck` enabled.
 */
const execa = promisify(exec)

// Get public packages programmatically
const packages = getPackages(path.join(__dirname, '..'))
const publicPackageNames = [
  '@segment/analytics-next',
  '@segment/analytics-core',
  '@segment/analytics-node',
]

const allPublicPackageDirNames = packages
  .filter((pkg) => publicPackageNames.includes(pkg.package.name))
  .map((pkg) => path.relative('packages', pkg.location))
  .sort() as readonly string[]

type PackageDirName = typeof allPublicPackageDirNames[number]

class Tsc {
  // e.g. packages/browser
  configPathDir: string
  // e.g. packages/browser/tsconfig.json
  configPath: string

  private jsonConfig: string = JSON.stringify({
    extends: '../../tsconfig.json',
    include: ['./dist/types/**/*'],
    compilerOptions: {
      noEmit: true,
      skipLibCheck: false,
    },
  })

  constructor(packageDirName: PackageDirName) {
    this.configPathDir = path.join('packages', packageDirName)
    this.configPath = path.join(this.configPathDir, 'tmp.tsconfig.json')
  }

  typecheck() {
    this.writeConfig()
    const cmd = [
      `node_modules/.bin/tsc`,
      `--project ${this.configPath}`,
      `--pretty false`,
    ].join(' ')
    return execa(cmd).finally(() => this.deleteConfig())
  }

  private deleteConfig() {
    fs.unlinkSync(this.configPath)
  }

  private writeConfig() {
    fs.writeFileSync(this.configPath, this.jsonConfig, {
      encoding: 'utf8',
    })
  }
}

const checkDts = async (packageDirName: PackageDirName): Promise<void> => {
  const tsc = new Tsc(packageDirName)
  try {
    await tsc.typecheck()
  } catch (err: any) {
    if (!err || typeof err !== 'object' || !err.stdout) {
      throw err
    }
    const errors: string[] = err.stdout.toString().split('\n')
    const relevantErrors = errors.filter((msg) =>
      msg.includes(tsc.configPathDir)
    )
    if (relevantErrors.length) {
      throw relevantErrors
    }
  }
}

const main = async () => {
  let hasError = false
  for (const packageDirName of allPublicPackageDirNames) {
    try {
      console.log(`Checking "${packageDirName}/dist/types"...`)
      await checkDts(packageDirName)
    } catch (err) {
      console.error(err)
      hasError = true
    }
  }
  if (hasError) {
    console.log('\n Tests failed.')
    process.exit(1)
  } else {
    console.log('\n Tests passed.')
    process.exit(0)
  }
}

void main()

import type { FullConfig } from '@playwright/test'
import { execSync } from 'child_process'
import { envConfig } from './src/helpers/env-config'

export default function globalSetup(_cfg: FullConfig) {
  console.log(`Executing playwright.global-setup.ts...\n`)
  console.log(`Using envConfig: ${JSON.stringify(envConfig, undefined, 2)}\n`)
  if (process.env.SKIP_BUILD !== 'true') {
    console.log(`Executing yarn build:\n`)
    execSync('yarn build', { stdio: 'inherit' })
  }
  console.log('Finished global setup. Should start running tests.\n')
}

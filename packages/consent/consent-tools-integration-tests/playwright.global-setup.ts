import type { FullConfig } from '@playwright/test'
import { execSync } from 'child_process'

export default function globalSetup(_cfg: FullConfig) {
  console.log('Executing global setup...')
  execSync('yarn build', { stdio: 'inherit' })
  console.log('Finished global setup.')
}

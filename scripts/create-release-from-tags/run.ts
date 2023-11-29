import { createReleaseFromTags, getConfig } from '.'

async function run() {
  const config = await getConfig()
  return createReleaseFromTags(config)
}

void run()

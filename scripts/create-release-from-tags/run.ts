import { createReleaseFromTags, getConfig } from '.'

async function run() {
  const config = await getConfig(process.env)
  return createReleaseFromTags(config)
}

void run()

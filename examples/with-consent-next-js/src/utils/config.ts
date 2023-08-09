import { default as nextGetConfig } from 'next/config'
import { oneTrust } from '@segment/analytics-consent-wrapper-onetrust'

const ENV_FILE_PATH = './env.local.js'

type OneTrustOptions = Parameters<typeof oneTrust>[1]

interface Config {
  /**
   * Your Segment write key.
   */
  writeKey: string
  /**
   * OneTrust API Key - this is the data-domain-script value from the OneTrust script tag.
   * @example
   * <script
        src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
        type="text/javascript"
        data-domain-script="80ca7b5c-e72f-4bd0-972a-b74d052a0820-test" <--- THIS
      />
   */
  oneTrustApiKey: string
  oneTrustOptions: NonNullable<OneTrustOptions>
}

export const getConfig = (): Config => {
  const {
    publicRuntimeConfig: {
      WRITEKEY: writeKey,
      ONETRUST_API_KEY,
      ONETRUST_OPTIONS,
    },
  } = nextGetConfig()
  const validationErrorMessages = []
  if (!writeKey) {
    validationErrorMessages.push(
      `WRITEKEY=XXX" is required in ${ENV_FILE_PATH}`
    )
  }
  const oneTrustApiKey = ONETRUST_API_KEY
  if (!oneTrustApiKey) {
    validationErrorMessages.push('"ONETRUST_API_KEY=XXX" is required.')
  }
  if (validationErrorMessages.length) {
    throw new Error(`${validationErrorMessages.join('\n')}. Please see README.`)
  }

  return {
    oneTrustApiKey,
    writeKey,
    oneTrustOptions: {
      integrationCategoryMappings:
        ONETRUST_OPTIONS?.integrationCategoryMappings,
    },
  }
}

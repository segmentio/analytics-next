import { default as nextGetConfig } from 'next/config'
import { oneTrust } from '@segment/analytics-consent-wrapper-onetrust'
import { getWriteKeyFromQueryString } from './write-key'
import { getOneTrustApiKeyFromQueryString } from './onetrust-api-key'

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
      '"writekey=XXX" is a required query parameter.'
    )
  }
  const oneTrustApiKey = ONETRUST_API_KEY || getOneTrustApiKeyFromQueryString()
  if (!oneTrustApiKey) {
    validationErrorMessages.push(
      '"onetrust_api_key=XXX" is a required query parameter (same as `data-domain-script` value from the OneTrust script tag).'
    )
  }
  if (validationErrorMessages.length) {
    throw new Error(validationErrorMessages.join('\n'))
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

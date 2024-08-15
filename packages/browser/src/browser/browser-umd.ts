import { getCDN, setGlobalCDNUrl } from '../lib/parse-cdn'
import { setVersionType } from '../lib/version-type'

if (process.env.IS_WEBPACK_BUILD) {
  if (process.env.ASSET_PATH) {
    // @ts-ignore
    __webpack_public_path__ = process.env.ASSET_PATH
  } else {
    const cdn = getCDN()
    setGlobalCDNUrl(cdn)

    // @ts-ignore
    __webpack_public_path__ = cdn + '/analytics-next/bundles/'
  }
}

setVersionType('web')

export * from '.'

// shared
export { SignalsRuntime } from './shared/signals-runtime'

// web
export * from './web/web-signals-types'
export * from './shared/shared-types'
export * as WebRuntimeConstants from './web/web-constants'

// mobile
export * as Mobile from './mobile/mobile-signals-types'
export * as MobileRuntimeConstants from './mobile/mobile-constants'

// @ts-ignore - hacky AF
import { getWebRuntimeString as getWebStr } from '../../dist/global/get-runtime-string.web'
export const getWebRuntimeString: () => string = getWebStr

// @ts-ignore - hacky AF
import { getMobileRuntimeString as getMobStr } from '../../dist/global/get-runtime-string.mobile'
export const getMobileRuntimeString: () => string = getMobStr

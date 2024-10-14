// This file is only for people who plan on installing this package in their npm projects, like us.

// shared
export { SignalsRuntime } from './shared/signals-runtime'

// web
export * from './web/web-signals-types'
export * from './shared/shared-types'
export * as WebRuntimeConstants from './web/web-constants'
export * from './web/get-runtime-code.generated'

// mobile -- we don't need this *yet*, but some day?
export * as Mobile from './mobile/mobile-signals-types'
export * as MobileRuntimeConstants from './mobile/mobile-constants'
export { getRuntimeCode as getMobileRuntimeCode } from './mobile/get-runtime-code.generated'

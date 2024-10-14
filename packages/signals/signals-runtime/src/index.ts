// This file is only for people who plan on installing this package in their npm projects, like us.

// shared
export { SignalsRuntime } from './shared/signals-runtime'

// web
export * from './web/web-signals-types'
export * from './shared/shared-types'
export * as WebRuntimeConstants from './web/web-constants'
export { RuntimeString as WebRuntimeCode } from './web/get-runtime-string'

// mobile -- we don't need this *yet*, but some day?
export * as Mobile from './mobile/mobile-signals-types'
export * as MobileRuntimeConstants from './mobile/mobile-constants'
export { RuntimeString as MobileRuntimeString } from './mobile/get-runtime-string'

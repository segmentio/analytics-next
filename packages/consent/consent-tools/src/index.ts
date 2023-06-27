/**
 * This is the public API for this package.
 * We avoid using splat (*) exports so that we can control what is exposed.
 */
export { createWrapper } from './domain/create-wrapper'
export { resolveWhen } from './utils'

export type {
  Wrapper,
  CreateWrapper,
  CreateWrapperSettings,
  IntegrationCategoryMappings,
  Categories,
  AnyAnalytics,
} from './types'

export * from './index.common'

// export Analytics as both a named export and a default export (for backwards-compat. reasons)
import { Analytics } from './index.common'
export default Analytics

import { dependencyInjection } from './lib/dependency-injection'
import { NullTokenManager } from './lib/null-token-manager'
dependencyInjection.registerDependency('TokenManager', NullTokenManager)

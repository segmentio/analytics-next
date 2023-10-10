export * from './index.common'

// export Analytics as both a named export and a default export (for backwards-compat. reasons)
import { Analytics } from './index.common'
export default Analytics

import { dependencyInjection } from './lib/dependency-injection'
import { TokenManagerNoOp } from './lib/token-manager-noop'
dependencyInjection.registerDependency('TokenManager', TokenManagerNoOp)

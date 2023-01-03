import { Traits, CoreExtraContext } from '@segment/analytics-core'

class TestClass {
  name = 'hello'
  toJSON() {
    return this.name
  }
}

export default {
  'Traits test': () => {
    let traits: Traits = {}

    // should accept a class
    traits = new TestClass()
    // should be nullable
    traits = { address: null }
    // should accept aribtrary properties
    traits = { address: {}, foo: 123 }
    // should fail with type conflicts
    // @ts-expect-error
    traits = { address: 'hello' }
  },

  'CoreExtraContext test': () => {
    // should accept a class
    let ec: CoreExtraContext = {}
    ec = new TestClass()
    // should error if type conflict
    // @ts-expect-error
    ec = { page: { path: {} } }
  },
}

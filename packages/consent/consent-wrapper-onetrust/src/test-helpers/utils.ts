/**
 * Allows mocked objects to throw a helpful error message when a method is called without an implementation
 */
export const addDebugMockImplementation = (mock: jest.Mocked<any>) => {
  Object.entries(mock).forEach(([method, value]) => {
    // automatically add mock implementation for debugging purposes
    if (typeof value === 'function') {
      mock[method] = mock[method].mockImplementation((...args: any[]) => {
        throw new Error(`Not Implemented: ${method}(${JSON.stringify(args)})`)
      })
    }
  })
}

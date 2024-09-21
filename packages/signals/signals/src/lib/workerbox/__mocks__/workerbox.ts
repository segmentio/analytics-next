// __mocks__/workerbox.ts

const mockRun = jest.fn(() => Promise.resolve('mocked response'))
const mockDestroy = jest.fn()

const createWorkerBox = jest.fn(() => {
  return Promise.resolve({
    run: mockRun,
    destroy: mockDestroy,
  })
})

export { createWorkerBox }

import { detectRuntime, RuntimeEnv } from '../env'

const ogProcess = { ...process.env }
afterEach(() => {
  process.env = ogProcess
  // @ts-ignore
  delete globalThis.window
})
describe(detectRuntime, () => {
  it('should return web worker if correct env', () => {
    // @ts-ignore
    // eslint-disable-next-line
    delete process.env
    // @ts-ignore
    globalThis.WorkerGlobalScope = {}
    // @ts-ignore
    globalThis.importScripts = () => {}
    expect(detectRuntime()).toEqual<RuntimeEnv>({
      type: 'web-worker',
    })
  })
  it('should return browser if correct env', () => {
    // @ts-ignore
    // eslint-disable-next-line
    delete process.env
    // @ts-ignore
    globalThis.window = {}
    expect(detectRuntime()).toEqual<RuntimeEnv>({
      type: 'browser',
    })
  })
  it('should return node if correct env', () => {
    // @ts-ignore
    // eslint-disable-next-line
    process = { versions: { node: '123' }, env: {} }
    expect(detectRuntime()).toEqual<RuntimeEnv>({
      type: 'node',
      version: '123',
    })
  })
})

import { detectRuntime, RuntimeEnv } from '../env'

const ogProcessEnv = { ...process.env }

afterEach(() => {
  process.env = ogProcessEnv
  // @ts-ignore
  delete globalThis.window

  // @ts-ignore
  delete globalThis.WebSocketPair

  // @ts-ignore
  delete globalThis.EdgeRuntime

  // @ts-ignore
  delete globalThis.window
})
describe(detectRuntime, () => {
  it('should return node since these tests run in node', () => {
    expect(detectRuntime()).toEqual<RuntimeEnv>('node')
  })

  it('should return browser if correct env', () => {
    // @ts-ignore
    // eslint-disable-next-line
    delete process.env
    // @ts-ignore
    globalThis.window = {}
    expect(detectRuntime()).toEqual<RuntimeEnv>('browser')
  })

  it('should return cloudflare worker if correct env', () => {
    // @ts-ignore
    // eslint-disable-next-line
    delete process.env
    // @ts-ignore
    globalThis.WebSocketPair = {}
    expect(detectRuntime()).toEqual<RuntimeEnv>('cloudflare-worker')
  })

  it('should return edgeruntime if correct env', () => {
    // @ts-ignore
    // eslint-disable-next-line
    delete process.env

    // @ts-ignore
    globalThis.EdgeRuntime = 'vercel'

    expect(detectRuntime()).toEqual<RuntimeEnv>('vercel-edge')
  })
})

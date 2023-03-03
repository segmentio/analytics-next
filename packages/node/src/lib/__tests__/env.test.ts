import { detectRuntime, RuntimeEnv } from '../env'

const ogProcess = { ...process.env }
afterEach(() => {
  process.env = ogProcess
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
  it('should return web worker if correct env', () => {
    // @ts-ignore
    // eslint-disable-next-line
    delete process.env
    // @ts-ignore
    globalThis.WorkerGlobalScope = {}
    // @ts-ignore
    globalThis.importScripts = () => {}

    expect(detectRuntime()).toEqual<RuntimeEnv>('web-worker')
  })
  it('should return browser if correct env', () => {
    // @ts-ignore
    // eslint-disable-next-line
    delete process.env
    // @ts-ignore
    globalThis.window = {}
    expect(detectRuntime()).toEqual<RuntimeEnv>('browser')
  })
  it('should return node if correct env', () => {
    // @ts-ignore
    // eslint-disable-next-line
    process = { env: {} }
    expect(detectRuntime()).toEqual<RuntimeEnv>('node')
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

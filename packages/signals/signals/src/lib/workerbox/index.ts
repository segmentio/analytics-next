/**
 * Copyright 2022 Mark Wylde
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

import { default as worker } from './worker.generated'

/**
 * Whenever this script is modified, we need to run `yarn workerbox` and commit the result.
 * This happens via lint-staged (on commit that modifiies the enclosing folder), so it should be automatic.
 */
export function stringToScope(
  object: any,
  addCallback: Function,
  runCallback: Function
) {
  return decodeArg(JSON.parse(object), addCallback, runCallback)
}

// This was modified nd adopted from ^ workerbox library - https://github.com/markwylde/workerbox/blob/master/lib/index.js
// note: we could write our own, but this has always been tested and works
// the types are bad because the workerbox library src is not typed, and I did not want to spend a lot of time writing types.
const generateUniqueId = () => {
  // @ts-ignore
  globalThis.workerboxIncrementor = (globalThis.workerboxIncrementor || 0) + 1
  return (
    // @ts-ignore
    globalThis.workerboxIncrementor +
    '_' +
    Array(20)
      .fill(
        '!@#$%^&*()_+-=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      )
      .map((x) => {
        return x[Math.floor(Math.random() * x.length)]
      })
      .join('')
  )
}

export function createCallbackStore() {
  const store: Record<string, Function> = {}
  const add = (fn: Function) => {
    const id = generateUniqueId()
    store[id] = fn
    return id
  }
  const get = (id: string) => {
    return store[id]
  }
  return {
    store,
    add,
    get,
  }
}

function encodeArg(
  arg: any,
  addCallback: Function,
  runCallback: Function
): ['callback' | 'object' | 'literal' | 'array', any] {
  if (typeof arg === 'function') {
    return ['callback', addCallback(arg)]
  } else if (arg instanceof Array) {
    return [
      'array',
      arg.map((arg2) => encodeArg(arg2, addCallback, runCallback)),
    ]
  } else if (typeof arg === 'object' && arg !== null) {
    const newArg: Record<string, any> = {}
    for (const key in arg) {
      newArg[key] = encodeArg(arg[key], addCallback, runCallback)
    }
    return ['object', newArg]
  } else {
    return ['literal', arg]
  }
}

export function scopeToString(
  scope: any,
  addCallback: Function,
  runCallback: Function
) {
  return JSON.stringify(encodeArg(scope || {}, addCallback, runCallback))
}

export function argsToString(
  args: any,
  addCallback: Function,
  runCallback: Function
): string {
  return JSON.stringify(encodeArg(args, addCallback, runCallback))
}

function decodeArg(arg: any, addCallback: Function, runCallback: Function) {
  if (arg[0] === 'callback') {
    return (...args: any[]) =>
      runCallback(arg[1], argsToString(args, addCallback, runCallback))
  } else if (arg[0] === 'array') {
    return arg[1].map((arg: any) => decodeArg(arg, addCallback, runCallback))
  } else if (arg[0] === 'object') {
    const decodedArg: Record<string, any> = {}
    for (const key in arg[1]) {
      decodedArg[key] = decodeArg(arg[1][key], addCallback, runCallback)
    }
    return decodedArg
  } else if (arg[0] === 'literal') {
    return arg[1]
  } else {
    throw Error(`Unexpected arg type: ${arg[0]}`)
  }
}

export function stringToArgs(
  args: any,
  addCallback: Function,
  runCallback: Function
) {
  return decodeArg(JSON.parse(args), addCallback, runCallback)
}

const instances = {
  count: 0,
}
export function createWorkerboxInstance(
  url: string | undefined,
  onMessage: MessagePort['onmessage']
) {
  instances.count = instances.count + 1
  const channel = new MessageChannel()
  const iframe = document.createElement('iframe')
  iframe.setAttribute('sandbox', 'allow-scripts')
  iframe.id = `seg-workerbox-${instances.count}`

  // display none is not enough
  iframe.setAttribute(
    'style',
    'position: fixed; height: 0; width: 0; opacity: 0; top: -100px;'
  )
  if (url) {
    iframe.src = url
  } else {
    iframe.srcdoc = worker.toString()
  }
  document.body.appendChild(iframe)
  channel.port1.onmessage = onMessage
  return new Promise<{
    postMessage: (message: any) => void
    destroy: () => void
  }>((resolve) => {
    iframe.addEventListener('load', () => {
      if (!iframe.contentWindow) {
        throw new Error('iframe.contentWindow is null')
      }
      iframe.contentWindow.postMessage('OK', '*', [channel.port2])
      resolve({
        postMessage: (message) => channel.port1.postMessage(message),
        destroy: () => iframe.remove(),
      })
    })
  })
}

export interface WorkerBoxOptions {
  url?: string
}

export interface WorkerBoxAPI {
  run: (code: string, scope: Record<string, any>) => Promise<void>
  destroy: () => void
  opts?: WorkerBoxOptions
}

async function createWorkerBox(
  opts: WorkerBoxOptions = {}
): Promise<WorkerBoxAPI> {
  if (opts.url && opts.url.slice(-1) === '/') {
    opts.url = opts.url.slice(0, -1)
  }

  opts.url = opts.url && new URL(opts.url).href
  const callbacks = createCallbackStore()
  const run = (id: string, args: any) =>
    new Promise((resolve, reject) => {
      instance.postMessage([
        'callback',
        {
          id,
          args,
          resolve: callbacks.add(resolve),
          reject: callbacks.add(reject),
        },
      ])
    })
  const instance = await createWorkerboxInstance(opts.url, async (message) => {
    const [action, { id, args, resolve, reject }] = message.data
    const parsedArgs = stringToArgs(args, callbacks.add, run)
    if (action === 'error') {
      callbacks.get(id)?.(new Error(parsedArgs[0]))
      return
    }
    if (action === 'return') {
      callbacks.get(id)?.(parsedArgs[0])
      return
    }
    const fn = callbacks.get(id)
    if (!fn) {
      return
    }
    try {
      const result = await fn(...parsedArgs)
      instance.postMessage([
        'callback',
        {
          id: resolve,
          args: argsToString([result], callbacks.add, run),
        },
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : error
      instance.postMessage([
        'callback',
        {
          id: reject,
          args: argsToString([message], callbacks.add, run),
        },
      ])
    }
  })
  return {
    run: async (code, originalScope) => {
      return new Promise((resolve, reject) => {
        const id = callbacks.add(resolve)
        const errorId = callbacks.add(reject)
        const scope = scopeToString(originalScope, callbacks.add, run)
        instance.postMessage(['execute', { id, errorId, code, scope }])
      })
    },
    destroy: () => instance.destroy(),
    opts,
  }
}

export { createWorkerBox }

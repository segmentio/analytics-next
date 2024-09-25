import {
  createCallbackStore,
  argsToString,
  stringToScope,
  stringToArgs,
} from './index'
async function scopedEval(context: any, expr: string) {
  const evaluator = Function.apply(null, [
    ...Object.keys(context),
    `return (async function sandbox () {${expr} })()`,
  ])
  return await evaluator.apply(null, [...Object.values(context)])
}

const getStack = (error: Error, slice?: number) => {
  if (!error.stack) {
    return error.message
  }
  const lines: string[] = error.stack.split('\n')
  const parseNumber = (num: string | number) =>
    typeof num === 'string' ? parseInt(num, 10) : num
  const stack = [
    lines[0],
    ...lines
      .filter((line) => line.includes('(eval at scopedEval'))
      .map((line) => {
        const splitted = line.split('(eval at scopedEval (')
        const [, mixedPosition] = line.split('<anonymous>')
        const [, lineNumber, charNumber] = mixedPosition.slice(0, -1).split(':')
        return `${splitted[0]}(<sandbox>:${
          parseNumber(lineNumber) - 3
        }:${charNumber})`
      }),
  ]
    .slice(0, slice)
    .join('\n')
  return stack
}

self.addEventListener('message', (event) => {
  const port = event.ports[0]

  const callbacks = createCallbackStore()
  const run = (id: string, args: any) =>
    new Promise((resolve) => {
      port.postMessage([
        'callback',
        { id, args, resolve: callbacks.add(resolve) },
      ])
    })

  port.onmessage = async (event) => {
    const [action, message] = event.data
    const { id, errorId, code, scope, args, resolve, reject } = message

    if (action === 'execute') {
      const parsedScope = stringToScope(scope, callbacks.add, run)

      try {
        const result = await scopedEval(parsedScope, code)

        port.postMessage([
          'return',
          { id, args: argsToString([result], callbacks.add, run) },
        ])
      } catch (e) {
        const error = e as Error
        try {
          const stack = getStack(error, -1)
          port.postMessage([
            'error',
            {
              id: errorId,
              args: argsToString([stack || error.message], callbacks.add, run),
            },
          ])
        } catch (error2) {
          port.postMessage([
            'error',
            {
              id: errorId,
              args: argsToString([error.message], callbacks.add, run),
            },
          ])
        }
      }
    }

    if (action === 'callback') {
      const parsedArgs = stringToArgs(args, callbacks.add, run)

      const fn = callbacks.get(id)
      if (!fn) {
        return
      }
      try {
        const result = await fn(...parsedArgs)
        port.postMessage([
          'return',
          { id: resolve, args: argsToString([result], callbacks.add, run) },
        ])
      } catch (e) {
        const error = e as Error
        const stack = getStack(error)
        port.postMessage([
          'error',
          {
            id: reject,
            args: argsToString([stack || error.message], callbacks.add, run),
          },
        ])
      }
    }
  }
})

import { ActionDestination } from '../../plugins/remote-loader'
import { Context, ContextCancelation } from '../context'
import { Plugin } from '../plugin'

async function tryOperation(
  op: () => Context | Promise<Context>
): Promise<Context> {
  try {
    return await op()
  } catch (err) {
    return Promise.reject(err)
  }
}

export function attempt(
  ctx: Context,
  plugin: Plugin | ActionDestination
): Promise<Context | ContextCancelation | Error | undefined> {
  const name = 'action' in plugin ? plugin.action.name : plugin.name

  ctx.log('debug', 'plugin', { plugin: name })

  const start = new Date().getTime()

  const hook = plugin[ctx.event.type]
  if (hook === undefined) {
    return Promise.resolve(ctx)
  }

  const newCtx = tryOperation(() => hook.apply(plugin, [ctx]))
    .then((ctx) => {
      const done = new Date().getTime() - start
      ctx.stats.gauge('plugin_time', done, [`plugin:${name}`])
      return ctx
    })
    .catch((err) => {
      if (
        err instanceof ContextCancelation &&
        err.type === 'middleware_cancellation'
      ) {
        throw err
      }

      if (err instanceof ContextCancelation) {
        ctx.log('warn', err.type, {
          plugin: name,
          error: err,
        })

        return err
      }

      ctx.log('error', 'plugin Error', {
        plugin: name,
        error: err,
      })

      ctx.stats.increment('plugin_error', 1, [`plugin:${name}`])
      return err as Error
    })

  return newCtx
}

export function ensure(
  ctx: Context,
  plugin: Plugin
): Promise<Context | undefined> {
  return attempt(ctx, plugin).then((newContext) => {
    if (newContext instanceof Context) {
      return newContext
    }

    ctx.log('debug', 'Context canceled')
    ctx.stats.increment('context_canceled')
    ctx.cancel(newContext)
  })
}

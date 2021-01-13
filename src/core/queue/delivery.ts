import { Context } from '../context'
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

export async function attempt(
  ctx: Context,
  plugin: Plugin
): Promise<Context | Error> {
  ctx.log('debug', 'plugin', { plugin: plugin.name })
  const start = new Date().getTime()

  const hook = plugin[ctx.event.type]
  if (hook === undefined) {
    return ctx
  }

  const newCtx = await tryOperation(() => hook.apply(plugin, [ctx]))
    .then((ctx) => {
      const done = new Date().getTime() - start
      ctx.stats.gauge('plugin_time', done, [`plugin:${plugin.name}`])
      return ctx
    })
    .catch((err) => {
      ctx.log('error', 'plugin Error', {
        plugin: plugin.name,
        error: err,
      })
      ctx.stats.increment('plugin_error', 1, [`plugin:${plugin.name}`])
      return err as Error
    })

  return newCtx
}

export async function ensure(
  ctx: Context,
  plugin: Plugin
): Promise<Context | undefined> {
  const newContext = await attempt(ctx, plugin)

  if (newContext === undefined || newContext instanceof Error) {
    ctx.log('debug', 'Context canceled')
    ctx.stats.increment('context_canceled')
    ctx.cancel(newContext)
    return undefined
  }

  return newContext
}

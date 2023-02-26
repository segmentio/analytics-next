import { CoreContext, ContextCancelation } from '../context'
import { CorePlugin } from '../plugins'
import { isThenable } from '../utils/is-thenable'

export async function attempt<Ctx extends CoreContext = CoreContext>(
  ctx: Ctx,
  plugin: CorePlugin<Ctx>
): Promise<Ctx | ContextCancelation | Error> {
  ctx.log('debug', 'plugin', { plugin: plugin.name })

  const fn = plugin[ctx.event.type]
  if (fn === undefined) {
    return ctx
  }

  try {
    const newCtx = fn.call(plugin, ctx)
    if (isThenable(newCtx)) {
      return await newCtx
    }
    return newCtx
  } catch (err: any) {
    if (
      err instanceof ContextCancelation &&
      err.type === 'middleware_cancellation'
    ) {
      throw err
    }

    if (err instanceof ContextCancelation) {
      ctx.log('warn', err.type, {
        plugin: plugin.name,
        error: err,
      })

      return err
    }

    ctx.log('error', 'plugin Error', {
      plugin: plugin.name,
      error: err,
    })
    ctx.stats.increment('plugin_error', 1, [`plugin:${plugin.name}`])

    return err
  }
}

export function ensure<Ctx extends CoreContext = CoreContext>(
  ctx: Ctx,
  plugin: CorePlugin<Ctx>
): Promise<Ctx | undefined> {
  return attempt(ctx, plugin).then((newContext) => {
    if (newContext instanceof CoreContext) {
      return newContext
    }

    ctx.log('debug', 'Context canceled')
    ctx.stats.increment('context_canceled')
    ctx.cancel(newContext)
  })
}

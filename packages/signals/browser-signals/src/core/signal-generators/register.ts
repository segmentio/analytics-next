import { logger } from '../../lib/logger'
import { isClass } from '../../utils/is-class'
import { SignalEmitter } from '../emitter'
import { SignalGeneratorClass, SignalGenerator } from './types'

export const registerGenerator = async (
  emitter: SignalEmitter,
  signalGenerators: (SignalGeneratorClass | SignalGenerator)[]
): Promise<VoidFunction> => {
  const _register = (gen: SignalGeneratorClass | SignalGenerator) => {
    if (isClass(gen)) {
      logger.debug('Registering generator:', gen.id || gen.name)
      // Check if Gen is a function and has a constructor
      return new gen().register(emitter)
    } else {
      logger.debug('Registering generator:', gen.id)
      return gen.register(emitter)
    }
  }

  const cleanupFns = await Promise.all(signalGenerators.map(_register))

  // Return a cleanup function that calls all the cleanup functions (e.g unsubscribes from event listeners)
  return () => cleanupFns.forEach((fn) => fn())
}

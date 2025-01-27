import { createInteractionSignal } from '../../../../types/factories'
import { SignalEmitter } from '../../../emitter'
import { OnChangeGenerator } from '../change-gen'

describe('OnChangeGenerator', () => {
  let onChangeGenerator: OnChangeGenerator
  let emitter: SignalEmitter
  let unregister: () => void
  beforeEach(() => {
    onChangeGenerator = new OnChangeGenerator()
    emitter = new SignalEmitter()
  })

  afterEach(() => {
    unregister()
  })

  it('should emit a signal on change event', async () => {
    const emitSpy = jest.spyOn(emitter, 'emit')
    const target = document.createElement('input')
    target.type = 'text'
    target.value = 'new value'

    const event = new Event('change', { bubbles: true })
    Object.defineProperty(event, 'target', { value: target })

    unregister = onChangeGenerator.register(emitter)
    document.dispatchEvent(event)

    expect(emitSpy).toHaveBeenCalledWith(
      createInteractionSignal({
        eventType: 'change',
        listener: 'onchange',
        target: expect.any(Object),
        change: { value: 'new value' },
      })
    )
  })

  it('should not emit a signal for ignored elements', () => {
    const emitSpy = jest.spyOn(emitter, 'emit')
    const target = document.createElement('input')
    target.type = 'password'

    const event = new Event('change', { bubbles: true })
    Object.defineProperty(event, 'target', { value: target })

    unregister = onChangeGenerator.register(emitter)
    document.dispatchEvent(event)

    expect(emitSpy).not.toHaveBeenCalled()
  })

  it('should not emit a signal for elements handled by mutation observer', () => {
    const emitSpy = jest.spyOn(emitter, 'emit')
    const target = document.createElement('input')
    target.type = 'text'
    target.setAttribute('value', 'initial value')

    const event = new Event('change', { bubbles: true })
    Object.defineProperty(event, 'target', { value: target })

    unregister = onChangeGenerator.register(emitter)
    document.dispatchEvent(event)

    expect(emitSpy).not.toHaveBeenCalled()
  })
})

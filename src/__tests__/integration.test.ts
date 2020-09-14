import { Analytics } from '@/core'
import { Context } from '@/core/context'
import { Extension } from '@/core/extension'
import delay from 'delay'

const xt: Extension = {
  name: 'Test Extension',
  type: 'utility',
  version: '1.0',

  load(_ctx: Context): Promise<void> {
    return Promise.resolve()
  },

  isLoaded(): boolean {
    return true
  },
}

it('dispatches events', async () => {
  const ajs = new Analytics({
    writeKey: '123',
    extensions: [],
  })

  await ajs.track('Boo!', {
    total: 25,
    userId: '👻',
  })

  const dispatchQueue = ajs.queue.queue
  expect(dispatchQueue.length).toBe(1)

  await ajs.queue.flush()
  expect(dispatchQueue.length).toBe(0)
})

describe('Initialization', () => {
  it('loads extensions', () => {
    new Analytics({
      writeKey: '123',
      extensions: [xt],
    })

    expect(xt.isLoaded()).toBe(true)
  })

  it('loads async extensions', async () => {
    let extensionLoaded = false
    const onLoad = jest.fn(() => {
      extensionLoaded = true
    })

    const lazyExtension: Extension = {
      name: 'Test 2',
      type: 'utility',
      version: '1.0',

      load: async (_ctx) => {
        setTimeout(onLoad, 300)
      },
      isLoaded: () => {
        return extensionLoaded
      },
    }

    jest.spyOn(lazyExtension, 'load')
    new Analytics({ writeKey: '123', extensions: [lazyExtension] })

    expect(lazyExtension.load).toHaveBeenCalled()
    expect(onLoad).not.toHaveBeenCalled()
    expect(extensionLoaded).toBe(false)

    await delay(300)

    expect(onLoad).toHaveBeenCalled()
    expect(extensionLoaded).toBe(true)
  })
})

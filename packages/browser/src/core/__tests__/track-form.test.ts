import { Analytics } from '../analytics'
import { sleep } from '../../lib/sleep'
import { getDefaultPageContext } from '../page'

let analytics: Analytics
let mockTrack: jest.SpiedFunction<Analytics['track']>
const ogLocation = {
  ...global.window.location,
}

beforeEach(() => {
  // @ts-ignore
  global.jQuery = require('jquery')

  jest.spyOn(console, 'error').mockImplementationOnce(() => {})
  Object.defineProperty(window, 'location', {
    value: ogLocation,
    writable: true,
  })
  mockTrack = jest.spyOn(Analytics.prototype, 'track')
  analytics = new Analytics({ writeKey: 'foo' })
})

describe('trackForm', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let form: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let submit: any

  beforeEach(() => {
    document.querySelector('html')!.innerHTML = `
    <html>
      <body>
        <form target='_blank' action='/base/test/support/mock.html' id='form'>
          <input type='submit' id='submit'/>
        </form>
      </body>
    </html>`
    form = document.getElementById('form')
    submit = document.getElementById('submit')

    // @ts-ignore
    global.jQuery = require('jquery')
  })

  afterEach(() => {
    document.querySelector('html')!.innerHTML = ''
  })

  it('should have the correct page context', async () => {
    window.location.href = 'http://bar.com?foo=123'
    window.location.search = '?foo=123'
    await analytics.trackForm(form, 'foo', {}, { context: { ip: '0.0.0.0' } })
    submit.click()
    const [, , properties] = mockTrack.mock.lastCall as any[]

    expect((properties.context as any).page).toEqual({
      ...getDefaultPageContext(),
      url: 'http://bar.com?foo=123',
      search: '?foo=123',
    })
  })

  it('should not error or send track event on null form', async () => {
    const form = document.getElementById('fake-form') as HTMLFormElement

    await analytics.trackForm(form, 'Signed Up', {
      plan: 'Premium',
      revenue: 99.0,
    })
    submit.click()
    expect(mockTrack).not.toBeCalled()
  })

  it('should respect options object', async () => {
    await analytics.trackForm(form, 'foo', {}, { context: { ip: '0.0.0.0' } })
    submit.click()

    expect(mockTrack).toHaveBeenCalledWith(
      'foo',
      {},
      { context: expect.objectContaining({ ip: '0.0.0.0' }) }
    )
  })

  it('should trigger a track on a form submit', async () => {
    await analytics.trackForm(form, 'foo')
    submit.click()
    expect(mockTrack).toBeCalled()
  })

  it('should accept a jquery object for an element', async () => {
    await analytics.trackForm(form, 'foo')
    submit.click()
    expect(mockTrack).toBeCalled()
  })

  it('should not accept a string for an element', async () => {
    try {
      // @ts-expect-error
      await analytics.trackForm('foo')
      submit.click()
    } catch (e) {
      expect(e instanceof TypeError).toBe(true)
    }
    expect(mockTrack).not.toBeCalled()
  })

  it('should send an event and properties', async () => {
    await analytics.trackForm(form, 'event', { property: true })
    submit.click()
    expect(mockTrack).toBeCalledWith('event', { property: true }, {})
  })

  it('should accept an event function', async () => {
    function event(): string {
      return 'event'
    }
    await analytics.trackForm(form, event, { foo: 'bar' })
    submit.click()
    expect(mockTrack).toBeCalledWith('event', { foo: 'bar' }, {})
  })

  it('should accept a properties function', async () => {
    function properties(): Record<string, boolean> {
      return { property: true }
    }
    await analytics.trackForm(form, 'event', properties)
    submit.click()
    expect(mockTrack).toBeCalledWith('event', { property: true }, {})
  })

  it('should call submit after a timeout', async () => {
    const submitSpy = jest.spyOn(form, 'submit')

    await analytics.trackForm(form, 'foo')

    submit.click()

    await sleep(300)

    expect(submitSpy).toHaveBeenCalled()
  })

  it('should trigger an existing submit handler', async () => {
    const submitPromise = new Promise<void>((resolve) => {
      form.addEventListener('submit', () => {
        resolve()
      })
    })

    await analytics.trackForm(form, 'foo')
    submit.click()
    await submitPromise
  })

  it('should trigger an existing jquery submit handler', async () => {
    const $form = jQuery(form)

    const submitPromise = new Promise<void>((resolve) => {
      $form.submit(function () {
        resolve()
      })
    })

    await analytics.trackForm(form, 'foo')
    submit.click()
    await submitPromise
  })

  it('should track on a form submitted via jquery', async () => {
    const $form = jQuery(form)

    await analytics.trackForm(form, 'foo')
    $form.submit()

    expect(mockTrack).toBeCalled()
  })

  it('should trigger an existing jquery submit handler on a form submitted via jquery', async () => {
    const $form = jQuery(form)

    const submitPromise = new Promise<void>((resolve) => {
      $form.submit(function () {
        resolve()
      })
    })

    await analytics.trackForm(form, 'foo')
    $form.submit()
    await submitPromise
  })
})

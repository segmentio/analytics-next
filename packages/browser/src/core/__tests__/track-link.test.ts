import { Analytics } from '../analytics'
import { sleep } from '../../lib/sleep'

async function resolveWhen(
  condition: () => boolean,
  timeout?: number
): Promise<void> {
  return new Promise((resolve, _reject) => {
    if (condition()) {
      resolve()
      return
    }

    const check = () =>
      setTimeout(() => {
        if (condition()) {
          resolve()
        } else {
          check()
        }
      }, timeout)

    check()
  })
}

const ogLocation = {
  ...global.window.location,
}

let analytics: Analytics
let mockTrack: jest.SpiedFunction<Analytics['track']>
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: ogLocation,
    writable: true,
  })
  mockTrack = jest.spyOn(Analytics.prototype, 'track')
  analytics = new Analytics({ writeKey: 'foo' })
})
describe('trackLink', () => {
  let link: any
  let wrap: SVGSVGElement
  let svg: SVGAElement

  beforeEach(() => {
    // @ts-ignore
    global.jQuery = require('jquery')

    jest.spyOn(console, 'error').mockImplementationOnce(() => {})

    document.querySelector('html')!.innerHTML = `
      <html>
        <body>
          <a href='foo.com' id='foo'></a>
          <div id='bar'>
            <div>
              <a href='bar.com'></a>
            </div>
          </div>
        </body>
      </html>`

    link = document.getElementById('foo')
    wrap = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'a')
    wrap.appendChild(svg)
    document.body.appendChild(wrap)
  })

  afterEach(() => {
    document.querySelector('html')!.innerHTML = ''
  })
  it('should respect options object', async () => {
    await analytics.trackLink(link!, 'foo', {}, { context: { ip: '0.0.0.0' } })
    link.click()

    expect(mockTrack).toHaveBeenCalledWith(
      'foo',
      {},
      { context: expect.objectContaining({ ip: '0.0.0.0' }) }
    )
  })

  it('should stay on same page with blank href', async () => {
    link.href = ''
    await analytics.trackLink(link!, 'foo')
    link.click()

    expect(mockTrack).toHaveBeenCalled()
    expect(window.location.href).toBe('http://localhost/')
  })

  it('should work with nested link', async () => {
    const nested = document.getElementById('bar')
    await analytics.trackLink(nested, 'foo')
    nested!.click()

    expect(mockTrack).toHaveBeenCalled()

    await resolveWhen(() => window.location.href === 'bar.com')
    expect(window.location.href).toBe('bar.com')
  })

  it('should make a track call', async () => {
    await analytics.trackLink(link!, 'foo')
    link.click()

    expect(mockTrack).toHaveBeenCalled()
  })

  it('should still navigate even if the track call fails', async () => {
    mockTrack.mockClear()

    let rejected = false
    mockTrack.mockImplementationOnce(() => {
      rejected = true
      return Promise.reject(new Error('boo!'))
    })

    const nested = document.getElementById('bar')
    await analytics.trackLink(nested, 'foo')
    nested!.click()

    await resolveWhen(() => rejected)
    await resolveWhen(() => window.location.href === 'bar.com')
    expect(window.location.href).toBe('bar.com')
  })

  it('should still navigate even if the track call times out', async () => {
    mockTrack.mockClear()

    let timedOut = false
    mockTrack.mockImplementationOnce(async () => {
      await sleep(600)
      timedOut = true
      return Promise.resolve() as any
    })

    const nested = document.getElementById('bar')
    await analytics.trackLink(nested, 'foo')
    nested!.click()

    await resolveWhen(() => window.location.href === 'bar.com')
    expect(window.location.href).toBe('bar.com')
    expect(timedOut).toBe(false)

    await resolveWhen(() => timedOut)
  })

  it('should accept a jquery object for an element', async () => {
    const $link = jQuery(link)
    await analytics.trackLink($link, 'foo')
    link.click()
    expect(mockTrack).toBeCalled()
  })

  it('accepts array of elements', async () => {
    const links = [link, link]
    await analytics.trackLink(links, 'foo')
    link.click()

    expect(mockTrack).toHaveBeenCalled()
  })

  it('should send an event and properties', async () => {
    await analytics.trackLink(link, 'event', { property: true })
    link.click()

    expect(mockTrack).toBeCalledWith('event', { property: true }, {})
  })

  it('should accept an event function', async () => {
    function event(el: Element): string {
      return el.nodeName
    }
    await analytics.trackLink(link, event, { foo: 'bar' })
    link.click()

    expect(mockTrack).toBeCalledWith('A', { foo: 'bar' }, {})
  })

  it('should accept a properties function', async () => {
    function properties(el: Record<string, string>): Record<string, string> {
      return { type: el.nodeName }
    }
    await analytics.trackLink(link, 'event', properties)
    link.click()

    expect(mockTrack).toBeCalledWith('event', { type: 'A' }, {})
  })

  it('should load an href on click', async () => {
    link.href = '#test'
    await analytics.trackLink(link, 'foo')
    link.click()

    await resolveWhen(() => window.location.href === '#test')
    expect(global.window.location.href).toBe('#test')
  })

  it('should only navigate after the track call has been completed', async () => {
    link.href = '#test'
    await analytics.trackLink(link, 'foo')
    link.click()

    await resolveWhen(() => mockTrack.mock.calls.length === 1)
    await resolveWhen(() => window.location.href === '#test')

    expect(global.window.location.href).toBe('#test')
  })

  it('should support svg .href attribute', async () => {
    svg.setAttribute('href', '#svg')
    await analytics.trackLink(svg, 'foo')
    const clickEvent = new Event('click')
    svg.dispatchEvent(clickEvent)

    await resolveWhen(() => window.location.href === '#svg')
    expect(global.window.location.href).toBe('#svg')
  })

  it('should fallback to getAttributeNS', async () => {
    svg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#svg')
    await analytics.trackLink(svg, 'foo')
    const clickEvent = new Event('click')
    svg.dispatchEvent(clickEvent)

    await resolveWhen(() => window.location.href === '#svg')
    expect(global.window.location.href).toBe('#svg')
  })

  it('should support xlink:href', async () => {
    svg.setAttribute('xlink:href', '#svg')
    await analytics.trackLink(svg, 'foo')
    const clickEvent = new Event('click')
    svg.dispatchEvent(clickEvent)

    await resolveWhen(() => window.location.href === '#svg')
    expect(global.window.location.href).toBe('#svg')
  })

  it('should not load an href for a link with a blank target', async () => {
    link.href = '/base/test/support/mock.html'
    link.target = '_blank'
    await analytics.trackLink(link, 'foo')
    link.click()

    await sleep(300)
    expect(global.window.location.href).not.toBe('#test')
  })
})

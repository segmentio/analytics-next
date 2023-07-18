import { Cookie } from '..'

describe('Cookie storage', () => {
  it('should report cookie storage available when cookies are accessible', () => {
    expect(Cookie.available()).toBe(true)
  })

  it('should report cookie storage unavailable when cookies are not accessible', () => {
    ;(document as any).__defineGetter__('cookie', function () {
      return ''
    })

    expect(Cookie.available()).toBe(false)
  })
})

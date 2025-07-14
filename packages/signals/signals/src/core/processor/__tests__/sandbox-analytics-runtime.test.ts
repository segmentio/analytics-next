import { AnalyticsRuntime } from '../sandbox-analytics-runtime'

describe('AnalyticsRuntime', () => {
  let analyticsRuntime: AnalyticsRuntime

  beforeEach(() => {
    analyticsRuntime = new AnalyticsRuntime()
    // Spy on console.error to prevent test output pollution
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty calls object', () => {
      const calls = analyticsRuntime.getCalls()
      expect(calls).toEqual({
        page: [],
        identify: [],
        track: [],
        alias: [],
        screen: [],
        group: [],
        reset: [],
      })
    })
  })

  describe('track method', () => {
    it('should record track calls with all parameters', () => {
      const name = 'Button Clicked'
      const properties = { buttonId: 'cta-button', color: 'blue' }
      const context = { ip: '127.0.0.1' }

      analyticsRuntime.track(name, properties, context)

      const calls = analyticsRuntime.getCalls()
      expect(calls.track).toHaveLength(1)
      expect(calls.track[0]).toEqual([
        name,
        properties,
        { context: { ...context, __eventOrigin: { type: 'Signal' } } },
      ])
    })

    it('should record track calls with minimal parameters', () => {
      analyticsRuntime.track('Event Name', undefined, undefined)

      const calls = analyticsRuntime.getCalls()
      expect(calls.track).toHaveLength(1)
      expect(calls.track[0]).toEqual(['Event Name', undefined, {}])
    })

    it('should handle multiple track calls', () => {
      analyticsRuntime.track('Event 1', { prop: 'value1' }, undefined)
      analyticsRuntime.track('Event 2', { prop: 'value2' }, undefined)

      const calls = analyticsRuntime.getCalls()
      expect(calls.track).toHaveLength(2)
      expect(calls.track[0][0]).toBe('Event 1')
      expect(calls.track[1][0]).toBe('Event 2')
    })

    it('should handle errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error')

      // Mock createOptions to throw an error
      const originalCreateOptions = (analyticsRuntime as any).createOptions
      ;(analyticsRuntime as any).createOptions = jest.fn(() => {
        throw new Error('Test error')
      })

      analyticsRuntime.track('Event Name', {}, {})

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))

      // Restore original method
      ;(analyticsRuntime as any).createOptions = originalCreateOptions
    })
  })

  describe('identify method', () => {
    it('should record identify calls with all parameters', () => {
      const userId = 'user-123'
      const traits = { email: 'user@example.com', name: 'John Doe' }
      const context = { userAgent: 'Chrome' }

      analyticsRuntime.identify(userId, traits, context)

      const calls = analyticsRuntime.getCalls()
      expect(calls.identify).toHaveLength(1)
      expect(calls.identify[0]).toEqual([
        userId,
        traits,
        { context: { ...context, __eventOrigin: { type: 'Signal' } } },
      ])
    })

    it('should record identify calls with undefined values', () => {
      analyticsRuntime.identify(undefined, undefined, undefined)

      const calls = analyticsRuntime.getCalls()
      expect(calls.identify).toHaveLength(1)
      expect(calls.identify[0]).toEqual([undefined, undefined, {}])
    })

    it('should handle errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error')

      // Force an error by making calls.identify.push throw
      const originalPush = analyticsRuntime.getCalls().identify.push
      analyticsRuntime.getCalls().identify.push = jest.fn(() => {
        throw new Error('Test error')
      })

      analyticsRuntime.identify('user-123', {}, {})

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))

      // Restore original method
      analyticsRuntime.getCalls().identify.push = originalPush
    })
  })

  describe('alias method', () => {
    it('should record alias calls with all parameters', () => {
      const userId = 'new-user-id'
      const previousId = 'anonymous-id'
      const context = { source: 'mobile' }

      analyticsRuntime.alias(userId, previousId, context)

      const calls = analyticsRuntime.getCalls()
      expect(calls.alias).toHaveLength(1)
      expect(calls.alias[0]).toEqual([
        userId,
        previousId,
        { context: { ...context, __eventOrigin: { type: 'Signal' } } },
      ])
    })

    it('should record alias calls with undefined previousId', () => {
      analyticsRuntime.alias('new-user-id', undefined, undefined)

      const calls = analyticsRuntime.getCalls()
      expect(calls.alias).toHaveLength(1)
      expect(calls.alias[0]).toEqual(['new-user-id', undefined, {}])
    })

    it('should handle errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error')

      // Force an error
      const originalPush = analyticsRuntime.getCalls().alias.push
      analyticsRuntime.getCalls().alias.push = jest.fn(() => {
        throw new Error('Test error')
      })

      analyticsRuntime.alias('user-id', 'prev-id', {})

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))

      // Restore original method
      analyticsRuntime.getCalls().alias.push = originalPush
    })
  })

  describe('group method', () => {
    it('should record group calls with all parameters', () => {
      const groupId = 'group-123'
      const traits = { name: 'Acme Inc', plan: 'enterprise' }
      const context = { library: 'signals' }

      analyticsRuntime.group(groupId, traits, context)

      const calls = analyticsRuntime.getCalls()
      expect(calls.group).toHaveLength(1)
      expect(calls.group[0]).toEqual([
        groupId,
        traits,
        { context: { ...context, __eventOrigin: { type: 'Signal' } } },
      ])
    })

    it('should record group calls with undefined values', () => {
      analyticsRuntime.group(undefined, undefined, undefined)

      const calls = analyticsRuntime.getCalls()
      expect(calls.group).toHaveLength(1)
      expect(calls.group[0]).toEqual([undefined, undefined, {}])
    })

    it('should handle errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error')

      // Force an error
      const originalPush = analyticsRuntime.getCalls().group.push
      analyticsRuntime.getCalls().group.push = jest.fn(() => {
        throw new Error('Test error')
      })

      analyticsRuntime.group('group-id', {}, {})

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))

      // Restore original method
      analyticsRuntime.getCalls().group.push = originalPush
    })
  })

  describe('page method', () => {
    it('should record page calls with all parameters', () => {
      const name = 'Home'
      const category = 'Website'
      const properties = { url: '/home', title: 'Home Page' }
      const context = { referrer: '/landing' }

      analyticsRuntime.page(name, category, properties, context)

      const calls = analyticsRuntime.getCalls()
      expect(calls.page).toHaveLength(1)
      expect(calls.page[0]).toEqual([
        category,
        name,
        properties,
        { context: { ...context, __eventOrigin: { type: 'Signal' } } },
      ])
    })

    it('should handle legacy behavior when name is undefined but category is provided', () => {
      const category = 'Website'
      const properties = { url: '/page' }

      analyticsRuntime.page(undefined, category, properties, undefined)

      const calls = analyticsRuntime.getCalls()
      expect(calls.page).toHaveLength(1)
      expect(calls.page[0]).toEqual([
        category,
        '', // name defaults to empty string
        properties,
        {},
      ])
    })

    it('should preserve name when both name and category are provided', () => {
      analyticsRuntime.page('Page Name', 'Category', {}, undefined)

      const calls = analyticsRuntime.getCalls()
      expect(calls.page[0][1]).toBe('Page Name')
    })

    it('should preserve undefined name when category is also undefined', () => {
      analyticsRuntime.page(undefined, undefined, {}, undefined)

      const calls = analyticsRuntime.getCalls()
      expect(calls.page[0][1]).toBeUndefined()
    })

    it('should handle errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error')

      // Force an error
      const originalPush = analyticsRuntime.getCalls().page.push
      analyticsRuntime.getCalls().page.push = jest.fn(() => {
        throw new Error('Test error')
      })

      analyticsRuntime.page('Page', 'Category', {}, {})

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))

      // Restore original method
      analyticsRuntime.getCalls().page.push = originalPush
    })
  })

  describe('screen method', () => {
    it('should record screen calls with all parameters', () => {
      const name = 'Login Screen'
      const category = 'Authentication'
      const properties = { version: '2.0', experiment: 'new-ui' }
      const context = { app: { version: '1.2.3' } }

      analyticsRuntime.screen(name, category, properties, context)

      const calls = analyticsRuntime.getCalls()
      expect(calls.screen).toHaveLength(1)
      expect(calls.screen[0]).toEqual([
        category,
        name,
        properties,
        { context: { ...context, __eventOrigin: { type: 'Signal' } } },
      ])
    })

    it('should handle legacy behavior when name is undefined but category is provided', () => {
      const category = 'Mobile'
      const properties = { screenId: 'main' }

      analyticsRuntime.screen(undefined, category, properties, undefined)

      const calls = analyticsRuntime.getCalls()
      expect(calls.screen).toHaveLength(1)
      expect(calls.screen[0]).toEqual([
        category,
        '', // name defaults to empty string
        properties,
        {},
      ])
    })

    it('should preserve name when both name and category are provided', () => {
      analyticsRuntime.screen('Screen Name', 'Category', {}, undefined)

      const calls = analyticsRuntime.getCalls()
      expect(calls.screen[0][1]).toBe('Screen Name')
    })

    it('should handle errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error')

      // Force an error
      const originalPush = analyticsRuntime.getCalls().screen.push
      analyticsRuntime.getCalls().screen.push = jest.fn(() => {
        throw new Error('Test error')
      })

      analyticsRuntime.screen('Screen', 'Category', {}, {})

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))

      // Restore original method
      analyticsRuntime.getCalls().screen.push = originalPush
    })
  })

  describe('reset method', () => {
    it('should record reset calls', () => {
      analyticsRuntime.reset()

      const calls = analyticsRuntime.getCalls()
      expect(calls.reset).toHaveLength(1)
      expect(calls.reset[0]).toEqual([])
    })

    it('should record multiple reset calls', () => {
      analyticsRuntime.reset()
      analyticsRuntime.reset()

      const calls = analyticsRuntime.getCalls()
      expect(calls.reset).toHaveLength(2)
    })
  })

  describe('createOptions method', () => {
    it('should return empty object when context is undefined', () => {
      const result = (analyticsRuntime as any).createOptions(undefined)
      expect(result).toEqual({})
    })

    it('should return empty object when context is null', () => {
      const result = (analyticsRuntime as any).createOptions(null)
      expect(result).toEqual({})
    })

    it('should add __eventOrigin to context', () => {
      const context = { userId: '123', custom: 'value' }
      const result = (analyticsRuntime as any).createOptions(context)

      expect(result).toEqual({
        context: {
          userId: '123',
          custom: 'value',
          __eventOrigin: { type: 'Signal' },
        },
      })
    })

    it('should preserve existing context properties', () => {
      const context = {
        ip: '127.0.0.1',
        userAgent: 'Chrome',
        nested: { prop: 'value' },
      }
      const result = (analyticsRuntime as any).createOptions(context)

      expect(result.context.ip).toBe('127.0.0.1')
      expect(result.context.userAgent).toBe('Chrome')
      expect(result.context.nested).toEqual({ prop: 'value' })
      expect(result.context.__eventOrigin).toEqual({ type: 'Signal' })
    })

    it('should not mutate the original context object', () => {
      const originalContext = { userId: '123' }
      const contextCopy = { ...originalContext }

      ;(analyticsRuntime as any).createOptions(originalContext)

      expect(originalContext).toEqual(contextCopy)
      expect((originalContext as any).__eventOrigin).toBeUndefined()
    })
  })

  describe('method calls isolation', () => {
    it('should maintain separate call arrays for each method', () => {
      analyticsRuntime.track('event', {}, {})
      analyticsRuntime.identify('user', {}, {})
      analyticsRuntime.page('page', 'category', {}, {})
      analyticsRuntime.screen('screen', 'category', {}, {})
      analyticsRuntime.group('group', {}, {})
      analyticsRuntime.alias('new', 'old', {})
      analyticsRuntime.reset()

      const calls = analyticsRuntime.getCalls()
      expect(calls.track).toHaveLength(1)
      expect(calls.identify).toHaveLength(1)
      expect(calls.page).toHaveLength(1)
      expect(calls.screen).toHaveLength(1)
      expect(calls.group).toHaveLength(1)
      expect(calls.alias).toHaveLength(1)
      expect(calls.reset).toHaveLength(1)
    })

    it('should return the same calls object reference', () => {
      const calls1 = analyticsRuntime.getCalls()
      const calls2 = analyticsRuntime.getCalls()

      expect(calls1).toBe(calls2)
    })
  })

  describe('bound methods behavior', () => {
    it('should maintain context when methods are destructured', () => {
      const { track, identify, page } = analyticsRuntime

      track('event', {}, {})
      identify('user', {}, {})
      page('page', 'category', {}, {})

      const calls = analyticsRuntime.getCalls()
      expect(calls.track).toHaveLength(1)
      expect(calls.identify).toHaveLength(1)
      expect(calls.page).toHaveLength(1)
    })

    it('should work when methods are called with different context', () => {
      const track = analyticsRuntime.track
      const otherObject = { track }

      otherObject.track('event', {}, {})

      const calls = analyticsRuntime.getCalls()
      expect(calls.track).toHaveLength(1)
      expect(calls.track[0][0]).toBe('event')
    })
  })
})

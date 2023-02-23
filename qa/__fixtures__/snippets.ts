export function next(writekey: string, obfuscate: boolean) {
  return `
    <html>
    <head></head>
    <script>
      !(function () {
        var analytics = (window.analytics = window.analytics || [])
        if (!analytics.initialize)
          if (analytics.invoked)
            window.console &&
              console.error &&
              console.error('Segment snippet included twice.')
          else {
            analytics.invoked = !0
            analytics.methods = [
              'screen',
              'register',
              'deregister',
              'trackSubmit',
              'trackClick',
              'trackLink',
              'trackForm',
              'pageview',
              'identify',
              'reset',
              'group',
              'track',
              'ready',
              'alias',
              'debug',
              'page',
              'once',
              'off',
              'on',
              'addSourceMiddleware',
              'addIntegrationMiddleware',
              'setAnonymousId',
              'addDestinationMiddleware',
            ]
            analytics.factory = function (e) {
              return function () {
                var t = Array.prototype.slice.call(arguments)
                t.unshift(e)
                analytics.push(t)
                return analytics
              }
            }
            for (var e = 0; e < analytics.methods.length; e++) {
              var key = analytics.methods[e]
              analytics[key] = analytics.factory(key)
            }
            analytics.load = function (key, e) {
              var t = document.createElement('script')
              t.type = 'text/javascript'
              t.async = !0
              t.src = 'http://localhost:4000/dist/umd/standalone.js'
              var n = document.getElementsByTagName('script')[0]
              n.parentNode.insertBefore(t, n)
              analytics._loadOptions = e
            }
            analytics.SNIPPET_VERSION = '4.13.1'
            analytics._writeKey = '${writekey}'
            analytics.load('${writekey}', { obfuscate: ${obfuscate} })
          }
      })()
    </script>
    <body>
    next
    <img id="taylor" src="https://i.insider.com/57d1eef909d29325008b6cfa?width=1100&format=jpeg&auto=webp" />
    </body>
    </html>
  `
}

export function classic(writekey: string) {
  return `
  <html>
  <head>
  </head>
    <script>!(function () {
    var analytics = (window.analytics = window.analytics || [])
    if (!analytics.initialize)
      if (analytics.invoked)
        window.console &&
          console.error &&
          console.error('Segment snippet included twice.')
      else {
        analytics.invoked = !0
        analytics.methods = [
          'screen',
          'register',
          'deregister',
          'trackSubmit',
          'trackClick',
          'trackLink',
          'trackForm',
          'pageview',
          'identify',
          'reset',
          'group',
          'track',
          'ready',
          'alias',
          'debug',
          'page',
          'once',
          'off',
          'on',
          'addSourceMiddleware',
          'addIntegrationMiddleware',
          'setAnonymousId',
          'addDestinationMiddleware',
        ]
        analytics.factory = function (e) {
          return function () {
            var t = Array.prototype.slice.call(arguments)
            t.unshift(e)
            analytics.push(t)
            return analytics
          }
        }
        for (var e = 0; e < analytics.methods.length; e++) {
          var key = analytics.methods[e]
          analytics[key] = analytics.factory(key)
        }
        analytics.load = function (key, e) {
          var t = document.createElement('script')
          t.type = 'text/javascript'
          t.async = !0
          t.src =
            'https://api.june.so/analytics.js/v1/' +
            key +
            '/analytics.classic.js'
          var n = document.getElementsByTagName('script')[0]
          n.parentNode.insertBefore(t, n)
          analytics._loadOptions = e
        }
        analytics.SNIPPET_VERSION = '4.13.1'
        analytics.load('${writekey}')
      }
  })()</script>
  <body>
  classic
  <img id="taylor" src="https://i.insider.com/57d1eef909d29325008b6cfa?width=1100&format=jpeg&auto=webp" />
  </body>
  </html>
`
}

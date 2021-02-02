if (process.env.ASSET_PATH) {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/camelcase
  __webpack_public_path__ = process.env.ASSET_PATH
}

import { install } from './standalone-analytics'

try {
  install().catch(function (err) {
    console.error(err)
  })
} catch (err) {
  // @ts-expect-error
  const isIE11 = !!window.MSInputMethodContext && !!document.documentMode

  if (!isIE11) {
    throw err
  }

  // load polyfills in order to get AJS to work with IE11
  const script = document.createElement('script')
  script.setAttribute(
    'src',
    'https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/7.7.0/polyfill.min.js'
  )
  document.body.appendChild(script)

  script.onload = function (): void {
    install().catch(console.error)
  }
}

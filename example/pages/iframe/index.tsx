import React, { useEffect, useState } from 'react'
import { TEST_WRITEKEY } from '../../../src/__tests__/test-writekeys'

import {
  AnalyticsSettings,
  AnalyticsBrowser,
  Analytics,
} from '../../../dist/pkg'

const settings: AnalyticsSettings = {
  writeKey: TEST_WRITEKEY,
}

export default function Iframe(): React.ReactElement {
  const [, setAnalytics] = useState<Analytics | undefined>(undefined)
  const [analyticsReady, setAnalyticsReady] = useState<boolean>(false)
  const [writeKey] = useState<string>(settings.writeKey)

  async function fetchAnalytics() {
    const [response] = await AnalyticsBrowser.load({
      ...settings,
      writeKey,
    })

    if (response) {
      setAnalytics(response)
      setAnalyticsReady(true)
      // @ts-ignore
      window.analytics = response
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [writeKey, analyticsReady])

  return (
    <iframe
      src="http://localhost:3000/iframe/childPage"
      width="100%"
      title="IFrame"
      allow="geolocation; microphone; camera;midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb"
      sandbox="allow-forms allow-scripts allow-same-origin allow-modals allow-popups allow-presentation"
    ></iframe>
  )
}

import React from 'react'
import { AnalyticsBrowser } from '@justatestnpmpublish/analytics-next'
import { useCDNUrl, useWriteKey } from '../utils/hooks/useConfig'

const AnalyticsContext = React.createContext<{
  analytics: AnalyticsBrowser
  writeKey: string
  setWriteKey: (key: string) => void
  cdnURL: string
  setCDNUrl: (url: string) => void
}>(undefined)

export const AnalyticsProvider: React.FC = ({ children }) => {
  const [writeKey, setWriteKey] = useWriteKey()
  const [cdnURL, setCDNUrl] = useCDNUrl()

  const analytics = React.useMemo(() => {
    console.log(
      `AnalyticsBrowser loading...`,
      JSON.stringify({ writeKey, cdnURL })
    )
    return AnalyticsBrowser.load({ writeKey, cdnURL })
  }, [writeKey, cdnURL])
  return (
    <AnalyticsContext.Provider
      value={{ analytics, writeKey, setWriteKey, cdnURL, setCDNUrl }}
    >
      {children}
    </AnalyticsContext.Provider>
  )
}

// Create an analytics hook that we can use with other components.
export const useAnalytics = () => {
  const result = React.useContext(AnalyticsContext)
  if (!result) {
    throw new Error('Context used outside of its Provider!')
  }
  return result
}

import React from 'react'
import { AnalyticsBrowser } from '../../'
import { useWriteKey } from '../utils/hooks/useConfig'

const AnalyticsContext = React.createContext<AnalyticsBrowser>(undefined)

export const AnalyticsProvider: React.FC<{
  writeKey: string
  CDNUrl?: string
}> = ({ children, writeKey, CDNUrl }) => {
  const analytics = React.useMemo(
    () => AnalyticsBrowser.load({ writeKey, CDNUrl }),
    [writeKey, CDNUrl]
  )
  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export const useAnalytics = () => React.useContext(AnalyticsContext)

export const AnalyticsProviderWithConfig = ({ children }) => {
  const [key] = useWriteKey()
  return <AnalyticsProvider writeKey={key}> {children}</AnalyticsProvider>
}

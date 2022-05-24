import React from 'react'
import { AnalyticsBrowser } from '../../'

const AnalyticsContext = React.createContext<AnalyticsBrowser>(undefined)

export const AnalyticsProvider: React.FC<{ writeKey: string }> = ({
  children,
  writeKey,
}) => {
  const analytics = React.useMemo(
    () => AnalyticsBrowser.load({ writeKey }),
    [writeKey]
  )
  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export const useAnalytics = () => React.useContext(AnalyticsContext)

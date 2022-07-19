import React, { createContext, useContext } from 'react'
import {
  AnalyticsBrowser,
  AnalyticsBrowserSettings,
  InitOptions,
} from '@segment/analytics-next'

export const createClient = (
  settings: AnalyticsBrowserSettings,
  options?: InitOptions
) => AnalyticsBrowser.load(settings, options)

const AnalyticsContext = createContext<AnalyticsBrowser | null>(null)

export type AnalyticsProviderProps = {
  client: AnalyticsBrowser
  children?: React.ReactNode
}

export const AnalyticsProvider = ({
  client,
  children,
}: AnalyticsProviderProps) => {
  if (!(client instanceof AnalyticsBrowser)) {
    throw new Error(
      'Invalid Segment `client`. Make sure you are using `createClient` correctly'
    )
  }

  return (
    <AnalyticsContext.Provider value={client}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export const useAnalytics = () => {
  const analytics = useContext(AnalyticsContext)

  if (!(analytics instanceof AnalyticsBrowser)) {
    throw new Error(
      'Analytics client not found. Make sure `AnalyticsProvider` is an ancestor of this component'
    )
  }

  return analytics
}

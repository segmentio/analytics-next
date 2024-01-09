import React from 'react'
import { AnalyticsProvider } from '../../context/analytics'

const ChildPage: React.FC = () => {
  return <div> Hello world! </div>
}

export default () => (
  <AnalyticsProvider>
    <ChildPage />
  </AnalyticsProvider>
)

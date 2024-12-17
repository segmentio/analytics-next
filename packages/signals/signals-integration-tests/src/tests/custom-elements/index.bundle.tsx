import React from 'react'
import { createRoot } from 'react-dom/client'
import { AnalyticsBrowser } from '@segment/analytics-next'
import { SignalsPlugin } from '@segment/analytics-signals'
import { App } from './components/App'

window.SignalsPlugin = SignalsPlugin
window.analytics = new AnalyticsBrowser()

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(<App />)

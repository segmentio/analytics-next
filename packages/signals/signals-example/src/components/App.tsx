import '../lib/analytics'
import React, { useEffect } from 'react'
import ComplexForm from './ComplexForm'
import { analytics, loadAnalytics } from '../lib/analytics'

const App: React.FC = () => {
  useEffect(() => {
    void loadAnalytics()
  }, [])
  return (
    <main>
      <h1>Hello, React with TypeScript!</h1>
      <ComplexForm />
      <button onClick={() => analytics.track('manual track call')}>
        Send Manual Track Call
      </button>
    </main>
  )
}

export default App

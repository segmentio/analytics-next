import { analytics } from '../lib/analytics'
import React, { useEffect } from 'react'
import ComplexForm from './ComplexForm'

const App: React.FC = () => {
  useEffect(() => {
    void analytics.page()
  }, [])
  return (
    <main>
      <h1>Hello, React with TypeScript!</h1>
      <ComplexForm />
    </main>
  )
}

export default App

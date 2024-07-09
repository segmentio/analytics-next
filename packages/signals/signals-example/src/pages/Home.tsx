import React from 'react'
import ComplexForm from '../components/ComplexForm'
import { analytics } from '../lib/analytics'

export const HomePage: React.FC = () => {
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

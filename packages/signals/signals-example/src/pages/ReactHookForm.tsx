import React from 'react'
import ComplexForm from '../components/ComplexReactHookForm'
import { analytics } from '../lib/analytics'

export const ReactHookFormPage: React.FC = () => {
  return (
    <main>
      <h1>Hello, React Hook Form with TypeScript!</h1>
      <ComplexForm />
      <button onClick={() => analytics.track('manual track call')}>
        Send Manual Track Call
      </button>
    </main>
  )
}

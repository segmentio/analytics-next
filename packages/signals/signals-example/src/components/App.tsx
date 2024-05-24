import '../lib/analytics'
import React, { useEffect } from 'react'
import { loadAnalytics } from '../lib/analytics'
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'
import { HomePage } from '../pages/Home'
import { OtherPage } from '../pages/Other'

const App: React.FC = () => {
  useEffect(() => {
    void loadAnalytics()
  }, [])

  return (
    <Router>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/other">Other</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/other" element={<OtherPage />} />
      </Routes>
    </Router>
  )
}

export default App

import React from 'react'

export const OtherPage: React.FC = () => {
  React.useEffect(() => {
    document.title = 'Other Page'
  }, [])

  return (
    <main>
      <h1 id="top">Hello, I'm another page</h1>
      <a href="#section">Go to Section</a>
      <section>
        <h2 id="section">A section</h2>
        <p>{`Lorem ipsum dolor sit amet`}</p>
      </section>
      <a href="#top">Go to Top</a>
    </main>
  )
}

import React, { FormEventHandler, useState } from 'react'

const ComplexForm = () => {
  const [inputField, setInputField] = useState('')
  const [expectFormError, setExpectFormError] = useState(false)
  const [selectField, setSelectField] = useState('')

  const statusCode: number = React.useMemo(() => {
    try {
      // Change the response status code via the text input field
      const val = parseInt(inputField, 10)
      return val >= 100 && val <= 511 ? val : 400
    } catch (err) {
      return 400
    }
  }, [inputField])

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()

    const formData = {
      status: expectFormError ? statusCode : 200,
      inputField,
      selectField,
    }
    console.log('Submitting form:', JSON.stringify(formData))
    fetch('/parrot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Form submitted successfully:', data)
      })
      .catch((error) => {
        console.error('Error submitting form:', error)
      })
    console.log({ inputField, selectField })
  }

  return (
    <div>
      <button data-custom-attr="some-custom-attribute">Example Button</button>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="ex-input-text">Input some text:</label>
          <input
            id="ex-input-text"
            type="text"
            value={inputField}
            onChange={(e) => setInputField(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="ex-select">Select an option:</label>
          <select
            id="ex-select"
            value={selectField}
            onChange={(e) => setSelectField(e.target.value)}
          >
            <option value="" disabled>
              Select
            </option>
            <option value="Option 1">Option 1</option>
            <option value="Option 2">Option 2</option>
          </select>
        </div>
        <div>
          <label htmlFor="ex-checkbox">{`Force submit network status: ${statusCode}`}</label>
          <input
            id="ex-checkbox"
            type="checkbox"
            checked={expectFormError}
            onChange={(e) => setExpectFormError(e.target.checked)}
          />
        </div>
        <button type="submit">Submit via network req</button>
      </form>
      <button>
        <div>
          Other Example Button with <h1>Nested Text</h1>
        </div>
      </button>
    </div>
  )
}

export default ComplexForm

import React, { FormEventHandler, useState } from 'react'

const ComplexForm = () => {
  const [inputField, setInputField] = useState('')
  const [selectField, setSelectField] = useState('')

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    console.log({ inputField, selectField })
  }

  return (
    <div>
      <button data-custom-attr="some-custom-attribute">Example Button</button>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="ex-input">Input Field:</label>
          <input
            id="ex-input"
            type="text"
            value={inputField}
            onChange={(e) => setInputField(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="ex-select">Select Field:</label>
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
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default ComplexForm

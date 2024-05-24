import React, { FormEventHandler, useState } from 'react'

const ComplexForm = () => {
  const [inputField, setInputField] = useState('')
  const [selectField, setSelectField] = useState('')

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    console.log({ inputField, selectField })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Input Field:
        <input
          type="text"
          value={inputField}
          onChange={(e) => setInputField(e.target.value)}
        />
      </label>
      <label>
        Select Field:
        <select
          value={selectField}
          onChange={(e) => setSelectField(e.target.value)}
        >
          <option value="" disabled>
            Select
          </option>
          <option value="Option 1">Option 1</option>
          <option value="Option 2">Option 2</option>
        </select>
      </label>
      <button type="submit">Submit</button>
    </form>
  )
}

export default ComplexForm

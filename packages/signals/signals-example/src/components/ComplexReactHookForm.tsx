import React from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'

interface IFormInput {
  name: string
  selectField: string
  expectFormError: boolean
}

const ComplexFormWithHookForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IFormInput>()
  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    const statusCode = data.expectFormError ? parseInt(data.name, 10) : 200
    const formData = {
      status: statusCode,
      name: data.name,
      selectField: data.selectField,
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
  }

  const name = watch('name')
  const statusCode = React.useMemo(() => {
    try {
      const val = parseInt(name, 10)
      return val >= 100 && val <= 511 ? val : 400
    } catch (err) {
      return 400
    }
  }, [name])

  return (
    <div>
      <button data-custom-attr="some-custom-attribute">Example Button</button>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="ex-input-text">Input some text:</label>
          <input
            id="ex-input-text"
            type="text"
            {...register('name', { required: true })}
          />
          {errors.name && <span>This field is required</span>}
        </div>
        <div>
          <label htmlFor="ex-select">Select an option:</label>
          <select
            id="ex-select"
            {...register('selectField', { required: true })}
          >
            <option value="" disabled>
              Select
            </option>
            <option value="Option 1">Option 1</option>
            <option value="Option 2">Option 2</option>
          </select>
          {errors.selectField && <span>This field is required</span>}
        </div>
        <div>
          <label htmlFor="ex-checkbox">{`Force submit network status: ${statusCode}`}</label>
          <input
            id="ex-checkbox"
            type="checkbox"
            {...register('expectFormError')}
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

export default ComplexFormWithHookForm

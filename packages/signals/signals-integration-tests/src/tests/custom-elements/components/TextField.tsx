import {
  FieldError,
  Input,
  Label,
  Text,
  TextField as AriaTextField,
  TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components'

import './TextField.css'
import React from 'react'

export interface TextFieldProps extends AriaTextFieldProps {
  label?: string
  description?: string
}

export function TextField({ label, description, ...props }: TextFieldProps) {
  const [isError, setIsError] = React.useState<boolean>(false)
  return (
    <AriaTextField
      {...props}
      onChange={(v) => setIsError(v.includes('error'))}
      isInvalid={isError}
    >
      <Label>{label}</Label>
      <Input
        placeholder='type "error" to force an error'
        data-testid="aria-text-field"
      />
      {description && <Text slot="description">{description}</Text>}
      {isError && <FieldError>"Some error!"</FieldError>}
    </AriaTextField>
  )
}

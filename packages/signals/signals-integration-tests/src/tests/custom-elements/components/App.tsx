import React from 'react'
import { TextField } from './TextField'
import { Select, SelectItem } from './Select'

export const App: React.FC = () => {
  return (
    <main>
      <div id="textfield">
        <h2>TextField</h2>
        <TextField label="some-text-field" />
      </div>
      <div id="select">
        <h2>Select</h2>
        <Select>
          <SelectItem>Chocolate</SelectItem>
          <SelectItem>Mint</SelectItem>
          <SelectItem>Strawberry</SelectItem>
          <SelectItem>Vanilla</SelectItem>
        </Select>
      </div>
    </main>
  )
}

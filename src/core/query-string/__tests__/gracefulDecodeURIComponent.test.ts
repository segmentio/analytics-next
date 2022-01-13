import { gracefulDecodeURIComponent } from '../gracefulDecodeURIComponent'

describe('gracefulDecodeURIComponent', () => {
  it('decodes a properly encoded URI component', () => {
    const output = gracefulDecodeURIComponent(
      'brown+fox+jumped+%40+the+fence%3F'
    )

    expect(output).toEqual('brown fox jumped @ the fence?')
  })

  it('returns the input string back as-is when input is malformed', () => {
    const output = gracefulDecodeURIComponent('25%%2F35%')

    expect(output).toEqual('25%%2F35%')
  })
})

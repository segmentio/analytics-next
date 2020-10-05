import { ajsDestinations } from '..'
import { mocked } from 'ts-jest/utils'
import unfetch from 'unfetch'
import { Extension } from '../../../core/extension'

const cdnResponse = {
  integrations: {
    Zapier: {
      type: 'server',
    },
    'Marketo V2': {
      version: '3.0.7',
      type: 'browser',
    },
    'Amazon S3': {},
  },
}

jest.mock('unfetch', () => {
  return jest.fn()
})

const jsonPromise = Promise.resolve(cdnResponse)
const fetchSettings = Promise.resolve({
  json: () => jsonPromise,
})

let destinations: Extension[]

beforeEach(async () => {
  /* eslint-disable @typescript-eslint/ban-ts-ignore */
  // @ts-ignore: ignore Response required fields
  mocked(unfetch).mockImplementation((): Promise<Response> => fetchSettings)
  destinations = await ajsDestinations('fakeWriteKey', {})
})

describe('ajsDestinations', () => {
  it('loads type:browser legacy ajs destinations from cdn', () => {
    expect(destinations[0].name).toBe('Marketo V2')
    expect(destinations.length).toBe(2)
  })

  it('ignores destinations of type:server', () => {
    expect(destinations.find((d) => d.name === 'Zapier')).toBe(undefined)
  })

  it('does not ignore destinations with empty settings', () => {
    expect(destinations.find((d) => d.name === 'Amazon S3')?.name).toBe('Amazon S3')
  })
})

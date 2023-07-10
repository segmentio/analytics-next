import {
  UADataValues,
  UALowEntropyJSON,
} from '../../lib/client-hints/interfaces'

export const lowEntropyTestData: UALowEntropyJSON = {
  brands: [
    {
      brand: 'Google Chrome',
      version: '113',
    },
    {
      brand: 'Chromium',
      version: '113',
    },
    {
      brand: 'Not-A.Brand',
      version: '24',
    },
  ],
  mobile: false,
  platform: 'macOS',
}

export const highEntropyTestData: UADataValues = {
  architecture: 'x86',
  bitness: '64',
}

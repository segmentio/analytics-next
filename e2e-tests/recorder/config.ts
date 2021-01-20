import segment from '../cases/segment'
import milanuncios from '../cases/milanuncios'
import staples from '../cases/staples'
import local from '../cases/local'
import ritual from '../cases/ritual'
import classpass from '../cases/classpass'
import bonobos from '../cases/bonobos'
import ifit from '../cases/ifit'
import hoteltonight from '../cases/hoteltonight'
import doordash from '../cases/doordash'

export const DEVTOOLS = process.env.DEVTOOLS === 'true'
export const AJS_VERSION = process.env.AJS_VERSION || 'next'
export const HEADLESS = process.env.HEADLESS || 'true'
export const TRACKING_API_URLS = [
  'https://api.segment.io',
  'https://api.segment.com',
  'https://api.cd.segment.com',
  'https://api.cd.segment.io',
  'https://api.seg.ritual.com',
]

const CASES = process.env.CASES
const allScenarios = [
  segment,
  milanuncios,
  staples,
  local,
  ritual,
  classpass,
  bonobos,
  ifit,
  hoteltonight,
  doordash,
]

export const cases = allScenarios.filter(
  (scenario) => CASES?.split(',').includes(scenario.name) ?? true
)

const endpointMapping: { [endpoint: string]: string } = {
  i: '/v1/i',
  p: '/v1/p',
  t: '/v1/t',
  a: '/v1/a',
  g: '/v1/g',
}

export const ENDPOINTS =
  process.env.ENDPOINTS?.split(',').map(
    (endpoint) => endpointMapping[endpoint]
  ) ?? Object.values(endpointMapping)

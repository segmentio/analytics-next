import { PageData } from '@segment/analytics-signals-runtime'

const pageData: PageData = {
  hash: '',
  hostname: 'localhost',
  path: '/src/tests/signals-vanilla/index.html',
  referrer: '',
  search: '',
  title: '',
  url: 'http://localhost:5432/src/tests/signals-vanilla/index.html',
}

export const commonSignalData = {
  page: pageData,
}

import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useAnalyticsPageEvent } from '../utils/analytics'

export default function App({ Component, pageProps }: AppProps) {
  useAnalyticsPageEvent()
  // @ts-ignore
  return <Component {...pageProps} />
}

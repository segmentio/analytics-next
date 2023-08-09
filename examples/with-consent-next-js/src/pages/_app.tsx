import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useAnalyticsPageEvent } from '../utils/hooks/analytics'

export default function App({ Component, pageProps }: AppProps) {
  useAnalyticsPageEvent()
  return <Component {...pageProps} />
}

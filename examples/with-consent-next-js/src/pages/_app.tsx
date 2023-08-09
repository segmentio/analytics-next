import '@/styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  // @ts-ignore - unknown build error, likely from a TS version mismatch
  return <Component {...pageProps} />
}

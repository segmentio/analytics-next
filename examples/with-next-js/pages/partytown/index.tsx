import Head from 'next/head'
import React from 'react'
import { Partytown } from '@builder.io/partytown/react'
import { useWriteKey } from '../../utils/hooks/useConfig'

const WebWorker: React.FC = () => {
  const [writeKey] = useWriteKey()
  return (
    <>
      <Head>
        <Partytown
          debug={true}
          forward={[
            'dataLayer.push',
            'analytics.track',
            'analytics.identify',
            'analytics.group',
            'analytics.reset',
            'analytics.alias',
          ]}
        />
        {/* copied the snippet from app.segment.com */}
        <script
          type="text/partytown"
          dangerouslySetInnerHTML={{
            __html: `
            !function(){var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware"];analytics.factory=function(e){return function(){var t=Array.prototype.slice.call(arguments);t.unshift(e);analytics.push(t);return analytics}};for(var e=0;e<analytics.methods.length;e++){var key=analytics.methods[e];analytics[key]=analytics.factory(key)}analytics.load=function(key,e){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.src="https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n);analytics._loadOptions=e};analytics._writeKey="${writeKey}";;analytics.SNIPPET_VERSION="4.15.3";
            analytics.load("${writeKey}");
            analytics.page();
            }}();
            `,
          }}
        />
      </Head>
      <main>
        <h1>Web Worker Example with partytown.io</h1>
        <a href="https://partytown.builder.io/nextjs">Partytown.io docs</a>
        <input
          type="button"
          style={{
            display: 'block',
            margin: '1rem 0',
          }}
          value="Track!"
          onClick={() => {
            void window.analytics.track(
              'Party Town Click',
              { myProp: 'hello' },
              { traits: { age: 8 } }
            )
          }}
        />
      </main>
    </>
  )
}

export default WebWorker

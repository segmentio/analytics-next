import React from 'react'

export default function Iframe(): React.ReactElement {
  return (
    <iframe
      src="http://localhost:3000/iframe/childPage"
      width="100%"
      title="IFrame"
      allow="geolocation; microphone; camera;midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb"
      sandbox="allow-forms allow-scripts allow-same-origin allow-modals allow-popups allow-presentation"
    ></iframe>
  )
}

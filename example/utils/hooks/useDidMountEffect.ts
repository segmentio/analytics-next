import { useRef, useEffect } from 'react'

// This function runs on dependency change but not on initial render.
export const useDidMountEffect = (func, deps) => {
  const didMount = useRef(false)

  useEffect(() => {
    if (didMount.current) func()
    else didMount.current = true
  }, deps)
}

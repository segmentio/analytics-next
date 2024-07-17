export const setLocation = (location: Partial<Location> = {}) => {
  Object.defineProperty(window, 'location', {
    value: {
      ...window.location,
      ...location,
    },
    writable: true,
  })
}

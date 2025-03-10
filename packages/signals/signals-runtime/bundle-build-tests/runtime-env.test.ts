import { JSDOM } from 'jsdom'
import fs from 'node:fs'
import path from 'node:path'

describe('Global Scope Test: Web', () => {
  let dom: JSDOM
  beforeAll(() => {
    // Load the built file
    const filePath = path.resolve(__dirname, '../dist/runtime/index.web.js')
    const scriptContent = fs.readFileSync(filePath, 'utf-8')

    // Create a new JSDOM instance
    dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`, {
      runScripts: 'dangerously',
      resources: 'usable',
    })

    // Execute the script in the JSDOM context
    const scriptElement = dom.window.document.createElement('script')
    scriptElement.textContent = scriptContent
    dom.window.document.head.appendChild(scriptElement)
  })

  test('should expose a signals instance in the global scope', () => {
    // @ts-ignore
    expect(dom.window).toBeDefined()
    // @ts-ignore
    expect(typeof dom.window.signals).toBe('object')
    expect(typeof dom.window.signals.find).toBe('function')
    expect(typeof dom.window.signals.filter).toBe('function')
  })

  test('should expose constants', () => {
    expect(dom.window.EventType.Track).toBe('track')
    expect(dom.window.NavigationAction.URLChange).toBe('urlChange')
    expect(dom.window.SignalType.Interaction).toBe('interaction')
  })
})

describe('Global Scope Test: Mobile', () => {
  let dom: JSDOM
  beforeAll(() => {
    // Load the built file
    const filePath = path.resolve(__dirname, '../dist/runtime/index.mobile.js')
    const scriptContent = fs.readFileSync(filePath, 'utf-8')

    // Create a new JSDOM instance
    dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`, {
      runScripts: 'dangerously',
      resources: 'usable',
    })

    // Execute the script in the JSDOM context
    const scriptElement = dom.window.document.createElement('script')
    scriptElement.textContent = scriptContent
    dom.window.document.head.appendChild(scriptElement)
  })

  test('should expose signals in the global scope', () => {
    // @ts-ignore
    expect(dom.window).toBeDefined()
    // @ts-ignore
    expect(typeof dom.window.signals).toBe('object')
    expect(typeof dom.window.signals.find).toBe('function')
    expect(typeof dom.window.signals.filter).toBe('function')
  })

  test('should expose constants', () => {
    expect(dom.window.EventType.Track).toBe('track')
    expect(dom.window.NavigationAction.Forward).toBe('forward')
    expect(dom.window.SignalType.Interaction).toBe('interaction')
  })
})

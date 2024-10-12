import { JSDOM } from 'jsdom'
import fs from 'node:fs'
import path from 'node:path'

describe('Global Scope Test', () => {
  let dom: JSDOM
  beforeAll(() => {
    // Load the built file
    const filePath = path.resolve(__dirname, '../dist/global/index.js')
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

  test('should expose SignalsRuntime in the global scope', () => {
    // @ts-ignore
    expect(dom.window).toBeDefined()
    // @ts-ignore
    expect(typeof dom.window.SignalsRuntime).toBe('function')
  })
})

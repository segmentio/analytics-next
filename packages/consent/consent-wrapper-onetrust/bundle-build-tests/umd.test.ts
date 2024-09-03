import { JSDOM } from 'jsdom'
import fs from 'node:fs'
import path from 'node:path'

describe('UMD Scope Test', () => {
  let dom: JSDOM
  let scriptContent: string

  beforeAll(() => {
    // Load the built file
    const filePath = path.resolve(
      __dirname,
      '../dist/umd/analytics-onetrust.umd.js'
    )
    scriptContent = fs.readFileSync(filePath, 'utf-8')

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

  test('should expose withOneTrust in the global scope', () => {
    expect(dom.window.withOneTrust).toBeDefined()
    expect(typeof dom.window.withOneTrust).toBe('function')
  })

  test('should build a proper UMD module', () => {
    // Check if the module is available as a global variable
    expect(dom.window.AnalyticsOneTrust).toBeDefined()
    expect(typeof dom.window.AnalyticsOneTrust).toBe('object')
    expect(typeof dom.window.AnalyticsOneTrust.withOneTrust).toBe('function')

    // Simulate a CommonJS environment
    const module = { exports: {} }
    const evalRequire = (id: string): { withOneTrust: any } => {
      if (id === 'analytics-onetrust') {
        eval(scriptContent)
        return module.exports as any
      }
      throw new Error(`Cannot find module '${id}'`)
    }

    const commonJsModule = evalRequire('analytics-onetrust')
    expect(commonJsModule).toBeDefined()
    expect(commonJsModule.withOneTrust).toBeDefined()
    expect(typeof commonJsModule.withOneTrust).toBe('function')
  })
})

import { SignalEmitter } from '../../../emitter'
import { OnChangeGenerator } from '../change-gen'

describe(OnChangeGenerator, () => {
  let onChangeGenerator: OnChangeGenerator
  let emitter: SignalEmitter
  let unregister: () => void
  beforeEach(async () => {
    onChangeGenerator = new OnChangeGenerator()
    emitter = new SignalEmitter()
    await emitter.start({} as any)
  })

  afterEach(() => {
    unregister()
  })

  it('should emit a signal on change event', async () => {
    const emitSpy = jest.spyOn(emitter, 'emit')
    const target = document.createElement('input')
    target.type = 'text'
    target.value = 'new value'

    const event = new Event('change', { bubbles: true })
    Object.defineProperty(event, 'target', { value: target })

    unregister = onChangeGenerator.register(emitter)
    document.dispatchEvent(event)

    expect(emitSpy.mock.calls.length).toBe(1)
    expect(emitSpy.mock.calls[0][0]).toMatchInlineSnapshot(`
      {
        "anonymousId": "",
        "context": {
          "library": {
            "name": "@segment/analytics-next",
            "version": "0.0.0",
          },
          "signalsRuntime": "",
        },
        "data": {
          "change": {
            "value": "new value",
          },
          "eventType": "change",
          "listener": "onchange",
          "page": {
            "hash": "",
            "hostname": "localhost",
            "path": "/",
            "referrer": "",
            "search": "",
            "title": "",
            "url": "http://localhost/",
          },
          "target": {
            "attributes": {
              "type": "text",
            },
            "checked": false,
            "classList": [],
            "describedBy": undefined,
            "id": "",
            "innerText": undefined,
            "label": undefined,
            "labels": [],
            "name": "",
            "nodeName": "INPUT",
            "tagName": "INPUT",
            "textContent": "",
            "title": "",
            "type": "text",
            "value": "new value",
          },
        },
        "index": undefined,
        "timestamp": <ISO Timestamp>,
        "type": "interaction",
      }
    `)
  })

  it('should not emit a signal for ignored elements', () => {
    const emitSpy = jest.spyOn(emitter, 'emit')
    const target = document.createElement('input')
    target.type = 'password'

    const event = new Event('change', { bubbles: true })
    Object.defineProperty(event, 'target', { value: target })

    unregister = onChangeGenerator.register(emitter)
    document.dispatchEvent(event)

    expect(emitSpy).not.toHaveBeenCalled()
  })

  it('should not emit a signal for elements handled by mutation observer', () => {
    const emitSpy = jest.spyOn(emitter, 'emit')
    const target = document.createElement('input')
    target.type = 'text'
    target.setAttribute('value', 'initial value')

    const event = new Event('change', { bubbles: true })
    Object.defineProperty(event, 'target', { value: target })

    unregister = onChangeGenerator.register(emitter)
    document.dispatchEvent(event)

    expect(emitSpy).not.toHaveBeenCalled()
  })

  it('should emit a signal with selectedOptions for select elements', () => {
    const emitSpy = jest.spyOn(emitter, 'emit')
    const target = document.createElement('select')
    const option1 = document.createElement('option')
    option1.value = 'value1'
    option1.label = 'label1'
    option1.selected = true
    const option2 = document.createElement('option')
    option2.value = 'value2'
    option2.label = 'label2'
    target.append(option1, option2)

    const event = new Event('change', { bubbles: true })
    Object.defineProperty(event, 'target', { value: target })

    unregister = onChangeGenerator.register(emitter)
    document.dispatchEvent(event)

    expect(emitSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "anonymousId": "",
          "context": {
            "library": {
              "name": "@segment/analytics-next",
              "version": "0.0.0",
            },
            "signalsRuntime": "",
          },
          "data": {
            "change": {
              "selectedOptions": [
                {
                  "label": "label1",
                  "value": "value1",
                },
              ],
            },
            "eventType": "change",
            "listener": "onchange",
            "page": {
              "hash": "",
              "hostname": "localhost",
              "path": "/",
              "referrer": "",
              "search": "",
              "title": "",
              "url": "http://localhost/",
            },
            "target": {
              "attributes": {},
              "classList": [],
              "describedBy": undefined,
              "id": "",
              "innerText": undefined,
              "label": undefined,
              "labels": [],
              "name": "",
              "nodeName": "SELECT",
              "selectedIndex": 0,
              "selectedOptions": [
                {
                  "label": "label1",
                  "value": "value1",
                },
              ],
              "tagName": "SELECT",
              "textContent": "",
              "title": "",
              "type": "select-one",
              "value": "value1",
            },
          },
          "index": undefined,
          "timestamp": <ISO Timestamp>,
          "type": "interaction",
        },
      ]
    `)
  })
})

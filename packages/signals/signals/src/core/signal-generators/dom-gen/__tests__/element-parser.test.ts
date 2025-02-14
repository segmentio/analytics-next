import { parseElement } from '../element-parser'

describe(parseElement, () => {
  test('parses a generic HTML element', () => {
    const element = document.createElement('div')
    element.id = 'test-id'
    element.classList.add('test-class')
    element.setAttribute('title', 'Test Title')
    element.textContent = 'Test Content'

    const parsed = parseElement(element)

    expect(parsed).toMatchInlineSnapshot(`
      {
        "attributes": {
          "class": "test-class",
          "id": "test-id",
          "title": "Test Title",
        },
        "classList": [
          "test-class",
        ],
        "describedBy": undefined,
        "id": "test-id",
        "innerText": undefined,
        "label": undefined,
        "labels": [],
        "name": undefined,
        "nodeName": "DIV",
        "tagName": "DIV",
        "textContent": "Test Content",
        "title": "Test Title",
        "type": undefined,
        "value": undefined,
      }
    `)
  })

  test('parses an HTMLSelectElement', () => {
    const select = document.createElement('select')
    select.id = 'select-id'
    select.classList.add('select-class')
    select.setAttribute('title', 'Select Title')
    select.selectedIndex = 1

    const option1 = document.createElement('option')
    option1.value = 'value1'
    option1.label = 'label1'
    select.appendChild(option1)

    const option2 = document.createElement('option')
    option2.value = 'value2'
    option2.label = 'label2'
    select.appendChild(option2)

    select.selectedIndex = 1

    const parsed = parseElement(select)

    expect(parsed).toMatchInlineSnapshot(`
      {
        "attributes": {
          "class": "select-class",
          "id": "select-id",
          "title": "Select Title",
        },
        "classList": [
          "select-class",
        ],
        "describedBy": undefined,
        "id": "select-id",
        "innerText": undefined,
        "label": undefined,
        "labels": [],
        "name": "",
        "nodeName": "SELECT",
        "selectedIndex": 1,
        "selectedOptions": [
          {
            "label": "label2",
            "value": "value2",
          },
        ],
        "tagName": "SELECT",
        "textContent": "",
        "title": "Select Title",
        "type": "select-one",
        "value": "value2",
      }
    `)
  })

  test('parses an HTMLInputElement', () => {
    const input = document.createElement('input')
    input.id = 'input-id'
    input.classList.add('input-class')
    input.setAttribute('title', 'Input Title')
    input.type = 'checkbox'
    input.checked = true

    const parsed = parseElement(input)

    expect(parsed).toMatchInlineSnapshot(`
      {
        "attributes": {
          "class": "input-class",
          "id": "input-id",
          "title": "Input Title",
          "type": "checkbox",
        },
        "checked": true,
        "classList": [
          "input-class",
        ],
        "describedBy": undefined,
        "id": "input-id",
        "innerText": undefined,
        "label": undefined,
        "labels": [],
        "name": "",
        "nodeName": "INPUT",
        "tagName": "INPUT",
        "textContent": "",
        "title": "Input Title",
        "type": "checkbox",
        "value": "on",
      }
    `)
  })

  test('parses an HTMLMediaElement', () => {
    const video = document.createElement('video')
    video.id = 'video-id'
    video.classList.add('video-class')
    video.setAttribute('title', 'Video Title')
    video.src = 'video.mp4'
    video.currentTime = 10

    // Mock the duration property
    Object.defineProperty(video, 'duration', {
      value: 120,
      writable: true,
    })

    Object.defineProperty(video, 'paused', {
      value: false,
      writable: true,
    })

    Object.defineProperty(video, 'readyState', {
      value: 4,
      writable: true,
    })

    video.muted = true
    video.playbackRate = 1.5
    video.volume = 0.8

    const parsed = parseElement(video)

    expect(parsed).toMatchInlineSnapshot(`
      {
        "attributes": {
          "class": "video-class",
          "id": "video-id",
          "src": "video.mp4",
          "title": "Video Title",
        },
        "classList": [
          "video-class",
        ],
        "currentSrc": "",
        "currentTime": 10,
        "describedBy": undefined,
        "duration": 120,
        "ended": false,
        "id": "video-id",
        "innerText": undefined,
        "label": undefined,
        "labels": [],
        "muted": true,
        "name": undefined,
        "nodeName": "VIDEO",
        "paused": false,
        "playbackRate": 1.5,
        "readyState": 4,
        "src": "http://localhost/video.mp4",
        "tagName": "VIDEO",
        "textContent": "",
        "title": "Video Title",
        "type": undefined,
        "value": undefined,
        "volume": 0.8,
      }
    `)
  })

  test('parses an HTMLFormElement', () => {
    const form = document.createElement('input')
    form.id = 'form-id'
    form.classList.add('form-class')
    form.setAttribute('title', 'Form Title')

    const input = document.createElement('input')
    input.name = 'input-name'
    input.value = 'input-value'
    form.appendChild(input)

    const parsed = parseElement(form)

    expect(parsed).toMatchInlineSnapshot(`
      {
        "attributes": {
          "class": "form-class",
          "id": "form-id",
          "title": "Form Title",
        },
        "checked": false,
        "classList": [
          "form-class",
        ],
        "describedBy": undefined,
        "id": "form-id",
        "innerText": undefined,
        "label": undefined,
        "labels": [],
        "name": "",
        "nodeName": "INPUT",
        "tagName": "INPUT",
        "textContent": "",
        "title": "Form Title",
        "type": "text",
        "value": "",
      }
    `)
  })
  test('handles scenarios where name is an object', () => {
    const form = document.createElement('form')
    form.id = 'form-id'
    form.classList.add('form-class')
    form.setAttribute('title', 'Form Title')

    Object.defineProperty(form, 'name', {
      // this can happen in some weird cases?. just in case
      value: {
        hello: 'world',
      },
      writable: true,
    })

    const parsed = parseElement(form)

    expect(parsed).toMatchInlineSnapshot(`
      {
        "attributes": {
          "class": "form-class",
          "id": "form-id",
          "title": "Form Title",
        },
        "classList": [
          "form-class",
        ],
        "describedBy": undefined,
        "formData": {},
        "id": "form-id",
        "innerText": undefined,
        "label": undefined,
        "labels": [],
        "name": undefined,
        "nodeName": "FORM",
        "tagName": "FORM",
        "textContent": undefined,
        "title": "Form Title",
        "type": undefined,
        "value": undefined,
      }
    `)
  })
})

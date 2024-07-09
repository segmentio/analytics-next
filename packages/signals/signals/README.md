#  @segment/analytics-signals 


### Settings / Configuration

See: [settings.ts](src/types/settings.ts)


## Signal Types

### Network
Network signals emit in response to HTTP network activity:
- Both requests and responses
This only applies to:
- First-party (same origin, e.g, if the host is bar.com, only domains and subdomains that originate from bar.com)
- Response _and_ Requests must contain content type 'application/json`
- Requests made using the Fetch API (window.fetch)



### Interaction
Interaction signals emit in response to a user interaction

### Instrumentation
Instrumentation signals emit whenever a Segment event is emitted.

### Navigation
Instrumentation signals emit whenever the URL changes.

> Note: you can also rely on the initial analytics.page() call, which you can access as an Instrumentation signal.

### Network
Network signals emit when a Request or Response is emitted is detected with the following requirements:
- Uses the `fetch` API
- First party domain (e.g if on `foo.com`, then `foo.com/api/products`, but not `bar.com/api/products`)
- Contains the content-type: `application/json`


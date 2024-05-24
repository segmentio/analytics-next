#  @segment/analytics-browser-signals 


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

> Note: you can rely on the initial analytics.page() call, which you can access as an Instrumentation signal.

Navigation signals emit when the following happens:
- soft navigation change: user clicks a '#' or does 


seth.com/api/login?foo=123

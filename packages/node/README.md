# TODO: API Documentation is out of date

https://segment.com/docs/connections/sources/catalog/libraries/server/node/


NOTE:  @segment/analytics-node is unstable! do not use.

```ts
// 1
const analytics = new AnalyticsNode()
analytics.track()


if (analytics.empty()) {
  // do nothing
} else {
  await new Promise(resolve => analytics.on("empty", resolve))
}

// TODO: Individual Error events should show up on context
void track = () =>

// TODO: Figure out how to allow graceful shut down -- flushing all events out of the queue (queue should not accept new events when shutdown is called). (and global error handling)
// TODO:
if ()
```

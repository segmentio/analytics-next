---
'@segment/analytics-core': patch
'@segment/analytics-node': minor
---

This ensures backward compatibility with analytics-node by modifying '@segment/analytics-core'. Specifically, the changes prevent the generation of a messageId if it is already set. This adjustment aligns with the behavior outlined in analytics-node's source code [here](https://github.com/segmentio/analytics-node/blob/master/index.js#L195-L201).

While this is a core release, only the node library is affected, as the browser has its own EventFactory atm.
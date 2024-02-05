---
'@segment/analytics-next': minor
---

This minor update ensures backward compatibility with analytics-node by modifying '@segment/analytics-next'. Specifically, the changes prevent the generation of a messageId if it is already set. This adjustment aligns with the behavior outlined in analytics-node's source code [here](https://github.com/segmentio/analytics-node/blob/master/index.js#L195-L201).

---
'@segment/analytics-core': patch
---
Allow consumers to inject custom messageId into EventFactory, allowing us to remove node transient dependency on md5 library. Change node messageId to format "node-next-[unix epoch time]-[uuid]".

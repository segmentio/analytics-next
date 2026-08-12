---
'@segment/analytics-node': patch
---

Fix the per-event and batch size limits, which were not enforced. `ContextBatch.calculateSize` used a broken byte-count regex (`split(/%..|i/)`) that counted only `%XX` escapes plus the letter "i" instead of UTF-8 bytes, so a ~39 KB event measured as ~21 bytes and passed the 32 KB per-event guard. Restored the correct byte count so oversized events are rejected before they are sent.

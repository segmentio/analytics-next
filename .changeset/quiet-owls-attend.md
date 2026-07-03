---
'@segment/analytics-next': patch
---

Fix Conversion SDK `identify()` sending an empty `user_id`: derive it from BGID trait or SHA-256(email) when the caller doesn't pass an explicit userId. Also tag identify traits with `traits.navec` (and `traits.lotame` when configured) to identify the data source.

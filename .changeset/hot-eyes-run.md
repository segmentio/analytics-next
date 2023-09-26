---
'@segment/analytics-node': minor
---

Support for Segment OAuth2

OAuth2 must be enabled from the Segment dashboard. You will need a PEM format
private/public key pair.  Once you've uploaded your public key, you will need
the OAuth Client Id, the Key Id, and your private key.  You can set these in
the new OAuthSettings type and provide it in your Analytics configuration.

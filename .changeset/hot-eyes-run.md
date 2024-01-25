---
'@segment/analytics-node': major
---

Support for Segment OAuth2

OAuth2 must be enabled from the Segment dashboard. You will need a PEM format
private/public key pair.  Once you've uploaded your public key, you will need
the OAuth Client Id, the Key Id, and your private key.  You can set these in
the new OAuthSettings type and provide it in your Analytics configuration.

Note: This introduces a breaking change only if you have implemented a custom
HTTPClient.  HTTPClientRequest `data: Record<string, any>` has changed to 
`body: string`. Processing data into a string now occurs before calls to
`makeRequest`

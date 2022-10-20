Core tests that require AnalyticsBrowser, etc.
This exists because we can't create circular dependencies -- so, for example, installing AnalyticsBrowser as a dev dependency on core.
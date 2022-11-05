# Core Integration Tests
This can contain a mix of tests which cover the public API of the package. This can range anywhere from typical integration tests that might stub out the API (which may or may not also be in the package itself), to tests around the specific npm packaged artifact. Examples include:
- Is a license included in npm pack?
- can you import a module (e.g. is the package.json path correctly to allow consumers to import)?
- are there missing depenndencies in package.json?

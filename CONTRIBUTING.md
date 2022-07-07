# Contributing

Thanks for taking the time to contribute to analytics-next!

## Guideline for Pull Requests

This is a list of guidelines to follow to help expedite your pull request so we can get it reviewed/merged more quickly:

- Include a changeset by running `yarn changeset` and following the prompts. Read: [An introduction to using changesets](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md). (*Note: changesets are only for changes that would merit a package bump, not for internal or cosmetic improvements.*)
- Make sure existing unit tests and CI are all passing
- Write new unit tests for the code you're contributing
- A major goal of analytics-next is to keep bundle sizes low. Avoid redundancy and use efficient/modern javascript where possible
- Changes must be compatible with major browsers
- Document your testing process, include screenshots when appropriate


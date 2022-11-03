# Architecture

## Codebases

analytics-next is comprised of two different codebases:

- [analytics-next](https://github.com/segmentio/analytics-next): All core functionality of AJSN
- [integrations](https://github.com/segmentio/analytics.js-integrations): All existing legacy client side destinations

This diagram outlines the relationship between these two codebases (cloudfront being where the integrations are hosted):
![Architecture](.github/architecture.png?raw=true)

## Core

Some of the bigger core modules are briefly outlined here -

- arguments-resolver: Responsible for reshuffling arguments in event calls
- context: Responsible for building context objects for different events
- emitter: Responsible for emitting events and adding listeners for them
- events: Responsible for building the different Segment events (track, page, etc), and normalizing those events
- logger: Responsible for building and flushing the logs that will be carried around in an events context object
- queue: The heart of AJSN, the queue is responsible for managing events which will be delivered to plugins and destinations, and handles things such as retries, timeouts, and delivery reliability
- user: Responsible for all of the logic built around an analytics user

The general end to end flow of analytics-next core is as follows:

1. Legacy settings and destinations are loaded from the segment CDN
2. The Analytics object is instantiated with the loaded settings, and sets up things such as new/existing users and an event queue.
3. Events are built and queued when a user makes a Segment call (ie. analytics.track())
4. The event is dispatched, goes through all enabled plugins, and is finally sent through the segment.io plugin to get the data into Segment

## Everything is a Plugin

When developing against analytics-next you will likely be writing plugins, which can augment AJSN functionality and enrich data. Plugins are isolated chunks which you can build, test, version, and deploy independently of the rest of the codebase. Extensions are bounded by AJSN which handles things such as observability, retries, and error management.

Plugins can be of two different priorities:

- Critical: AJSN should expect this plugin to be loaded before starting event delivery
- Non-critical: AJSN can start event delivery before this plugin has finished loading

and can be of five different types:

- Before: Pleguns that need to be run before any other plugins are run. An example of this would be validating events before passing them along to other plugins.
- After: Plugins that need to run after all other plugins have run. An example of this is the segment.io integration, which will wait for destinations to succeed or fail so that it can send its observability metrics.
- Destination: Destinations to send the event to (ie. legacy destinations). Does not modify the event and failure does not halt execution.
- Enrichment: Modifies an event, failure here could halt the event pipeline.
- Utility: Plugins that change AJSN functionality and don't fall into the other categories.

## Observability

Every event and plugin has a context object, which contains both metrics and logs that were collected throughout their lifetime. Logs can be used for debugging, and the metrics will be included when the event is sent to Segment.

## Analytics.js Plugin Architecture

```mermaid
graph TD
    subgraph Plugin Lifecycle
        Event[Event Generated] --> Before[Before Plugins]
        Before --> Enrichment[Enrichment Plugins]
        Enrichment --> Destination[Destination Plugins]
        Destination --> After[After Plugins]
    end

    subgraph Before Plugins Examples
        Before --> Validation[Validation Plugin]
        Before --> Sampling[Sampling Plugin]
        Before --> PII[PII Filtering]
    end

    subgraph Enrichment Examples
        Enrichment --> Device[Device Info]
        Enrichment --> UserAgent[User Agent]
        Enrichment --> Context[Context Enrichment]
    end

    subgraph Destination Examples
        Destination --> GA[Google Analytics]
        Destination --> Amplitude[Amplitude]
        Destination --> Mixpanel[Mixpanel]
    end

    subgraph After Plugins Examples
        After --> Logger[Logging]
        After --> Storage[Local Storage]
        After --> Callback[Callbacks]
    end

    classDef lifecycle fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef before fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef enrich fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef dest fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef after fill:#fce4ec,stroke:#880e4f,stroke-width:2px

    class Event,Before,Enrichment,Destination,After lifecycle
    class Validation,Sampling,PII before
    class Device,UserAgent,Context enrich
    class GA,Amplitude,Mixpanel dest
    class Logger,Storage,Callback after

```

### Plugin Types Description

#### Before Plugins
- Execute before event processing
- Can modify or filter events
- Examples: validation, sampling, PII filtering

#### Enrichment Plugins
- Add additional data to events
- Enhance event context
- Examples: device info, user agent parsing, context addition

#### Destination Plugins
- Send data to external services
- Handle integration-specific formatting
- Examples: Google Analytics, Amplitude, Mixpanel

#### After Plugins
- Execute after all processing is complete
- Handle post-processing tasks
- Examples: logging, storage, callbacks

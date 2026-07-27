# Kambata Travel Booking Flow Architecture

The following diagram maps out the complete end-to-end booking flow for the Kambata Travel platform, detailing both the Instant Booking and Custom Request pathways.

```mermaid
graph TD
    %% Styling Classes
    classDef traveler fill:#1d4ed8,stroke:#1e40af,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef system fill:#15803d,stroke:#166534,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef payment fill:#6b21a8,stroke:#581c87,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef decision fill:#475569,stroke:#334155,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef warning fill:#b45309,stroke:#92400e,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef danger fill:#b91c1c,stroke:#991b1b,stroke-width:2px,color:#ffffff,font-weight:bold;

    %% 1. Discovery
    A[Browse Explorer Portal<br/><small>Admin verified destinations & tours</small>]:::traveler --> B[Select a tour blueprint<br/><small>Admin created, guide verified</small>]:::traveler
    
    %% 2. Auth
    B --> C{Logged in?}:::decision
    C -- No --> D[Register<br/><small>OTP Verify</small>]:::danger
    D --> C
    C -- Yes --> E[View tour details<br/><small>Description, price, guide profiles</small>]:::traveler
    
    %% 3. Choose Path
    E --> F{Live schedules<br/>available?}:::decision
    
    %% Instant Booking Path (Yes)
    F -- Yes --> G[Instant Booking]:::system
    G --> H[Choose schedule<br/><small>Date, guide, party size</small>]:::system
    H --> I[Confirm booking<br/><small>Review summary</small>]:::system
    I --> J[Chat unlocked<br/><small>Secure room created</small>]:::system
    
    %% Custom Request Path (No)
    F -- No --> K[Request Custom Date]:::warning
    K --> L[Submit date request<br/><small>Requested date + party size</small>]:::warning
    L --> M[Guide notified<br/><small>Review the request via Dashboard</small>]:::warning
    M --> N{Guide accepts?}:::decision
    N -- No --> O[Rejected<br/><small>Traveler notified, Request Closed</small>]:::danger
    N -- Yes --> P[Chat unlocked<br/><small>Secure room created</small>]:::system
    
    %% 4. Confirmation
    J --> Q[Payment via Chapa<br/><small>Funds held by platform escrow</small>]:::payment
    P --> Q
    
    Q --> R{Payment<br/>successful?}:::decision
    R -- No --> S[Payment Failed<br/><small>Booking not created, Retry allowed</small>]:::danger
    S -.-> Q
    R -- Yes --> T[Booking confirmed<br/><small>Email/SMS sent to traveler + guide</small>]:::system
    T -.-> U[Guide sees<br/>passenger list updated]:::decision
    
    %% 5. Tour Day
    T --> V[Tour takes place<br/><small>Guide leads the experience</small>]:::traveler
    V --> W[Status -> 'Completed']:::decision
    
    %% 6. Post-Trip
    W --> X[Funds released<br/><small>Moved to Guide's Virtual Wallet</small>]:::system
    W --> Y[Review unlocked<br/><small>Traveler can rate 1-5 stars</small>]:::traveler

```

## Flow Description

1. **Discovery & Auth**: Travelers browse admin-vetted locations. They must pass OTP authentication to proceed with interactions.
2. **The Crossroads**: The flow hinges entirely on whether a Guide has proactively created a schedule for an Admin-approved Tour Blueprint.
3. **Instant Booking**: If a schedule exists, the traveler immediately claims available slots.
4. **On-Demand Booking**: If no schedule exists, the traveler negotiates a custom date with a local expert. The guide must manually approve the date.
5. **Financial Safety**: The **Chat System** acts as a bridge before payment, ensuring travelers and guides can align on details. However, **Funds** are collected via Chapa and held by the platform escrow.
6. **Completion**: Funds are only released to the Guide's wallet after the tour successfully takes place, at which point the traveler is also unlocked to leave a public review.

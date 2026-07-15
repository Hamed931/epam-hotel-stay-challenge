# Reflection - Hotel Stay Availability Challenge

## What Went Well

- The end-to-end flow was delivered cleanly: search -> results -> select -> reserve -> confirmation -> lookup.
- Provider abstraction (`IHotelProvider`) worked well for isolating provider-specific formats and behaviors.
- Deterministic provider data kept backend tests stable and made debugging much faster.
- The Minimal API layer stayed thin while business rules lived in services, which improved maintainability.
- Frontend and backend contracts were aligned well after enum-string serialization and lookup payload fixes.

## Key Design Decisions

- Chose a unified internal model for room options and reservation responses to normalize provider differences.
- Implemented a dedicated search aggregation service to query all providers and return a consistent output.
- Used in-memory reservation storage (`ConcurrentDictionary`) to match challenge scope and offline constraints.
- Enforced destination-based document rules on both client and server, with server validation as the source of truth.
- Kept supported destinations explicit and finite so behavior remains deterministic and testable.
- Reused a single confirmation panel for both reservation success and lookup results to reduce duplicated UI code.

## How AI Was Used

AI was used as an implementation accelerator and review assistant across the full lifecycle:
- Drafting and refining the initial architecture/specification
- Scaffolding backend models, providers, services, and endpoint wiring
- Generating and improving xUnit/service/API tests
- Building frontend components and API client integration iteratively
- Debugging issues (DateOnly arithmetic, enum serialization, lookup response completeness)
- Producing and maintaining implementation documentation in [prompts.md](prompts.md)

All AI-generated output was manually reviewed, tested, and adjusted before final acceptance.

## What I Would Improve With More Time

- Add stronger field-level validation rules (format checks, max lengths, and normalization).
- Improve UX polish with clearer progressive states, accessibility refinements, and richer empty/error guidance.
- Add optional persistence (while keeping in-memory mode as default) for longer demo sessions.
- Add CI automation for build, backend tests, and frontend tests on every push.

## Closing Notes

The challenge requirements were achieved with an architecture that is simple, deterministic, and easy to extend with additional providers. The current solution is intentionally pragmatic for challenge scope, with a clear path toward production hardening.

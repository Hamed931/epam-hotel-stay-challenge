# AI Tooling
This file documents the significant AI prompts used during the Hotel Stay Availability challenge and the key judgement calls made during implementation.

Primary IDE-integrated AI tool:
- GitHub Copilot 

AI was used throughout the software development lifecycle for:
- Requirements analysis
- Architecture and modelling
- API design
- Backend implementation
- Frontend implementation
- Unit and integration testing
- Documentation
- Code review and bug fixing

All generated code was reviewed, tested, and modified where necessary. 


## Prompt - Specification and initial design
Prompt: "Create a spec.md for the Hotel Stay Availability challenge. Include assumptions, domain models, provider interface contract, API contracts, validation rules, testing strategy, and extensibility notes. The backend is .NET 8+ Minimal API, the frontend is React + Vite, and tests are xUnit. The system must query two deterministic stub providers, normalize results, validate documents during reservation, and support adding a third provider later."

Output used: Generated the initial `spec.md` structure and baseline architecture sections used for implementation.

Decision: Kept offline-only assumptions, used deterministic stub providers, and documented in-memory reservation storage.

## Prompt - Provider abstraction and models
Prompt: "Generate provider abstraction and domain models for HotelStay.Api. Create enums and records for room type, cancellation policy, destination type, search request, room option, reserve request, and reservation response. Add IHotelProvider interface for search availability."

Output used: Generated `HotelStay.Api/Models/HotelStayModels.cs` and `HotelStay.Api/Models/IHotelProvider.cs` as the shared contract layer.

Decision: Chose a unified room option model and a simple interface contract to keep adding a third provider straightforward.

## Prompt - Provider implementations
Prompt: "Generate PremierStaysProvider and BudgetNestsProvider implementing IHotelProvider with deterministic behavior. PremierStays should return richer details and always available rooms; BudgetNests should return minimal details and include unavailable rooms deterministically."

Output used: Generated `PremierStaysProvider` and `BudgetNestsProvider` with deterministic pricing, cancellation policy mapping, and availability behavior.

Decision: Kept BudgetNests availability index-based (`index % 2 == 0`) to guarantee stable, repeatable test outcomes.

## Prompt - Search service and search endpoint
Prompt: "Implement HotelSearchService and GET /hotels/search Minimal API endpoint. Aggregate both providers, filter unavailable rooms, normalize output, sort by total price, and validate destination/checkIn/checkOut with 400 responses for invalid input."

Output used: Added `HotelSearchService` and wired `GET /hotels/search` in `Program.cs` with DI and request validation.

Decision: Recomputed total price in the service (`PerNightRate * nights`) to normalize provider output consistently.

## Prompt - DateOnly build fix
Prompt: "Fix build errors caused by subtracting DateOnly values in providers/services."

Output used: Replaced direct DateOnly subtraction with `CheckOut.DayNumber - CheckIn.DayNumber` in affected files.

Decision: Used `DayNumber` arithmetic for .NET 8 compatibility and explicit behavior.

Verification: Built the solution and confirmed all providers returned the expected total price calculations.

## Prompt - Reservation service
Prompt: "Implement ReservationService for reservation workflow. Use in-memory storage, generate reservation reference, validate request, and keep business logic inside the service."

Output used: Added `ReservationService` with in-memory `ConcurrentDictionary`, reference generation, validation, and lookup.

Decision: Defined destination groups as:
- Domestic cities: New York, Los Angeles
- International cities: London, Paris, Tokyo
Document rules:
- Domestic accepts NationalId or Passport
- International requires Passport

## Prompt - Reservation endpoints
Prompt: "Add reservation API endpoints in existing Minimal API style. Keep API layer thin and call IReservationService for workflow logic."

Output used: Added `POST /hotels/reserve` and `GET /hotels/reservation/{reference}` endpoint wiring in `Program.cs`.

Decision: Kept endpoint logic minimal (service invocation + HTTP mapping), with validation and business rules staying in `ReservationService`.

## Prompt - Comprehensive xUnit testing
Prompt: "Generate comprehensive xUnit tests for business rules, provider normalization, reservation flow, and API endpoints while keeping tests deterministic and minimizing production changes."

Output used: Added provider tests, service tests, and WebApplicationFactory-based API integration tests in `HotelStay.Tests`.

Decision: Added only minimal production test hook (`public partial class Program`) for integration testing, avoided changing business logic for test convenience.

## Prompt - Final review against challenge/spec for Backend

Prompt: "Review backend completeness against challenge.md and spec.md. Verify that all API endpoints, validation rules, provider behavior, normalization, reservation workflow, and extensibility requirements are implemented correctly. Capture significant prompts and key judgment calls."

Output used: Performed a requirement-by-requirement review of the backend implementation against the challenge specification and verified that the implemented functionality aligned with the documented design and API contracts.

Decision:
- Confirmed all required API endpoints, validation rules, and reservation workflows were implemented.
- Verified provider normalization, deterministic stub behavior, and dependency injection through the `IHotelProvider` abstraction.
- Confirmed business rules, error handling, and integration tests were aligned with the final implementation and documentation.

## Frontend development
## Prompt - React search form
Prompt: "Implement the hotel search feature in the existing React + Vite application. Add destination, check-in, check-out, and optional room-type inputs, client-side validation, loading/error states, and GET /hotels/search integration. Keep supported destinations aligned with the API."

Output used: Added the shared frontend models, `HotelSearchForm`, `searchHotels` API helper, and search state orchestration in `App.jsx`.

Decision: Mirrored the API's five supported destinations on the client so invalid destinations are rejected before a provider query is attempted, while retaining server-side validation as the authority.

## Prompt - Search results view
Prompt: "Implement the hotel search results view in React. Display provider badge, room type, per-night rate, total price, and cancellation policy; allow sorting by total price and room selection for reservation."

Output used: Added `SearchResultsView` with deterministic room keys, ascending/descending total-price sorting, selected-room styling, and responsive result cards.

Decision: Kept sorting client-side because the API already returns normalized room data and sorting has no impact on provider behavior or reservation correctness.

## Prompt - Frontend API proxy and enum serialization
Prompt: "Connect the React app to the .NET Minimal API during local development and ensure all API enums serialize as their string names globally."

Output used: Added the Vite `/hotels` proxy to `http://localhost:5299` and configured `JsonStringEnumConverter` through `ConfigureHttpJsonOptions` in the API.

Decision: Used a Vite proxy instead of hard-coding an API origin, so the frontend works locally with a relative base URL and remains configurable through `VITE_API_BASE_URL`.

## Prompt - Reservation form and confirmation
Prompt: "Implement the reservation feature in the React application. Collect guest name, document type, and document number; validate the document type for domestic and international destinations; call POST /hotels/reserve; replace the success message with a reservation confirmation view."

Output used: Added `ReservationForm`, `reserveRoom`, reservation validation, and `ReservationConfirmationPanel` wired to the selected room and API response.

Decision: Reused the selected room's price and cancellation values as safe fallbacks because the reservation response is authoritative for confirmation but the search result contains the provider-specific offer details displayed before reservation.

## Prompt - Reservation lookup
Prompt: "Implement a simple reservation lookup feature that uses GET /hotels/reservation/{reference}. Add a reference form, loading and not-found states, and reuse the existing confirmation layout for returned reservation details."

Output used: Added `lookupReservation`, `ReservationLookupForm`, lookup state in `App.jsx`, and a reusable confirmation-panel title/date display.

Decision: Represented a `404 Not Found` response as `null` in the API helper, allowing the UI to distinguish an unknown reference from transport or server errors.

## Prompt - Lookup destination response fix
Prompt: "Debug why the destination is not shown in reservation lookup results and fix the underlying issue."

Output used: Added `Destination` to `ReservationResponse`, populated it from `ReserveRoomRequest` in `ReservationService`, and extended service and API lookup tests.

Decision: Fixed the API contract rather than adding a frontend-only fallback because an in-memory lookup response must be self-contained and cannot reliably recover destination from prior client state.

Verification: Ran `dotnet test` successfully with 53 passing tests and restarted the local API on `http://localhost:5299`.

## Prompt - Final review against challenge/spec for Frontend

Prompt: "Review frontend completeness against challenge.md and spec.md. Verify that all required UI states, validation rules, search flow, reservation flow, reservation lookup, sorting, and API integrations are implemented correctly. Capture significant prompts and key judgment calls."

Output used: Performed a requirement-by-requirement review of the React application against the challenge specification and verified that the implemented functionality aligned with the documented design and user workflows.

Decision:
- Confirmed the search, reservation, confirmation, and reservation lookup workflows were fully implemented.
- Verified client-side validation, API integration, and UI state handling for loading, empty, error, and confirmation scenarios.
- Confirmed search result sorting, room selection, and reservation confirmation behavior were aligned with the final implementation and documented frontend design.

## Prompt - Documentation update for README and reflection

Prompt: "Update README.md and reflection.md for this Hotel Stay Availability challenge. README.md should include project overview, prerequisites, backend run steps, frontend run steps, test command, Swagger URL guidance, supported destinations, assumptions, API endpoints, and clean clone instructions. reflection.md should include what went well, key design decisions, how AI was used, and what I would improve with more time."

Output used: Updated `README.md` with complete run/test/API documentation and clean-clone guidance, and updated `reflection.md` with delivery outcomes, design rationale, AI usage summary, and improvement opportunities.

Decision:
- Documented runtime guidance for both backend and frontend with explicit local URLs and command flow.
- Captured API behavior and expected status codes for search, reservation, and lookup endpoints.
- Added a concise retrospective to reflect implementation strengths and prioritized next improvements.


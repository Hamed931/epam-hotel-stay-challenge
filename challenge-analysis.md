# Challenge Analysis

## 1. Challenge Summary

The challenge is to build a Hotel Stay Availability feature for the SkyRoute platform. A traveller selects a destination, check-in and check-out dates, and an optional room type, and the system returns a normalized list of available rooms from two stub hotel providers. The traveller can then reserve a room, with document validation applied at reservation time. The solution must run completely offline, require no authentication or persistence, and be designed so that a third provider can be added with minimal effort.

## 2. Functional Requirements

- Allow a traveller to search for hotel rooms using:
  - destination
  - check-in date
  - check-out date
  - optional room type

- Query two stub providers:
  - PremierStays
  - BudgetNests

- Filter out rooms that are marked as unavailable.

- Normalize provider-specific responses into a unified room list.

- Display room information including:
  - provider badge
  - room type
  - per-night rate
  - total stay price
  - cancellation policy

- Support sorting of results by total price.

- Allow reservation of a selected room using:
  - guest name
  - document type
  - document number

- Validate the supplied document based on whether the destination is domestic or international.

- Return reservation details using a reservation reference number.

## 3. Non-Functional Requirements

- The application must run completely offline.
- No authentication is required.
- No persistence is required.
- The solution should be easy to extend with a third provider.
- The backend must use the specified .NET 8+ Minimal API stack in C#.
- The frontend may be implemented using Angular, React, Blazor, or plain HTML/JS.
- Testing should use xUnit or NUnit.
- AI tooling is required in the development workflow, and prompts should be documented.

## 4. Business Rules

- PremierStays provides fuller information than BudgetNests.
- PremierStays returns PascalCase JSON, while BudgetNests returns snake_case JSON.
- PremierStays is always available, while BudgetNests may return an unavailable room.
- PremierStays supports cancellation policies of FreeCancellation (48h) or NonRefundable.
- BudgetNests supports cancellation policies of Flexible (24h) or NonRefundable.
- Both providers support the room types Standard, Deluxe, and Suite.
- These room types must be mapped to a unified enum.
- The system should present a normalized view of price and cancellation policy to the traveller.

## 5. Validation Rules

- Required search parameters are:
  - destination
  - checkIn
  - checkOut

- The check-out date must be later than the check-in date.

- Document validation depends on the destination type:
  - International destination → Passport required
  - Domestic destination → National ID accepted

- At least two domestic cities must be defined.
- At least three international cities must be defined.
- Validation must occur on both client and server.
- If the document does not match the expected type, the server must return HTTP 422 with a clear message.

## 6. API Requirements

### Search API
- Endpoint: GET /hotels/search
- Required query parameters:
  - destination
  - checkIn
  - checkOut
- Optional query parameter:
  - roomType

Expected behavior:
- Query both providers
- Filter unavailable rooms
- Normalize provider responses
- Return a unified room list
- Return HTTP 400 if required parameters are missing
- Return HTTP 400 if checkOut is less than or equal to checkIn

### Reservation API
- Endpoint: POST /hotels/reserve
- Must validate documents
- Must confirm the reservation
- Must return a reservation reference number

### Reservation Lookup API
- Endpoint: GET /hotels/reservation/{reference}
- Must return reservation details

### Additional API Constraints
- The solution should use IHotelProvider.
- Two dependency-injected stub implementations should be provided.
- Provider behavior should be deterministic.

## 7. Frontend Requirements

### Search
The frontend must provide inputs for:
- destination
- check-in date
- check-out date
- optional room type

### Results
The results view must show:
- provider badge
- room type
- per-night rate
- total price
- cancellation policy

Results should be sortable by total price.

### Reservation
The reservation screen must collect:
- guest name
- document type
- document number

### Confirmation
The confirmation screen must display:
- reference number
- provider
- total price
- cancellation policy

## 8. Testing Requirements

- Meaningful unit tests are required.
- The application must be verified to run from a clean clone.
- All APIs should work correctly.
- The reservation flow should complete successfully.
- The frontend should show all required states.
- AI-assisted development should be documented.

## 9. Architecture Considerations

- The solution should separate provider-specific logic from the shared search and reservation flow.
- Provider-specific concerns should be isolated behind a common abstraction so the core search and reservation workflow remains independent of provider implementations.
- Validation logic should be separated from request handling so it can be enforced consistently on both client and server.
- The design should support offline execution with stub providers and no external dependencies.
- The architecture should make it straightforward to introduce a third provider.

## 10. Extensibility Considerations

- A third provider can be added by implementing the shared provider abstraction.
- Room type mapping should remain centralized to avoid duplication.
- Provider-specific differences should be handled in a contained layer rather than distributed across the application.
- The normalization and validation layers should remain reusable as the feature evolves.

## 11. Assumptions

- The exact response schema for each provider is not defined in the brief.
- The exact format of the reservation reference number is not specified.
- The list of domestic and international cities is not provided.
- The brief does not define how reservations should be stored or retained.
- The exact UI framework is not prescribed.
- The brief does not define the currency or locale for pricing.
- The brief does not define all acceptable document types beyond passport and national ID.

## 12. Risks and Ambiguities

- The provider response structures are not fully specified, which could create design ambiguity.
- The document validation rules are only partly defined and may need clarification around accepted formats.
- The challenge does not define the exact error payloads or messages for each API.
- The reservation lifecycle is not fully described, including whether reservations persist beyond a single session.
- The expected behaviour for equal-priced results is not specified.

## 13. Questions for the Product Owner

- Which frontend framework should be used: Angular, React, Blazor, or plain HTML/JS?
- Which specific domestic cities should be supported?
- Which specific international cities should be supported?
- What document types should be accepted beyond passport and national ID?
- What should the reservation reference format look like?
- Should reservations be retained only for the current runtime, or should they persist across restarts?
- What should the exact API response payloads and error messages look like?
- How should results be ordered when two total prices are equal?

## 14. Recommended Implementation Order

1. Challenge analysis
2. Prepare specification (spec.md)
3. Define domain model
4. Define provider abstraction
5. Implement stub providers
6. Implement search functionality
7. Implement reservation functionality
8. Implement API endpoints
9. Implement React frontend
10. Add automated tests
11. Document AI usage and finalize project documentation

1. Confirm open questions and assumptions with the Product Owner.
2. Define the shared domain model for rooms, reservations, and validation rules.
3. Implement the provider abstraction and the two stub provider implementations.
4. Implement the search flow, including provider querying, filtering, and normalization.
5. Implement document validation and reservation handling.
6. Implement reservation lookup support.
7. Build the frontend experience for search, results, reservation, and confirmation.
8. Add automated tests for validation, provider behavior, API flows, and reservation logic.
9. Document prompts and finalize usage instructions for running the application from a clean clone.

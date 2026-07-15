# Hotel Stay Availability Solution Design

## Project Overview

Build an offline hotel availability and reservation experience for the SkyRoute platform. The solution aggregates stub hotel data from two providers, normalizes response formats, validates traveller documents by destination type, and supports a complete search-to-reservation flow without persistence or external APIs.

The backend will be implemented as a .NET 8+ Minimal API in C#. The frontend will use React with Vite to deliver a responsive search, results, reservation, and confirmation experience.

## Assumptions

- Domestic and international city lists are hard-coded for offline use.
- Document validation only considers "Passport" and "National ID" as valid document types.
- Reservation data is stored in-memory for the lifetime of the application.
- Pricing uses a single currency and no localization beyond simple formatting.
- The reservation reference is a deterministic runtime-generated identifier.
- Provider response schemas are stubbed to reflect PascalCase for PremierStays and snake_case for BudgetNests.
- No authentication or external persistence is required.

## Functional Requirements

- Search hotel availability by destination, check-in, check-out, and optional room type.
- Query both stub providers and return only available rooms.
- Normalize provider-specific responses into a shared room model.
- Display per-night rate, total stay price, provider badge, room type, and cancellation policy.
- Allow travellers to reserve a selected room with guest name, document type, and document number.
- Validate documents on both client and server.
- Return a reservation reference number after successful booking.
- Support reservation lookup by reference number.

## Non-Functional Requirements

- Must run completely offline with no external API calls.
- Must use .NET 8+ Minimal API for the backend.
- Frontend must be built with React and Vite.
- Must include xUnit tests for backend business logic and API integration, with frontend component and utility tests using Vitest.
- Service behavior must be deterministic for provider stubs.
- Design must make adding a third provider straightforward.
- Validation rules must be reusable and consistent across client and server.

## Domain Model

- `DestinationType` enum: `Domestic`, `International`.
- `RoomType` enum: `Standard`, `Deluxe`, `Suite`.
- `CancellationPolicy` enum: `FreeCancellation48h`, `Flexible24h`, `NonRefundable`.
- `HotelRoom` domain model:
  - `ProviderName`
  - `RoomType`
  - `PerNightRate`
  - `TotalPrice`
  - `CancellationPolicy`
  - `Amenities` (optional)
  - `StarRating` (optional)
  - `Available`
- `SearchRequest`:
  - `Destination`
  - `CheckIn`
  - `CheckOut`
  - `RoomType` (optional)
- `ReservationRequest`:
  - `ReferenceRoomId`
  - `GuestName`
  - `DocumentType`
  - `DocumentNumber`
  - `Destination`
- `Reservation`:
  - `Reference`
  - `HotelRoom`
  - `GuestName`
  - `DocumentType`
  - `DocumentNumber`
  - `Destination`
  - `TotalPrice`
  - `CancellationPolicy`
  - `CreatedAt`

## Provider Abstraction

- Define `IHotelProvider` with:
  - `Task<IEnumerable<ProviderRoomResponse>> SearchAsync(SearchRequest request)`
  - `string ProviderName { get; }`
- Implement two stub providers:
  - `PremierStaysProvider`
  - `BudgetNestsProvider`
- Each provider returns a provider-specific response object and the shared normalization layer maps it to `HotelRoom`.
- The provider layer is responsible for stub data and deterministic availability rules.
- Use DI to inject all providers into the search service.

## API Contracts

### GET /hotels/search

Request:
- `destination` (required)
- `checkIn` (required, ISO date)
- `checkOut` (required, ISO date)
- `roomType` (optional)

Responses:
- `200 OK` with body `HotelRoom[]`
- `400 Bad Request` for missing parameters or invalid date range
- `422 Unprocessable Entity` for validation mismatches

### POST /hotels/reserve

Request body:
- `roomId` or provider room identifier
- `destination`
- `guestName`
- `documentType`
- `documentNumber`
- `checkIn`
- `checkOut`

Responses:
- `201 Created` with body `{ reference: string, provider: string, totalPrice: decimal, cancellationPolicy: string }`
- `400 Bad Request` for missing required fields
- `422 Unprocessable Entity` if document validation fails

### GET /hotels/reservation/{reference}

Responses:
- `200 OK` with reservation details
- `404 Not Found` if reference is unknown

## Business Rules

- PremierStays returns full details and always provides available rooms.
- BudgetNests returns minimal details and may include unavailable rooms.
- Only available rooms should be returned in `/hotels/search`.
- Room type values from both providers map to a shared `RoomType` enum.
- Domestic destinations accept national ID; international destinations require passport.
- `checkOut` must be strictly later than `checkIn`.
- Search requests with missing required fields return `400 Bad Request`.
- Reservation validation failures return `422 Unprocessable Entity` with clear messages.

## Validation Rules

- Search input:
  - `destination` must be provided.
  - `checkIn` and `checkOut` must be valid dates.
  - `checkOut` must be after `checkIn`.
- Reservation input:
  - `guestName`, `documentType`, and `documentNumber` are required.
  - Document type must match destination type:
    - international → `Passport`
    - domestic → `National ID` or equivalent
- Client-side validation mirrors server rules.
- Error payloads include a clear validation message suitable for frontend display.

## Error Handling

- Centralize API error responses via middleware or a shared response model.
- Return `400` for malformed or missing query/JSON input.
- Return `422` for business validation failures such as document type mismatch.
- Return `404` for unknown reservation references.
- Validation responses include a human-readable message explaining the validation failure.
- Keep error messages user-friendly and suitable for frontend display.

## High-Level Architecture

- Backend
  - Minimal API entrypoint
  - `SearchService` aggregates providers and returns normalized rooms
  - `ReservationService` validates documents, confirms reservations, and stores references in-memory
  - Provider abstraction layer with `IHotelProvider`
  - Validation layer for shared business rules
  - DTOs and domain models for request/response mapping
- Frontend
  - React application bootstrapped with Vite
  - Pages/components for search, results, reservation, and confirmation
  - API client layer for backend calls
  - Shared validation and UI state handling
- Data
  - In-memory reservation store for runtime persistence only
  - Hard-coded destination classification for domestic/international logic

## Frontend Design (React + Vite)

- Pages/Views:
  - `SearchPage` for destination, check-in, check-out, room type
  - `ResultsPage` for normalized room list, sorting, and selection
  - `ReservationPage` for guest details and documents
  - `ConfirmationPage` for reservation summary
- Components:
  - `DestinationSelector`
  - `DateRangeInput`
  - `RoomCard` with provider badge, rates, and cancellation policy
  - `SortControl` for total price ordering
  - `ReservationForm` with document validation hints
  - `ErrorBanner` for validation and API error display
- Data flow:
  - Use React hooks and state to manage search criteria, selection, and reservation data
  - Fetch search results from `/hotels/search`
  - Post reservation to `/hotels/reserve`
  - Navigate to confirmation on success
- UI considerations:
  - Show loading states and empty/no-results screens
  - Display validation errors inline on the form
  - Keep the UI simple and responsive for offline use

## Testing Strategy (xUnit)

### Backend Tests
- Unit tests for provider normalization and room mapping
- Validation tests for search and reservation business rules
- Business rule tests for domestic/international destination logic
- Integration tests for the search, reservation, and reservation lookup API endpoints using `WebApplicationFactory`
- Deterministic tests using offline stub provider data

### Frontend Tests
- Component and utility tests using Vitest where appropriate
- Client-side validation tests for required fields and document type rules
- API helper tests using mocked responses to verify frontend integration logic

### Test Setup
- Backend runs from a clean clone using deterministic stub providers
- Frontend tests run using Vitest against mocked API responses where applicable
- Test data remains consistent with backend provider behavior to ensure repeatable results

## Extensibility Strategy

- Provider abstraction ensures new providers only need to implement `IHotelProvider`.
- Centralize room type mapping and cancellation policy normalization.
- Keep provider-specific JSON parsing isolated in the provider layer.
- Use a shared search service to add provider implementations via dependency injection.
- Keep validation rules in reusable classes or helpers.
- Design API DTOs to remain stable while supporting additional metadata fields.
- Use feature flags or configuration objects if extra provider behavior is introduced.

## Risks and Future Enhancements

- Risk: provider response schema assumptions may differ from actual provider data.
- Risk: document validation could require additional document types or format rules.
- Risk: in-memory reservation storage is not persistent and will reset on restart.
- Risk: no authentication means the reservation flow is not secure for real deployments.
- Future enhancement: add persistent storage for reservations.
- Future enhancement: introduce provider configuration and runtime provider selection.
- Future enhancement: support additional document types and destination classifications.
- Future enhancement: add currency formatting, locale support, and price breakdown details.
- Future enhancement: add analytics or booking history if persistence becomes available.

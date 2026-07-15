# Hotel Stay Availability Challenge

## Context

Build a Hotel Availability feature for the SkyRoute platform.

A traveller selects a destination, check-in/check-out dates, and an optional room type. The system returns a normalised list of available rooms from two stub providers.

The traveller reserves a room, with document validation applied at reservation time.

No starter code is provided. Take this from brief to a running application:
- Analysis
- Design
- Implementation
- Tests
- Documentation

---

## Functional Requirements

### Providers

| Feature | PremierStays | BudgetNests |
|---------|--------------|-------------|
| Detail Level | Full – rate, cancellation policy, amenities, star rating | Minimal – rate and policy only |
| Response Format | PascalCase JSON | snake_case JSON |
| Availability | Always available | May return `"available": false` |
| Cancellation | FreeCancellation (48h) or NonRefundable | Flexible (24h) or NonRefundable |

Both providers support:

- Standard
- Deluxe
- Suite

Map them to a unified enum.

Display:
- Per-night rate
- Total stay price

---

## Document Validation

- International destination → Passport required
- Domestic destination → National ID accepted
- Define at least 2 domestic cities
- Define at least 3 international cities
- Validate on both client and server
- Return HTTP 422 with a clear message on mismatch

---

## API

### GET /hotels/search

- destination (required)
- checkIn (required)
- checkOut (required)
- roomType (optional)

Requirements:

- Query both providers
- Filter unavailable rooms
- Normalize provider responses
- Return unified room list
- Return HTTP 400 if required parameters are missing
- Return HTTP 400 if checkOut <= checkIn

### POST /hotels/reserve

- Validate documents
- Confirm reservation
- Return reservation reference number

### GET /hotels/reservation/{reference}

- Return reservation details

Additional Requirements:

- Use IHotelProvider
- Two DI-injected stub implementations
- Deterministic provider behavior

---

## Frontend

### Search

- Destination
- Check-in
- Check-out
- Optional room type

### Results

- Provider badge
- Room type
- Per-night rate
- Total price
- Cancellation policy
- Sort by total price

### Reservation

- Guest name
- Document type
- Document number

### Confirmation

- Reference number
- Provider
- Total price
- Cancellation policy

---

## Scope

- No real hotel APIs
- No authentication
- No persistence
- Must run completely offline
- Easy to add a third provider

---

## Tech Stack

### Backend

- .NET 8+ Minimal API
- C#

### Frontend

- Angular, React, Blazor, or plain HTML/JS

### Testing

- xUnit or NUnit

### AI Tooling

- IDE-integrated AI tool required
- Document important prompts in prompts.md

---

## Submission Structure

```text
hotel-stay/
├── README.md
├── spec.md
├── HotelStay.Api/
├── HotelStay.Tests/
├── <case-name>-ui/
├── prompts.md
└── reflection.md
```

---

## Evaluation Criteria

- Design & Architecture
- Code Quality
- AI Usage
- Operability
- Delivery

---

## Definition of Done

- Application runs from a clean clone
- All APIs work correctly
- Reservation flow completes successfully
- Frontend shows all required states
- Meaningful unit tests
- AI usage documented
- spec.md committed before implementation
- No secrets committed
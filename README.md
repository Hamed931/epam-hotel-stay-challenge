# Hotel Stay Availability Challenge

## Project Overview

This repository contains a complete offline implementation of the SkyRoute Hotel Stay Availability challenge.

The solution includes:
- A .NET 8 Minimal API backend that supports hotel search, reservation, and reservation lookup
- A React + Vite frontend that covers search, results sorting, reservation, confirmation, and lookup flows
- Deterministic in-memory stub providers for repeatable behavior
- Automated backend and frontend test coverage

## Prerequisites

Install these tools before running from a clean machine:
- .NET SDK 8.0+
- Node.js 18+ and npm
- Git

## Backend Run Steps

From the repository root:

```bash
cd HotelStay.Api
dotnet run --launch-profile http
```

Expected backend URL:
- `http://localhost:5299`

Notes:
- Reservation data is in-memory only.
- Restarting the backend clears reservation records.

## Frontend Run Steps

Use a second terminal from the repository root:

```bash
cd hotel-stay-ui
npm install
npm run dev
```

Then open the Vite URL shown in terminal (commonly `http://localhost:5173`).

Frontend-to-backend integration:
- During local development, `/hotels/*` calls are proxied to `http://localhost:5299`.
- Keep the backend running before using the UI flows.

## Test Command

From repository root:

```bash
dotnet test
```

For frontend tests:

```bash
cd hotel-stay-ui
npm test
```

## Swagger URL Guidance

When running `HotelStay.Api` with the `http` launch profile:
- Swagger UI: `http://localhost:5299/swagger`

If running with the default development profile (HTTPS enabled):
- Swagger UI is typically available at `https://localhost:7096/swagger`
- HTTP endpoint is typically also available at `http://localhost:5299/swagger`

## Supported Destinations

Supported destinations enforced by client and server:
- New York
- Los Angeles
- London
- Paris
- Tokyo

Destination groups used for document validation:
- Domestic: New York, Los Angeles
- International: London, Paris, Tokyo

## Assumptions

- The application runs fully offline.
- Provider behavior is deterministic and stubbed.
- There is no authentication/authorization in challenge scope.
- Reservation persistence is in-memory only.
- API enums are serialized as string values.
- Currency formatting is fixed to a single locale/currency for demo purposes.

## API Endpoints

### GET /hotels/search

Query parameters:
- `destination` (required)
- `checkIn` (required, `yyyy-MM-dd`)
- `checkOut` (required, `yyyy-MM-dd`)
- `roomType` (optional: `Standard`, `Deluxe`, `Suite`)

Behavior:
- Queries both providers
- Normalizes provider responses
- Filters unavailable rooms
- Returns unified room list sorted by total price

Common responses:
- `200 OK` on success
- `400 Bad Request` for missing/invalid inputs (including `checkOut <= checkIn`)

### POST /hotels/reserve

Request body fields:
- `providerName`
- `roomId`
- `destination`
- `checkIn`
- `checkOut`
- `roomType`
- `guestName`
- `documentType` (`Passport` or `NationalId`)
- `documentNumber`

Behavior:
- Validates document rules by destination type
- Creates reservation reference
- Stores reservation in memory

Common responses:
- `201 Created` on success (with `Location: /hotels/reservation/{reference}`)
- `422 Unprocessable Entity` for document mismatch
- `400 Bad Request` for other invalid request data

### GET /hotels/reservation/{reference}

Behavior:
- Returns reservation details for a known reference

Common responses:
- `200 OK` when found
- `404 Not Found` when reference does not exist

## Clean Clone Instructions

Use these steps to verify project operability from scratch.

1. Clone and open the repository:

```bash
git clone <your-repository-url>
cd Epam-HotelStay
```

2. Restore and build:

```bash
dotnet restore
dotnet build
```

3. Install frontend dependencies:

```bash
cd hotel-stay-ui
npm install
cd ..
```

4. Run automated tests:

```bash
dotnet test
cd hotel-stay-ui
npm test
cd ..
```

5. Start backend:

```bash
cd HotelStay.Api
dotnet run --launch-profile http
```

6. Start frontend in a second terminal:

```bash
cd hotel-stay-ui
npm run dev
```

7. Verify end-to-end behavior manually:
- Perform a search with supported destination and valid dates
- Select a room and submit reservation with valid document type
- Copy reservation reference and confirm lookup flow

## Repository Artifacts

- `spec.md`: final design and architecture
- `challenge.md`: original challenge brief
- `prompts.md`: significant AI prompts and implementation decisions
- `reflection.md`: post-implementation reflection
